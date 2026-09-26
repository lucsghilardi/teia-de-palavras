import { fireConfetti } from "@/lib/confetti";
import { sons } from "@/lib/sons";

/** Acerto: arpejo alegre + confete (só se o sistema não pedir menos movimento). */
export function celebrar(movimentoReduzido: boolean) {
  sons.acerto();

  if (!movimentoReduzido) {
    try {
      fireConfetti();
    } catch {
      // canvas indisponível: a comemoração sonora já basta
    }
  }
}
