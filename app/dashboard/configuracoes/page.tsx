import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canManage = await hasPermission(session.user.id, "settings:manage");
  if (!canManage) {
    return <AccessDenied />;
  }

  const settings = await getSystemSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Configurações
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Sistema do terreiro
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Ajuste o nome e a logo que aparecem nos relatórios impressos.
        </p>
      </section>

      <SystemSettingsForm defaultValues={settings} />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você não tem acesso a esta área.
      </p>
    </Card>
  );
}
