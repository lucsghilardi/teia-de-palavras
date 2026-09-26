"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { AbaAtividades } from "@/components/painel/aula-editor/aba-atividades";
import { AbaBasico } from "@/components/painel/aula-editor/aba-basico";
import { AbaConversa } from "@/components/painel/aula-editor/aba-conversa";
import { AbaDicionario } from "@/components/painel/aula-editor/aba-dicionario";
import { AbaHistoria } from "@/components/painel/aula-editor/aba-historia";
import { AbaRevisao } from "@/components/painel/aula-editor/aba-revisao";
import { AbaSilabas } from "@/components/painel/aula-editor/aba-silabas";
import {
  payloadDoRascunho,
  rascunhoDaAula,
  validarRascunho,
  type AulaRascunho,
} from "@/components/painel/aula-editor/rascunho";
import type { MidiaHandlers } from "@/components/painel/aula-editor/tipos";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { mensagemDeErro, mensagensDeErro } from "@/lib/api-errors";
import { infoDisciplina } from "@/lib/disciplinas";
import { appToast } from "@/lib/toast";
import {
  despublicarAula,
  getAula,
  getConfiguracoes,
  listAulas,
  publicarAula,
  removeAulaMidia,
  updateAula,
  uploadAulaMidia,
} from "@/services/painel";
import { ApiError } from "@/services/apiError";
import type { Aula, AulaMidiaAlvo, AulaResumo } from "@/types/Aula";
import type { Configuracoes } from "@/types/Configuracoes";

const ID_ABAS = "aula-editor";

type Aba = "basico" | "silabas" | "historia" | "conversa" | "dicionario" | "atividades" | "revisao";

type Carregado = {
  aula: Aula;
  aulas: AulaResumo[];
  configuracoes: Configuracoes | null;
};

export default function AulaEditorPage() {
  const params = useParams<{ id: string }>();
  const aulaId = /^\d+$/.test(params.id ?? "") ? Number(params.id) : null;

  if (aulaId === null) {
    return <AulaNaoEncontrada />;
  }

  // `key`: trocar de aula remonta o editor com estado limpo.
  return <AulaEditorCarregador key={aulaId} aulaId={aulaId} />;
}

function AulaNaoEncontrada({ mensagem }: { mensagem?: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
      <p className="text-lg font-bold">Aula não encontrada</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {mensagem ?? "Ela pode ter sido excluída."}
      </p>
      <Button asChild variant="outline">
        <Link href="/painel/aulas">
          <ArrowLeft />
          Voltar para aulas
        </Link>
      </Button>
    </div>
  );
}

function AulaEditorCarregador({ aulaId }: { aulaId: number }) {
  const [dados, setDados] = useState<Carregado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      getAula(aulaId),
      listAulas().catch(() => [] as AulaResumo[]),
      getConfiguracoes().catch(() => null),
    ])
      .then(([aula, aulas, configuracoes]) => {
        if (ativo) setDados({ aula, aulas, configuracoes });
      })
      .catch((error) => {
        if (!ativo) return;

        const mensagem =
          error instanceof ApiError && error.status === 404
            ? "Ela pode ter sido excluída."
            : mensagemDeErro(error, "Não foi possível carregar a aula.");

        setErro(mensagem);
        appToast.error(mensagem);
      });

    return () => {
      ativo = false;
    };
  }, [aulaId]);

  if (erro) {
    return <AulaNaoEncontrada mensagem={erro} />;
  }

  if (!dados) {
    return <PainelPageLoader label="Carregando aula..." />;
  }

  return (
    <AulaEditor
      inicial={dados.aula}
      aulas={dados.aulas}
      configuracoes={dados.configuracoes}
    />
  );
}

type AulaEditorProps = {
  inicial: Aula;
  aulas: AulaResumo[];
  configuracoes: Configuracoes | null;
};

