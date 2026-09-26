"use client";

import { useId, useRef, useState } from "react";
import { ImageIcon, Music, Trash2, Upload } from "lucide-react";

import { RemoteImage } from "@/components/painel/remote-image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { mensagemDeErro } from "@/lib/api-errors";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type TipoMidia = "imagem" | "audio";

// Mesmos limites do backend (docs/api-painel.md): imagem jpg/png/webp ≤ 5 MB,
// áudio mp3/m4a/ogg/webm/wav ≤ 10 MB. Checar aqui evita subir 50 MB à toa.
const REGRAS: Record<
  TipoMidia,
  { accept: string; extensoes: string[]; maxBytes: number; descricao: string }
> = {
  imagem: {
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    extensoes: ["jpg", "jpeg", "png", "webp"],
    maxBytes: 5 * 1024 * 1024,
    descricao: "JPG, PNG ou WEBP até 5 MB",
  },
  audio: {
    accept:
      "audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,audio/wav,audio/x-wav,.mp3,.m4a,.ogg,.webm,.wav",
    extensoes: ["mp3", "m4a", "ogg", "webm", "wav"],
    maxBytes: 10 * 1024 * 1024,
    descricao: "MP3, M4A, OGG, WEBM ou WAV até 10 MB",
  },
};

type MidiaFieldProps = {
  tipo: TipoMidia;
  label: string;
  url: string | null;
  /** Filho ainda sem id (não salvo): envio desabilitado. */
  disabled?: boolean;
  disabledHint?: string;
  onUpload: (arquivo: File) => Promise<void>;
  onRemove: () => Promise<void>;
  className?: string;
};

/**
 * Envio imediato de imagem/áudio de uma aula (POST/DELETE .../midia), com
 * pré-visualização. Não entra no "Salvar" do documento.
 */
export function MidiaField({
  tipo,
  label,
  url,
  disabled = false,
  disabledHint,
  onUpload,
  onRemove,
  className,
}: MidiaFieldProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState<"envio" | "remocao" | null>(null);
  const regra = REGRAS[tipo];
  const Icone = tipo === "imagem" ? ImageIcon : Music;
  const bloqueado = disabled || ocupado !== null;

  async function handleArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    // Limpa o input para permitir reenviar o mesmo arquivo depois.
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";

    if (!regra.extensoes.includes(extensao)) {
      appToast.error(`Formato não aceito. Use ${regra.descricao}.`);
      return;
    }

    if (arquivo.size > regra.maxBytes) {
      appToast.error(`Arquivo grande demais. Use ${regra.descricao}.`);
      return;
    }

    setOcupado("envio");

    try {
      await onUpload(arquivo);
      appToast.success(tipo === "imagem" ? "Imagem enviada." : "Áudio enviado.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível enviar o arquivo."));
    } finally {
      setOcupado(null);
    }
  }

  async function handleRemover() {
    setOcupado("remocao");

    try {
      await onRemove();
      appToast.success(tipo === "imagem" ? "Imagem removida." : "Áudio removido.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível remover o arquivo."));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={`${inputId}-rotulo`}
      aria-describedby={hintId}
      className={cn("space-y-2 rounded-xl border bg-muted/20 p-3", className)}
    >
      <div className="flex items-center gap-2">
        <Icone className="size-4 text-muted-foreground" aria-hidden="true" />
        <span id={`${inputId}-rotulo`} className="text-sm font-medium">
          {label}
        </span>
      </div>

      {url ? (
        tipo === "imagem" ? (
          <RemoteImage
            src={url}
            alt={label}
            className="h-28 w-full rounded-lg border bg-background object-contain"
          />
        ) : (
          <audio controls preload="none" src={url} className="w-full">
            Seu navegador não reproduz áudio.
          </audio>
        )
      ) : (
        <div className="flex h-12 items-center justify-center rounded-lg border border-dashed bg-background text-xs text-muted-foreground">
          {tipo === "imagem" ? "Sem imagem" : "Sem áudio"}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={regra.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleArquivo}
        disabled={bloqueado}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={bloqueado}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          {ocupado === "envio" ? <Spinner /> : <Upload />}
          {url ? "Trocar" : "Enviar"}
          <span className="sr-only"> {label.toLowerCase()}</span>
        </Button>
        {url ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={bloqueado}
            onClick={handleRemover}
          >
            {ocupado === "remocao" ? <Spinner /> : <Trash2 />}
            Remover
            <span className="sr-only"> {label.toLowerCase()}</span>
          </Button>
        ) : null}
      </div>

      <p id={hintId} className="text-xs text-muted-foreground">
        {disabled && disabledHint ? disabledHint : regra.descricao}
      </p>
    </div>
  );
}
