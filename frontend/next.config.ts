import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com um server.js próprio e apenas as dependências
  // realmente usadas — a imagem de produção não carrega o node_modules inteiro.
  output: "standalone",
};

export default nextConfig;
