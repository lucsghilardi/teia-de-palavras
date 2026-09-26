"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { mensagemDeErro } from "@/lib/api-errors";
import { appToast } from "@/lib/toast";
import { getConfiguracoes, updateConfiguracoes } from "@/services/painel";
import type { Configuracoes } from "@/types/Configuracoes";

type FormConfiguracoes = Omit<Configuracoes, "minutos_pausa"> & {
  // Texto enquanto digita; vira número no envio.
  minutos_pausa: string;
};

function paraForm(configuracoes: Configuracoes): FormConfiguracoes {
  return { ...configuracoes, minutos_pausa: String(configuracoes.minutos_pausa) };
}

export default function ConfiguracoesPage() {
  const [salvas, setSalvas] = useState<Configuracoes | null>(null);
  const [form, setForm] = useState<FormConfiguracoes | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    getConfiguracoes()
      .then((data) => {
        if (!ativo) return;

        setSalvas(data);
        setForm(paraForm(data));
      })
      .catch((error) => {
        if (!ativo) return;

        const mensagem = mensagemDeErro(error, "Não foi possível carregar as configurações.");

        setErroCarga(mensagem);
        appToast.error(mensagem);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function alterar<K extends keyof FormConfiguracoes>(campo: K, valor: FormConfiguracoes[K]) {
    setForm((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  async function handleSalvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const minutos = Number(form.minutos_pausa);

    if (!Number.isInteger(minutos) || minutos < 1) {
      setErro("Informe os minutos da pausa como um número inteiro maior que zero.");
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const atualizadas = await updateConfiguracoes({
        heroi_nome: form.heroi_nome.trim(),
        fabrica_nome: form.fabrica_nome.trim(),
        minutos_pausa: minutos,
        consentimento_versao: form.consentimento_versao.trim(),
        consentimento_texto: form.consentimento_texto.trim(),
      });

      setSalvas(atualizadas);
      setForm(paraForm(atualizadas));
      appToast.success("Configurações salvas.");
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível salvar as configurações.");

      setErro(mensagem);
      appToast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (erroCarga) {
    return (
      <div className="space-y-6">
        <PainelPageHeader title="Configurações" />
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar</AlertTitle>
          <AlertDescription>
            <p>{erroCarga}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!form || !salvas) {
    return <PainelPageLoader label="Carregando configurações..." />;
  }

  const versaoMudou = form.consentimento_versao.trim() !== salvas.consentimento_versao;
  const textoMudou = form.consentimento_texto.trim() !== salvas.consentimento_texto.trim();

  return (
    <form onSubmit={handleSalvar} className="space-y-6">
      <PainelPageHeader
        title="Configurações"
        description="Valem para todo o portal: nomes usados nas histórias, pausa das crianças e o termo de consentimento do cadastro."
        actions={
          <Button type="submit" disabled={salvando}>
            {salvando ? <Spinner data-icon="inline-start" /> : <Save />}
            Salvar configurações
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Histórias e app</CardTitle>
            <CardDescription>
              Nos textos das aulas, {"{{heroi}}"} e {"{{fabrica}}"} são trocados
              por estes nomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="config-heroi">Nome do herói</FieldLabel>
                <Input
                  id="config-heroi"
                  value={form.heroi_nome}
                  onChange={(event) => alterar("heroi_nome", event.target.value)}
                  disabled={salvando}
                  required
                />
                <FieldDescription>Substitui {"{{heroi}}"} nas histórias.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="config-fabrica">Nome da fábrica de brinquedos</FieldLabel>
                <Input
                  id="config-fabrica"
                  value={form.fabrica_nome}
                  onChange={(event) => alterar("fabrica_nome", event.target.value)}
                  disabled={salvando}
                  required
                />
                <FieldDescription>Substitui {"{{fabrica}}"} nas histórias.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="config-pausa">Minutos até a pausa</FieldLabel>
                <Input
                  id="config-pausa"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={form.minutos_pausa}
                  onChange={(event) => alterar("minutos_pausa", event.target.value)}
                  className="w-32"
                  disabled={salvando}
                  required
                />
                <FieldDescription>
                  Depois desse tempo de uso contínuo, o app sugere uma pausa à criança.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termo de consentimento</CardTitle>
            <CardDescription>
              Mostrado ao responsável no cadastro de cada criança. A versão aceita
              fica registrada junto com o consentimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="config-versao">Versão do termo</FieldLabel>
                <Input
                  id="config-versao"
                  value={form.consentimento_versao}
                  onChange={(event) => alterar("consentimento_versao", event.target.value)}
                  className="w-40 font-mono"
                  disabled={salvando}
                  required
                />
                <FieldDescription>Ex.: v1, v2, 2026-09.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="config-termo">Texto do termo</FieldLabel>
                <Textarea
                  id="config-termo"
                  value={form.consentimento_texto}
                  onChange={(event) => alterar("consentimento_texto", event.target.value)}
                  rows={12}
                  className="min-h-64 leading-6"
                  disabled={salvando}
                  required
                />
              </Field>

              {textoMudou && !versaoMudou ? (
                <Alert variant="warning" role="status">
                  <AlertTitle>Texto alterado sem mudar a versão</AlertTitle>
                  <AlertDescription>
                    <p>
                      Para saber qual texto cada responsável aceitou, atualize
                      também a versão do termo.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <FieldError>{erro}</FieldError>
    </form>
  );
}
