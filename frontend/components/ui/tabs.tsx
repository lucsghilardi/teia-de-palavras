"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TabItem = {
  value: string;
  label: React.ReactNode;
};

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  className?: string;
  /**
   * Prefixo de id: liga cada aba ao seu `TabPanel` (aria-controls /
   * aria-labelledby). Opcional para quem só precisa da barra.
   */
  idBase?: string;
  "aria-label"?: string;
};

function tabId(idBase: string, value: string) {
  return `${idBase}-tab-${value}`;
}

function panelId(idBase: string, value: string) {
  return `${idBase}-panel-${value}`;
}

export function Tabs({
  value,
  onValueChange,
  items,
  className,
  idBase,
  "aria-label": ariaLabel,
}: TabsProps) {
  // Setas/Home/End movem entre as abas (padrão WAI-ARIA de tablist).
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === value);
    let next = -1;

    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;

    if (next < 0) {
      return;
    }

    event.preventDefault();
    onValueChange(items[next].value);

    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    buttons[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={idBase ? tabId(idBase, item.value) : undefined}
            aria-controls={idBase ? panelId(idBase, item.value) : undefined}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

type TabPanelProps = React.ComponentProps<"div"> & {
  idBase: string;
  value: string;
};

/** Conteúdo de uma aba; renderize só o da aba ativa. */
export function TabPanel({ idBase, value, className, ...props }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={panelId(idBase, value)}
      aria-labelledby={tabId(idBase, value)}
      tabIndex={0}
      className={cn("outline-none", className)}
      {...props}
    />
  );
}
