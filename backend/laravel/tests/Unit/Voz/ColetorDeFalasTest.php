<?php

use App\Models\Aula;
use App\Services\Atividades\Suporte\Mensagens;
use App\Services\Voz\ColetorDeFalas;

/*
| O coletor devolve tudo o que a criança pode ouvir vindo do conteúdo, já com
| {{heroi}}/{{fabrica}} trocados (o hash do cache é do texto final).
*/

it('recolhe mensagens fixas, conquistas e o conteúdo das missões com placeholders trocados', function () {
    semearConteudo();

    $frases = app(ColetorDeFalas::class)->coletar();

    expect($frases)->toContain(Mensagens::ERRO)
        ->toContain('isso!')
        ->toContain('Você ganhou uma conquista: Teia de 10 palavras!')   // exatamente como narrador.ts monta
        ->toContain('Teia de 10 palavras. Sua teia já tem 10 palavras. Ainda por ganhar.')
        ->toContain('TEIA')                          // palavra geradora
        ->toContain('Toque na resposta certa.')      // instrução das atividades semeadas
        ->toContain('Conte e toque no número certo.') // instrução de Matemática
        ->and($frases)->each->not->toContain('{{heroi}}')
        ->and(collect($frases)->filter(fn ($f) => str_contains($f, 'Teco'))->count())->toBeGreaterThan(0)
        ->and($frases)->toBe(array_values(array_unique($frases)));
});

it('só inclui missões publicadas, salvo quando pedido', function () {
    semearConteudo();
    Aula::query()->update(['status' => Aula::STATUS_RASCUNHO]);

    $publicadas = app(ColetorDeFalas::class)->coletar();
    $todas = app(ColetorDeFalas::class)->coletar(true);

    expect($publicadas)->not->toContain('TEIA')
        ->and($todas)->toContain('TEIA');
});
