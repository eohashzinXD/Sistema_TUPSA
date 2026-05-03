"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      <Printer className="size-4" aria-hidden="true" />
      Imprimir PDF
    </Button>
  );
}
