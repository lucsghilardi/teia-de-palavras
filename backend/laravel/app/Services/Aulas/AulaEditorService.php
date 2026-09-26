<?php

namespace App\Services\Aulas;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Models\AulaFamilia;
use App\Models\AulaHistoriaPagina;
use App\Models\AulaPalavra;
use App\Models\AulaPergunta;
use App\Models\AulaSilaba;
use App\Models\Palavra;
use App\Models\Silaba;
use App\Models\User;
use App\Services\Atividades\RegistroAtividades;
use App\Services\Palavras\Silabador;
use App\Services\Palavras\SugestorFamilia;
use App\Support\Midia;
use App\Support\Texto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Regras do CMS de aulas: criação (com sugestão de sílabas/famílias em
 * Português), edição do documento inteiro (filhos sincronizados, atividades
 * validadas pelo registro de tipos), publicação e ordem.
 */
class AulaEditorService
{
    /** Relações que o editor e a API precisam carregadas. */
    public const RELACOES = [
        'silabas.silaba',
        'silabas.familia.silaba',
        'historiaPaginas',
        'perguntas',
        'palavras',
        'atividades',
        'criadaPor:id,name',
    ];

    /**
     * @param array{titulo: string, palavra_geradora?: string|null, fase: int, disciplina?: string,
     *               rotulo?: string|null, descricao?: string|null, habilidade_bncc?: string|null} $dados
     */
    public function criar(array $dados, ?User $autor): Aula
    {
        return DB::transaction(function () use ($dados, $autor) {
            $disciplina = Disciplina::tryFrom((string) ($dados['disciplina'] ?? '')) ?? Disciplina::padrao();
            $palavra = $disciplina->temPalavraGeradora()
                ? mb_strtoupper(trim((string) ($dados['palavra_geradora'] ?? '')), 'UTF-8')
                : null;
            $fase = (int) $dados['fase'];

            $aula = Aula::create([
                'slug' => $this->slugUnico($dados['titulo']),
                'disciplina' => $disciplina->value,
                'titulo' => trim($dados['titulo']),
                'rotulo' => $this->textoOuNulo($dados['rotulo'] ?? null),
                'descricao' => $this->textoOuNulo($dados['descricao'] ?? null),
                'habilidade_bncc' => $this->textoOuNulo($dados['habilidade_bncc'] ?? null),
                'fase' => $fase,
                'ordem' => (int) Aula::daDisciplina($disciplina)->where('fase', $fase)->max('ordem') + 1,
                'palavra_geradora' => $palavra ?: null,
                'status' => Aula::STATUS_RASCUNHO,
                'criada_por_user_id' => $autor?->id,
                // Por padrão, a nova missão vem depois da última da mesma disciplina
                // (nesta fase ou nas anteriores).
                'pre_requisito_aula_id' => Aula::query()->daDisciplina($disciplina)->where('fase', '<=', $fase)->ordenadas()->get()->last()?->id,
            ]);

            if ($palavra) {
                $silabas = array_map(
                    fn (string $s) => ['texto' => $s, 'familia' => SugestorFamilia::para($s)],
                    Silabador::separar($palavra),
                );

                $this->sincronizarSilabas($aula, $silabas);
            }

            AtividadesPadrao::garantir($aula);

            return $aula->load(self::RELACOES);
        });
    }

