import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { PrintReportButton } from "@/components/users/print-report-button";
import type { SystemSettingsValue } from "@/lib/settings";
import { cn } from "@/lib/utils";

type ReportHeaderProps = {
  settings: SystemSettingsValue;
  title: string;
  backHref: string;
};

export function ReportHeader({ settings, title, backHref }: ReportHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-center gap-4">
        {settings.logoUrl ? (
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background print:size-16">
            <Image
              alt={`Logo ${settings.templeName}`}
              className="h-full w-full object-contain p-2"
              height={96}
              src={settings.logoUrl}
              unoptimized
              width={96}
            />
          </div>
        ) : null}
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {settings.templeName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Emitido em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short"
            }).format(new Date())}
          </p>
        </div>
      </div>
      <div className="print-hidden flex flex-wrap gap-2">
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href={backHref}
        >
          Voltar
        </Link>
        <PrintReportButton />
      </div>
    </section>
  );
}
