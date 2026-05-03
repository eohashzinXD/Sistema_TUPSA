import { redirect } from "next/navigation";

import { isPaiDeSanto } from "@/actions/schedules";
import { auth } from "@/auth";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { Card } from "@/components/ui/card";
import { getSystemSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canManage = await isPaiDeSanto(session.user.id);
  if (!canManage) {
    return <AccessDenied />;
  }

  const settings = await getSystemSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Configuracoes
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Sistema do terreiro
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Ajuste o nome e a logo que aparecem nos relatorios impressos.
        </p>
      </section>

      <SystemSettingsForm defaultValues={settings} />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissao</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Voce nao tem acesso a esta area.
      </p>
    </Card>
  );
}
