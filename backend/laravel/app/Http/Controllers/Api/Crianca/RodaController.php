<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\ResponderAtividadeRequest;
use App\Models\Crianca;
use App\Models\TurmaSessao;
use App\Services\Roda\RodaService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A Roda pela criança: entrar, seguir o educador, propor e confirmar em dupla. */
class RodaController extends Controller
{
    public function __construct(private readonly RodaService $rodas) {}

    /** A roda aberta da turma (ou de uma turma amiga), para a Galáxia oferecer "entrar". */
    public function aberta(Request $request): JsonResponse
    {
        $roda = $this->rodas->abertaPara($this->crianca($request));

        return response()->json(['roda' => $roda ? $this->rodas->resumoAberta($roda) : null]);
    }

    public function entrar(Request $request): JsonResponse
    {
        $dados = $request->validate(['codigo' => ['nullable', 'string', 'max:12']]);
        $crianca = $this->crianca($request);
        $roda = $this->rodas->entrar($crianca, $dados['codigo'] ?? null);

        return response()->json($this->rodas->pacote($crianca, $roda));
    }

    public function show(Request $request, TurmaSessao $roda): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);

        return response()->json($this->rodas->pacote($crianca, $roda));
    }

    public function sair(Request $request, TurmaSessao $roda): JsonResponse
    {
        $this->rodas->sair($this->naRoda($request, $roda), $roda);

        return response()->json(['ok' => true]);
    }

    public function propor(ResponderAtividadeRequest $request, TurmaSessao $roda): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);

        return response()->json($this->rodas->estadoDupla($this->rodas->propor($crianca, $roda, $request->resposta())));
    }

    public function responder(Request $request, TurmaSessao $roda): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);
        $dados = $request->validate(['aceitar' => ['required', 'boolean']]);

        return response()->json($this->rodas->estadoDupla($this->rodas->responder($crianca, $roda, (bool) $dados['aceitar'])));
    }

    /** Sem dupla: uma palavra com as peças da roda (mesmo formato de /aulas/{id}/tentativas). */
    public function tentativa(Request $request, TurmaSessao $roda): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);
        $dados = $request->validate(['silabas' => ['required', 'array', 'min:1', 'max:6'], 'silabas.*' => ['string', 'max:8']]);

        return response()->json($this->rodas->tentarSozinha($crianca, $roda, $dados['silabas']));
    }

    /** Sem dupla: resposta a uma atividade avaliada (mesmo formato de /atividades/{ordem}/responder). */
    public function responderAtividade(ResponderAtividadeRequest $request, TurmaSessao $roda, int $ordem): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);

        return response()->json($this->rodas->responderSozinha($crianca, $roda, $ordem, $request->resposta()));
    }

    public function producao(Request $request, TurmaSessao $roda): JsonResponse
    {
        $crianca = $this->naRoda($request, $roda);
        $dados = $request->validate(['palavras' => ['required', 'array', 'min:1', 'max:12'], 'palavras.*' => ['string', 'max:40']]);

        try {
            return response()->json($this->rodas->producao($crianca, $roda, $dados['palavras']));
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    private function crianca(Request $request): Crianca
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');

        return $crianca;
    }

    /** A criança precisa ter entrado nesta roda (e a roda, existir para ela). */
    private function naRoda(Request $request, TurmaSessao $roda): Crianca
    {
        $crianca = $this->crianca($request);

        abort_unless($this->rodas->podeEntrar($crianca, $roda) || $roda->status === TurmaSessao::ENCERRADA, 404, 'Não achei essa roda.');
        abort_unless($this->rodas->participa($crianca, $roda), 403, 'Entre na roda primeiro.');

        return $crianca;
    }
}
