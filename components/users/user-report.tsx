import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { orixaLabels, type OrixaCode } from "@/lib/amaci";

export type UserReportItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  maritalStatus: string | null;
  hasAllergies: boolean;
  allergies: string | null;
  usesContinuousMedication: boolean;
  continuousMedication: string | null;
  umbandaStartDate: Date | null;
  active: boolean;
  headOrixa: string | null;
  adjuntoOrixa: string | null;
  frontEntity: string | null;
  baptismDate: Date | null;
  coronationDate: Date | null;
  hasAmaci: boolean;
  deitadaCount: number;
  rightObligations: string[];
  leftObligations: string[];
  monthlyFeeExempt: boolean;
  createdAt: Date;
  roles: Array<{ role: { name: string } }>;
  groups: Array<{ group: { name: string } }>;
  permissions: Array<{ permission: { key: string } }>;
  amaciBaths: Array<{ orixa: string; takenAt: Date }>;
};

function formatDate(date: Date | null) {
  if (!date) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date);
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Nenhum";
}

function formatOrixa(value: string | null) {
  if (value && value in orixaLabels) {
    return orixaLabels[value as OrixaCode];
  }

  return "Nao informado";
}

export function UserReport({ users }: { users: UserReportItem[] }) {
  return (
    <div className="space-y-6">
      {users.map((user) => (
        <article
          className="break-inside-avoid rounded-2xl border border-border bg-card p-5 print:border-zinc-300 print:shadow-none"
          key={user.id}
        >
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {user.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:justify-end">
              <Badge>{user.active ? "Ativo" : "Inativo"}</Badge>
              {user.monthlyFeeExempt ? <Badge>Isento</Badge> : null}
              {user.hasAmaci ? <Badge>Tem amaci</Badge> : null}
            </div>
          </div>

          <ReportSection title="Cadastro pessoal">
            <ReportField label="Telefone" value={user.phone} />
            <ReportField label="Endereco" value={user.address} />
            <ReportField label="Estado civil" value={user.maritalStatus} />
            <ReportField
              label="Inicio na Umbanda"
              value={formatDate(user.umbandaStartDate)}
            />
            <ReportField
              label="Alergias"
              value={
                user.hasAllergies
                  ? user.allergies ?? "Sim, sem detalhes"
                  : "Nao"
              }
            />
            <ReportField
              label="Medicacao continua"
              value={
                user.usesContinuousMedication
                  ? user.continuousMedication ?? "Sim, sem detalhes"
                  : "Nao"
              }
            />
          </ReportSection>

          <ReportSection title="Cadastro espiritual">
            <ReportField label="Orixa de frente" value={formatOrixa(user.headOrixa)} />
            <ReportField label="Orixa adjunto" value={formatOrixa(user.adjuntoOrixa)} />
            <ReportField label="Entidade de frente" value={user.frontEntity} />
            <ReportField label="Batismo" value={formatDate(user.baptismDate)} />
            <ReportField
              label="Coroacao"
              value={formatDate(user.coronationDate)}
            />
            <ReportField
              label="Deitadas do orixa de frente"
              value={`${user.deitadaCount}/7`}
            />
            <ReportField
              label="Amacis registrados"
              value={formatList(user.amaciBaths.map((bath) => formatOrixa(bath.orixa)))}
            />
            <ReportField
              label="Obrigacoes de direita"
              value={formatList(user.rightObligations)}
            />
            <ReportField
              label="Obrigacoes de esquerda"
              value={formatList(user.leftObligations)}
            />
          </ReportSection>

          <ReportSection title="Acesso e organizacao">
            <ReportField
              label="Papeis"
              value={formatList(user.roles.map((item) => item.role.name))}
            />
            <ReportField
              label="Grupos"
              value={formatList(user.groups.map((item) => item.group.name))}
            />
            <ReportField
              label="Permissoes extras"
              value={formatList(
                user.permissions.map((item) => item.permission.key)
              )}
            />
            <ReportField label="Criado em" value={formatDate(user.createdAt)} />
          </ReportSection>
        </article>
      ))}
    </div>
  );
}

function ReportSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2 print:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ReportField({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">{value || "Nao informado"}</p>
    </div>
  );
}
