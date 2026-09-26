"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `window.location.origin` no cliente; "" no servidor (sem mismatch de hidratação). */
export function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