    /**
     * Grava o documento completo da aula. Páginas, perguntas, palavras e
     * atividades com `id` são atualizadas (preservando a mídia); as sem `id`
     * são criadas; as que sumiram são apagadas junto com a mídia. Sílabas e
     * famílias são recriadas. Chaves ausentes no documento não são tocadas
     * (uma aula de Matemática pode mandar só `atividades`).
     *
     * @param  array<string, mixed>  $dados
     */
    public function atualizar(Aula $aula, array $dados, ?User $autor = null): Aula
    {
        $disciplina = $aula->disciplinaEnum();
        $palavraGeradora = $disciplina->temPalavraGeradora()
            ? mb_strtoupper(trim((string) ($dados['palavra_geradora'] ?? $aula->palavra_geradora ?? '')), 'UTF-8')
            : null;
        $silabas = array_key_exists('silabas', $dados) ? $this->normalizarSilabas($dados['silabas'] ?? []) : null;
        $palavras = array_key_exists('palavras', $dados) ? $this->normalizarPalavras($dados['palavras'] ?? []) : null;
        $atividades = array_key_exists('atividades', $dados) ? $this->normalizarAtividades($dados['atividades'] ?? []) : null;
        $preRequisito = $dados['pre_requisito_aula_id'] ?? null;

        $erros = [];

        if ($palavraGeradora !== null && $silabas !== null && $silabas !== []
            && Texto::juntarNormalizado(array_column($silabas, 'texto')) !== Texto::normalizar($palavraGeradora)) {
            $erros['silabas'] = 'As sílabas precisam formar a palavra geradora '.$palavraGeradora.'.';
        }

        if ($preRequisito !== null && $this->criaCiclo($aula, (int) $preRequisito)) {
            $erros['pre_requisito_aula_id'] = 'Esse pré-requisito criaria um ciclo entre as aulas.';
        }

        if ($aula->estaPublicada()) {
            $aula->loadCount(['silabas', 'historiaPaginas', 'palavras', 'atividades']);
            $pendencias = $this->pendencias(
                $disciplina,
                $silabas === null ? $aula->silabas_count : count($silabas),
                array_key_exists('historia_paginas', $dados) ? count($dados['historia_paginas'] ?? []) : $aula->historia_paginas_count,
                $palavras === null ? $aula->palavras_count : count($palavras),
                $atividades === null ? $aula->atividades_count : count($atividades),
            );

            if ($pendencias !== []) {
                $erros['status'] = 'Aula publicada não pode ficar sem: '.implode(', ', $pendencias).'. Despublique antes.';
            }
        }

        if ($erros !== []) {
            throw ValidationException::withMessages($erros);
        }

        return DB::transaction(function () use ($aula, $dados, $palavraGeradora, $silabas, $palavras, $atividades, $preRequisito, $autor) {
            $aula->update([
                'titulo' => trim((string) $dados['titulo']),
                'palavra_geradora' => $palavraGeradora ?: null,
                'fase' => (int) $dados['fase'],
                'pre_requisito_aula_id' => $preRequisito,
                'rotulo' => array_key_exists('rotulo', $dados) ? $this->textoOuNulo($dados['rotulo']) : $aula->rotulo,
                'descricao' => array_key_exists('descricao', $dados) ? $this->textoOuNulo($dados['descricao']) : $aula->descricao,
                'habilidade_bncc' => array_key_exists('habilidade_bncc', $dados) ? $this->textoOuNulo($dados['habilidade_bncc']) : $aula->habilidade_bncc,
            ]);

            if ($silabas !== null) {
                $this->sincronizarSilabas($aula, $silabas);
            }

            if (array_key_exists('historia_paginas', $dados)) {
                $this->sincronizarTextos($aula, AulaHistoriaPagina::class, $dados['historia_paginas'] ?? [], 'historia_paginas', ['imagem_path', 'audio_path']);
            }

            if (array_key_exists('perguntas', $dados)) {
                $this->sincronizarTextos($aula, AulaPergunta::class, $dados['perguntas'] ?? [], 'perguntas', ['audio_path']);
            }

            if ($palavras !== null) {
                $this->sincronizarPalavras($aula, $palavras, $autor);
            }

            if ($atividades !== null) {
                $this->sincronizarAtividades($aula, $atividades);
            } else {
                AtividadesPadrao::garantir($aula);
            }

            return $aula->fresh(self::RELACOES);
        });
    }

    public function publicar(Aula $aula): Aula
    {
        $aula->loadCount(['silabas', 'historiaPaginas', 'palavras', 'atividades']);
        $pendencias = $this->pendencias(
            $aula->disciplinaEnum(),
            $aula->silabas_count,
            $aula->historia_paginas_count,
            $aula->palavras_count,
            $aula->atividades_count,
        );

        if ($pendencias !== []) {
            throw ValidationException::withMessages([
                'status' => 'Para publicar, falta: '.implode(', ', $pendencias).'.',
            ]);
        }

        $aula->update(['status' => Aula::STATUS_PUBLICADA]);

        return $aula->fresh(self::RELACOES);
    }

    public function despublicar(Aula $aula): Aula
    {
        $aula->update(['status' => Aula::STATUS_RASCUNHO]);

        return $aula->fresh(self::RELACOES);
    }

