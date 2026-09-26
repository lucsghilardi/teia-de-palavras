"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, ClipboardList, School, Smile } from "lucide-react";

import { PainelPageHeader } from "@/components/painel/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAulas, listCriancas, listMiniAulas, listTurmas } from "@/services/painel";

type Contagens = {
  criancas: number | null;
  turmas: { total: number; ativas: number } | null;
  aulas: { total: number; publicadas: number } | null;
  miniAulas: number | null;
};

type ItemResumo = {
  title: string;
  value: string | null;
  description: string;
  href: string;
  icon: typeof Smile;
  accent: string;
};

function plural(total: number, singular: string, pluralTexto: string) {
  return total === 1 ? `1 ${singular}` : `${total} ${pluralTexto}`;
}

function montarResumo(contagens: Contagens | null): ItemResumo[] {
  const carregando = contagens === null;
  const { criancas, turmas, aulas, miniAulas } = contagens ?? {
    criancas: null,
    turmas: null,
    aulas: null,
    miniAulas: null,
  };

  return [
    {
      title: "Crianças",
      value: carregando ? null : criancas === null ? "—" : String(criancas),
      description: "Crianças cadastradas nas suas turmas.",
      href: "/painel/criancas",
      icon: Smile,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      title: "Turmas",
      value: carregando ? null : turmas === null ? "—" : String(turmas.total),
      description:
        turmas === null
          ? "Turmas cadastradas."
          : `${plural(turmas.ativas, "ativa", "ativas")} neste período.`,
      href: "/painel/turmas",
      icon: School,
      accent: "bg-sky-100 text-sky-700",
    },
    {
      title: "Aulas publicadas",
      value: carregando ? null : aulas === null ? "—" : `${aulas.publicadas}/${aulas.total}`,
      description:
        aulas === null
          ? "Aulas publicadas e rascunhos."
          : `${plural(aulas.total - aulas.publicadas, "rascunho", "rascunhos")} em preparo.`,
      href: "/painel/aulas",
      icon: BookOpenText,
      accent: "bg-violet-100 text-violet-700",
    },
    {
      title: "Mini-aulas pendentes",
      value: carregando ? null : miniAulas === null ? "—" : String(miniAulas),
      description: "Aulas gravadas pelas crianças esperando um adulto ouvir e aprovar.",
      href: "/painel/mini-aulas",
      icon: ClipboardList,
      accent: "bg-rose-100 text-rose-700",
    },
  ];
}

export default function PainelHomePage() {
  const [contagens, setContagens] = useState<Contagens | null>(null);

  useEffect(() => {
    let ativo = true;

    // Cada card falha sozinho: um erro numa lista não apaga os outros números.
    Promise.allSettled([listCriancas(), listTurmas(), listAulas(), listMiniAulas("pendente")]).then(
      ([criancas, turmas, aulas, miniAulas]) => {
        if (!ativo) return;

        setContagens({
          miniAulas: miniAulas.status === "fulfilled" ? miniAulas.value.length : null,
          criancas: criancas.status === "fulfilled" ? criancas.value.length : null,
          turmas:
            turmas.status === "fulfilled"
              ? {
                  total: turmas.value.length,
                  ativas: turmas.value.filter((turma) => turma.ativa).length,
                }
              : null,
          aulas:
            aulas.status === "fulfilled"
              ? {
                  total: aulas.value.length,
                  publicadas: aulas.value.filter((aula) => aula.status === "publicada").length,
                }
              : null,
        });
      },
    );

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = montarResumo(contagens);

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title="Início"
        description="Visão geral do dia a dia: crianças, turmas, aulas e o que ainda precisa da sua atenção."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resumo.map((item) => (
          <Card key={item.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{item.title}</CardDescription>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${item.accent}`}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <CardTitle className="text-3xl font-extrabold tabular-nums">
                {item.value === null ? (
                  <Skeleton className="h-9 w-16" aria-label="Carregando" />
                ) : (
                  item.value
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Abrir
                <span className="sr-only"> {item.title}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo à Teia de Palavras</CardTitle>
          <CardDescription>
            Comece criando uma turma, cadastre as crianças com o consentimento do
            responsável e publique as aulas a partir das palavras geradoras.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
