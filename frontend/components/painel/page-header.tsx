import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PainelPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PainelPageHeader({
  title,
  description,
  actions,
  className,
}: PainelPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