    /** @param list<int> $ids ordem nova, todos da mesma disciplina e fase */
    public function reordenar(array $ids): void
    {
        $aulas = Aula::query()->whereIn('id', $ids)->get(['id', 'fase', 'disciplina']);

        if ($aulas->count() !== count(array_unique($ids))) {
            throw ValidationException::withMessages(['ordem' => 'Há aulas inexistentes na lista.']);
        }

        if ($aulas->map(fn (Aula $a) => $a->disciplina.'/'.$a->fase)->unique()->count() > 1) {
            throw ValidationException::withMessages(['ordem' => 'Só é possível reordenar aulas da mesma disciplina e fase.']);
        }

        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $posicao => $id) {
                Aula::whereKey($id)->update(['ordem' => $posicao + 1]);
            }
        });
    }

    public function apagar(Aula $aula): void
    {
        if ($aula->estaPublicada()) {
            throw ValidationException::withMessages(['status' => 'Despublique a aula antes de apagar.']);
        }

        if ($aula->progressos()->exists()) {
            throw ValidationException::withMessages(['status' => 'Crianças já passaram por esta aula; ela não pode ser apagada.']);
        }

        DB::transaction(function () use ($aula) {
            $aula->load(['historiaPaginas', 'perguntas', 'palavras', 'atividades']);

            Midia::apagar(
                $aula->palavra_imagem_path,
                $aula->palavra_audio_path,
                ...$aula->historiaPaginas->flatMap(fn ($p) => [$p->imagem_path, $p->audio_path])->all(),
                ...$aula->perguntas->pluck('audio_path')->all(),
                ...$aula->palavras->flatMap(fn ($p) => [$p->imagem_path, $p->audio_path])->all(),
                ...$aula->atividades->pluck('imagem_path')->all(),
            );

            $aula->delete();
        });
    }

    /**
     * O que falta para uma aula poder ser publicada. Português exige o
     * material da palavra geradora; toda disciplina exige ao menos uma atividade.
     *
     * @return list<string>
     */
    public function pendencias(Disciplina $disciplina, int $silabas, int $paginas, int $palavras, int $atividades): array
    {
        $lista = [];

        if ($disciplina->temPalavraGeradora()) {
            $lista[] = $silabas < 1 ? 'ao menos uma sílaba' : null;
            $lista[] = $paginas < 1 ? 'ao menos uma página de história' : null;
            $lista[] = $palavras < 1 ? 'ao menos uma palavra no dicionário da aula' : null;
        }

        $lista[] = $atividades < 1 ? 'ao menos uma atividade' : null;

        return array_values(array_filter($lista));
    }

    /**
     * @param  list<array{texto: string, familia: list<string>}>  $silabas
     */
    private function sincronizarSilabas(Aula $aula, array $silabas): void
    {
        $aula->silabas()->delete(); // famílias caem em cascata

        foreach ($silabas as $posicao => $item) {
            $aulaSilaba = AulaSilaba::create([
                'aula_id' => $aula->id,
                'silaba_id' => Silaba::obterOuCriar($item['texto'])->id,
                'ordem' => $posicao + 1,
            ]);

            foreach (array_values(array_unique($item['familia'])) as $ordem => $membro) {
                AulaFamilia::create([
                    'aula_id' => $aula->id,
                    'aula_silaba_id' => $aulaSilaba->id,
                    'silaba_id' => Silaba::obterOuCriar($membro)->id,
                    'ordem' => $ordem + 1,
                ]);
            }
        }
    }

    /**
     * Páginas da história e perguntas: só `texto` e ordem vêm do documento.
     *
     * @param  class-string<AulaHistoriaPagina|AulaPergunta>  $modelo
     * @param  list<array{id?: int|null, texto: string}>  $itens
     * @param  list<string>  $colunasMidia
     */
    private function sincronizarTextos(Aula $aula, string $modelo, array $itens, string $campo, array $colunasMidia): void
    {
        $existentes = $modelo::query()->where('aula_id', $aula->id)->get()->keyBy('id');
        $mantidos = [];

        foreach (array_values($itens) as $posicao => $item) {
            $id = isset($item['id']) ? (int) $item['id'] : null;

            if ($id !== null && ! $existentes->has($id)) {
                throw ValidationException::withMessages([$campo => 'Item de outra aula ou inexistente.']);
            }

            $dados = ['texto' => trim((string) $item['texto']), 'ordem' => $posicao + 1];

            if ($id !== null) {
                $existentes[$id]->update($dados);
                $mantidos[] = $id;
            } else {
                $modelo::create([...$dados, 'aula_id' => $aula->id]);
            }
        }

        $existentes->except($mantidos)->each(function ($item) use ($colunasMidia) {
            Midia::apagar(...array_map(fn ($c) => $item->{$c}, $colunasMidia));
            $item->delete();
        });
    }

    /**
     * Atividades: a posição no array é a ordem. Com `id` atualiza (mantendo a
     * imagem), sem `id` cria, ausentes são apagadas.
     *
     * @param  list<array{id: int|null, tipo: string, titulo: string|null, instrucao: string|null, config: array<string, mixed>}>  $itens
     */
    private function sincronizarAtividades(Aula $aula, array $itens): void
    {
        $existentes = AulaAtividade::query()->where('aula_id', $aula->id)->get()->keyBy('id');
        $mantidos = [];

        // Libera a unique (aula_id, ordem) antes de reatribuir as posições.
        AulaAtividade::query()->where('aula_id', $aula->id)->update(['ordem' => DB::raw('ordem + 1000')]);

        foreach ($itens as $posicao => $item) {
            $dados = [
                'ordem' => $posicao + 1,
                'tipo' => $item['tipo'],
                'titulo' => $item['titulo'],
                'instrucao' => $item['instrucao'],
                'config' => $item['config'],
            ];

            if ($item['id'] !== null) {
                if (! $existentes->has($item['id'])) {
                    throw ValidationException::withMessages(["atividades.$posicao.id" => 'Atividade de outra aula ou inexistente.']);
                }

                $existentes[$item['id']]->update($dados);
                $mantidos[] = $item['id'];
            } else {
                AulaAtividade::create([...$dados, 'aula_id' => $aula->id]);
            }
        }

        $existentes->except($mantidos)->each(function (AulaAtividade $a) {
            Midia::apagar($a->imagem_path);
            $a->delete();
        });
    }

    /**
     * @param  list<array{id: int|null, palavra: string, silabas: list<string>, destaque: bool}>  $palavras
     */
    private function sincronizarPalavras(Aula $aula, array $palavras, ?User $autor): void
    {
        $existentes = AulaPalavra::query()->where('aula_id', $aula->id)->get()->keyBy('id');
        $mantidos = [];

        // Apaga primeiro as removidas: libera a unique (aula_id, palavra_normalizada)
        // para quem estiver sendo recriado com a mesma grafia.
        $idsNoDocumento = array_filter(array_column($palavras, 'id'));
        $existentes->except($idsNoDocumento)->each(function (AulaPalavra $p) {
            Midia::apagar($p->imagem_path, $p->audio_path);
            $p->delete();
        });

        foreach ($palavras as $item) {
            $dados = ['palavra' => $item['palavra'], 'silabas' => $item['silabas'], 'destaque' => $item['destaque']];

            if ($item['id'] !== null) {
                if (! $existentes->has($item['id'])) {
                    throw ValidationException::withMessages(['palavras' => 'Palavra de outra aula ou inexistente.']);
                }

                $existentes[$item['id']]->update($dados);
                $mantidos[] = $item['id'];
            } else {
                AulaPalavra::create([...$dados, 'aula_id' => $aula->id]);
            }

            // Toda palavra de aula também vale no dicionário geral: a criança pode
            // formá-la de novo em aulas seguintes (famílias acumulam).
            $geral = Palavra::firstOrNew(['palavra_normalizada' => Texto::normalizar($item['palavra'])]);

            if (! $geral->exists || ! $geral->aprovada) {
                $geral->fill([
                    'palavra' => $item['palavra'],
                    'silabas' => $item['silabas'],
                    'origem' => $geral->exists ? $geral->origem : 'cms',
                    'aprovada' => true,
                    'aprovada_por_user_id' => $autor?->id,
                    'aprovada_em' => now(),
                ])->save();
            }
        }
    }

    /**
     * Valida tipo e config de cada atividade pelo avaliador do tipo.
     *
     * @param  list<array<string, mixed>>  $atividades
     * @return list<array{id: int|null, tipo: string, titulo: string|null, instrucao: string|null, config: array<string, mixed>}>
     */
    private function normalizarAtividades(array $atividades): array
    {
        $saida = [];

        foreach (array_values($atividades) as $indice => $item) {
            $tipo = trim((string) ($item['tipo'] ?? ''));

            if (! RegistroAtividades::existe($tipo)) {
                throw ValidationException::withMessages(["atividades.$indice.tipo" => "Tipo de atividade desconhecido: {$tipo}."]);
            }

            $config = is_array($item['config'] ?? null) ? $item['config'] : [];

            try {
                $config = RegistroAtividades::para($tipo)->validarConfig($config);
            } catch (ValidationException $e) {
                $mensagens = [];

                foreach ($e->errors() as $campo => $lista) {
                    $mensagens["atividades.$indice.$campo"] = $lista;
                }

                throw ValidationException::withMessages($mensagens);
            }

            $saida[] = [
                'id' => isset($item['id']) ? (int) $item['id'] : null,
                'tipo' => $tipo,
                'titulo' => $this->textoOuNulo($item['titulo'] ?? null),
                'instrucao' => $this->textoOuNulo($item['instrucao'] ?? null),
                'config' => $config,
            ];
        }

        return $saida;
    }

    /**
     * @param  list<array{texto?: string, familia?: list<string>}>  $silabas
     * @return list<array{texto: string, familia: list<string>}>
     */
    private function normalizarSilabas(array $silabas): array
    {
        $saida = [];

        foreach ($silabas as $item) {
            $texto = mb_strtoupper(trim((string) ($item['texto'] ?? '')), 'UTF-8');

            if ($texto === '') {
                continue;
            }

            $familia = array_values(array_filter(array_map(
                fn ($m) => mb_strtoupper(trim((string) $m), 'UTF-8'),
                $item['familia'] ?? [],
            ), fn (string $m) => $m !== ''));

            $saida[] = ['texto' => $texto, 'familia' => $familia];
        }

        return $saida;
    }

    /**
     * @param  list<array{id?: int|null, palavra?: string, silabas?: list<string>, destaque?: bool}>  $palavras
     * @return list<array{id: int|null, palavra: string, silabas: list<string>, destaque: bool}>
     */
    private function normalizarPalavras(array $palavras): array
    {
        $saida = [];
        $vistas = [];

        foreach ($palavras as $indice => $item) {
            $palavra = mb_strtoupper(trim((string) ($item['palavra'] ?? '')), 'UTF-8');

            if ($palavra === '') {
                continue;
            }

            $silabas = array_values(array_filter(array_map(
                fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'),
                $item['silabas'] ?? [],
            ), fn (string $s) => $s !== ''));

            if ($silabas === []) {
                $silabas = Silabador::separar($palavra);
            } elseif (Texto::juntarNormalizado($silabas) !== Texto::normalizar($palavra)) {
                throw ValidationException::withMessages([
                    "palavras.$indice.silabas" => "As sílabas de {$palavra} não formam a palavra.",
                ]);
            }

            $normalizada = Texto::normalizar($palavra);

            if (isset($vistas[$normalizada])) {
                throw ValidationException::withMessages([
                    "palavras.$indice.palavra" => "A palavra {$palavra} está repetida.",
                ]);
            }

            $vistas[$normalizada] = true;

            $saida[] = [
                'id' => isset($item['id']) ? (int) $item['id'] : null,
                'palavra' => $palavra,
                'silabas' => $silabas,
                'destaque' => (bool) ($item['destaque'] ?? false),
            ];
        }

        return $saida;
    }

    private function criaCiclo(Aula $aula, int $preRequisitoId): bool
    {
        if ($preRequisitoId === $aula->id) {
            return true;
        }

        $visitadas = [];
        $atual = $preRequisitoId;

        while ($atual !== null && ! isset($visitadas[$atual])) {
            if ($atual === $aula->id) {
                return true;
            }

            $visitadas[$atual] = true;
            $atual = Aula::whereKey($atual)->value('pre_requisito_aula_id');
        }

        return false;
    }

    private function textoOuNulo(mixed $valor): ?string
    {
        $texto = trim((string) ($valor ?? ''));

        return $texto === '' ? null : $texto;
    }

    private function slugUnico(string $titulo): string
    {
        $base = Str::slug($titulo) ?: 'aula';
        $slug = $base;
        $n = 2;

        while (Aula::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