function AulaEditor({ inicial, aulas, configuracoes }: AulaEditorProps) {
  const [aula, setAula] = useState<Aula>(inicial);
  const [rascunho, setRascunho] = useState<AulaRascunho>(() => rascunhoDaAula(inicial));
  const [aba, setAba] = useState<Aba>("basico");
  const [salvando, setSalvando] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [pendencias, setPendencias] = useState<string[]>([]);

  // "Alterado" = o documento que iria no PUT difere do que está salvo.
  const salvo = useMemo(() => JSON.stringify(payloadDoRascunho(rascunhoDaAula(aula))), [aula]);
  const atual = useMemo(() => JSON.stringify(payloadDoRascunho(rascunho)), [rascunho]);
  const alterado = salvo !== atual;

  const outrasAulas = useMemo(
    () =>
      aulas
        .filter((item) => item.id !== aula.id)
        .sort((a, b) => a.fase - b.fase || a.ordem - b.ordem),
    [aulas, aula.id],
  );

  useEffect(() => {
    if (!alterado) {
      return;
    }

    function avisarAntesDeSair(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Navegadores antigos só mostram o aviso com returnValue preenchido.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", avisarAntesDeSair);

    return () => window.removeEventListener("beforeunload", avisarAntesDeSair);
  }, [alterado]);

  function alterarRascunho(patch: Partial<AulaRascunho>) {
    setRascunho((atualRascunho) => ({ ...atualRascunho, ...patch }));
  }

  function aplicarNovaVersao(atualizada: Aula) {
    setAula(atualizada);
    setRascunho(rascunhoDaAula(atualizada));
  }

  async function salvar() {
    const erros = validarRascunho(rascunho);

    if (erros.length > 0) {
      appToast.error(erros[0]);
      return;
    }

    setSalvando(true);

    try {
      const atualizada = await updateAula(aula.id, payloadDoRascunho(rascunho));

      // Troca o estado local pela resposta: itens novos ganham id.
      aplicarNovaVersao(atualizada);
      setPendencias([]);
      appToast.success("Aula salva.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível salvar a aula."));
    } finally {
      setSalvando(false);
    }
  }

  async function alterarPublicacao(publicar: boolean) {
    setAlterandoStatus(true);
    setPendencias([]);

    try {
      const atualizada = publicar
        ? await publicarAula(aula.id)
        : await despublicarAula(aula.id);

      aplicarNovaVersao(atualizada);
      appToast.success(publicar ? "Aula publicada." : "Aula voltou para rascunho.");
    } catch (error) {
      const fallback = publicar
        ? "Não foi possível publicar a aula."
        : "Não foi possível despublicar a aula.";

      if (publicar && error instanceof ApiError && error.status === 422) {
        setPendencias(mensagensDeErro(error, fallback));
      }

      appToast.error(mensagemDeErro(error, fallback));
    } finally {
      setAlterandoStatus(false);
    }
  }

  // ===== Mídia (envio imediato; não depende do "Salvar") =====

  function aplicarUrl(alvo: AulaMidiaAlvo, alvoId: number | undefined, url: string | null) {
    switch (alvo) {
      case "palavra_imagem":
        setAula((a) => ({ ...a, palavra_imagem_url: url }));
        break;
      case "palavra_audio":
        setAula((a) => ({ ...a, palavra_audio_url: url }));
        break;
      case "pagina_imagem":
      case "pagina_audio": {
        const campo = alvo === "pagina_imagem" ? "imagem_url" : "audio_url";

        setAula((a) => ({
          ...a,
          historia_paginas: a.historia_paginas.map((p) =>
            p.id === alvoId ? { ...p, [campo]: url } : p,
          ),
        }));
        setRascunho((r) => ({
          ...r,
          historia_paginas: r.historia_paginas.map((p) =>
            p.id === alvoId ? { ...p, [campo]: url } : p,
          ),
        }));
        break;
      }
      case "pergunta_audio":
        setAula((a) => ({
          ...a,
          perguntas: a.perguntas.map((p) => (p.id === alvoId ? { ...p, audio_url: url } : p)),
        }));
        setRascunho((r) => ({
          ...r,
          perguntas: r.perguntas.map((p) => (p.id === alvoId ? { ...p, audio_url: url } : p)),
        }));
        break;
      case "palavra_dicionario_imagem":
      case "palavra_dicionario_audio": {
        const campo = alvo === "palavra_dicionario_imagem" ? "imagem_url" : "audio_url";

        setAula((a) => ({
          ...a,
          palavras: a.palavras.map((p) => (p.id === alvoId ? { ...p, [campo]: url } : p)),
        }));
        setRascunho((r) => ({
          ...r,
          palavras: r.palavras.map((p) => (p.id === alvoId ? { ...p, [campo]: url } : p)),
        }));
        break;
      }
      case "atividade_imagem":
        setAula((a) => ({
          ...a,
          atividades: a.atividades.map((x) => (x.id === alvoId ? { ...x, imagem_url: url } : x)),
        }));
        setRascunho((r) => ({
          ...r,
          atividades: r.atividades.map((x) => (x.id === alvoId ? { ...x, imagem_url: url } : x)),
        }));
        break;
    }
  }

  const midia: MidiaHandlers = {
    async enviar(alvo, alvoId, arquivo) {
      const { url } = await uploadAulaMidia(aula.id, { alvo, alvo_id: alvoId, arquivo });

      aplicarUrl(alvo, alvoId, url);
    },
    async remover(alvo, alvoId) {
      await removeAulaMidia(aula.id, alvoId === undefined ? { alvo } : { alvo, alvo_id: alvoId });

      aplicarUrl(alvo, alvoId, null);
    },
  };

  const portugues = aula.disciplina === "portugues";
  const disciplina = infoDisciplina(aula.disciplina);

  const abas: { value: Aba; label: string }[] = [
    { value: "basico", label: "Básico" },
    ...(portugues
      ? [
          { value: "silabas" as const, label: `Sílabas e famílias (${rascunho.silabas.length})` },
          { value: "historia" as const, label: `História (${rascunho.historia_paginas.length})` },
          { value: "conversa" as const, label: `Conversa (${rascunho.perguntas.length})` },
          { value: "dicionario" as const, label: `Dicionário da aula (${rascunho.palavras.length})` },
        ]
      : []),
    { value: "atividades", label: `Atividades (${rascunho.atividades.length})` },
    { value: "revisao", label: "Revisão" },
  ];

  const publicada = aula.status === "publicada";
  const rotulo = portugues ? rascunho.palavra_geradora || "Sem palavra" : rascunho.rotulo || rascunho.titulo || "Sem título";

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-[5] -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              href="/painel/aulas"
              aria-label="Voltar para aulas"
              onClick={(event) => {
                if (
                  alterado &&
                  !window.confirm("Há alterações não salvas. Sair mesmo assim?")
                ) {
                  event.preventDefault();
                }
              }}
            >
              <ArrowLeft />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl leading-tight font-extrabold tracking-wide">
              <span className={portugues ? "break-all uppercase" : "break-words"}>{rotulo}</span>
              <Badge variant={publicada ? "success" : "muted"}>
                {publicada ? "Publicada" : "Rascunho"}
              </Badge>
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {disciplina.nome} · Fase {aula.fase} · {rascunho.titulo || "Sem título"}
            </p>
          </div>

          <span
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {alterado ? "Alterações não salvas" : "Tudo salvo"}
          </span>

          <Button type="button" onClick={salvar} disabled={salvando || !alterado}>
            {salvando ? <Spinner data-icon="inline-start" /> : <Save />}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs
        idBase={ID_ABAS}
        aria-label="Partes da aula"
        value={aba}
        onValueChange={(valor) => setAba(valor as Aba)}
        items={abas}
        className="flex h-auto w-full flex-wrap justify-start"
      />

      <TabPanel idBase={ID_ABAS} value={aba}>
        {aba === "basico" ? (
          <AbaBasico
            aula={aula}
            rascunho={rascunho}
            outrasAulas={outrasAulas}
            onChange={alterarRascunho}
            midia={midia}
          />
        ) : null}

        {aba === "silabas" ? (
          <AbaSilabas
            silabas={rascunho.silabas}
            palavraGeradora={rascunho.palavra_geradora}
            onChange={(silabas) => alterarRascunho({ silabas })}
          />
        ) : null}

        {aba === "historia" ? (
          <AbaHistoria
            paginas={rascunho.historia_paginas}
            onChange={(historia_paginas) => alterarRascunho({ historia_paginas })}
            midia={midia}
            configuracoes={configuracoes}
          />
        ) : null}

        {aba === "conversa" ? (
          <AbaConversa
            perguntas={rascunho.perguntas}
            onChange={(perguntas) => alterarRascunho({ perguntas })}
            midia={midia}
          />
        ) : null}

        {aba === "dicionario" ? (
          <AbaDicionario
            palavras={rascunho.palavras}
            onChange={(palavras) => alterarRascunho({ palavras })}
            midia={midia}
          />
        ) : null}

        {aba === "atividades" ? (
          <AbaAtividades
            atividades={rascunho.atividades}
            disciplina={aula.disciplina}
            onChange={(atividades) => alterarRascunho({ atividades })}
            midia={midia}
          />
        ) : null}

        {aba === "revisao" ? (
          <AbaRevisao
            aula={aula}
            alterado={alterado}
            salvando={salvando}
            alterandoStatus={alterandoStatus}
            pendencias={pendencias}
            onSalvar={salvar}
            onPublicar={() => void alterarPublicacao(true)}
            onDespublicar={() => void alterarPublicacao(false)}
          />
        ) : null}
      </TabPanel>
    </div>
  );
}
