import type { ComponentProps } from "react";

/**
 * Imagem enviada pelo painel (disco público do backend). Fica fora do
 * `next/image` porque o host muda por ambiente e não há remotePatterns fixo.
 */
export function RemoteImage({ alt, ...props }: ComponentProps<"img"> & { alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}
