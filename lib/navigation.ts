export type NavigationIcon =
  | "bell"
  | "book"
  | "calendar"
  | "calendar-days"
  | "droplets"
  | "folder"
  | "home"
  | "megaphone"
  | "settings"
  | "wallet"
  | "music"
  | "users";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: NavigationIcon;
  permissions: string[];
};

export const dashboardNavigation: NavigationItem[] = [
  {
    title: "Início",
    href: "/dashboard",
    description: "Resumo geral da casa",
    icon: "home",
    permissions: ["dashboard:read"]
  },
  {
    title: "Estudos",
    href: "/dashboard/estudos",
    description: "Materiais organizados por categoria",
    icon: "book",
    permissions: ["study:read"]
  },
  {
    title: "Pontos",
    href: "/dashboard/pontos",
    description: "Pontos cantados e fundamentos da curimba",
    icon: "music",
    permissions: ["points:read"]
  },
  {
    title: "Funções",
    href: "/dashboard/funcoes",
    description: "Agenda obrigatória da casa",
    icon: "calendar",
    permissions: ["functions:read"]
  },
  {
    title: "Cronogramas",
    href: "/dashboard/cronogramas",
    description: "Festas, amacis e giras",
    icon: "calendar-days",
    permissions: ["cronogramas:read"]
  },
  {
    title: "Amaci",
    href: "/dashboard/amaci",
    description: "Controle dos banhos por orixá",
    icon: "droplets",
    permissions: ["amaci:read"]
  },
  {
    title: "Mensalidades",
    href: "/dashboard/mensalidades",
    description: "Pagamentos e isenções",
    icon: "wallet",
    permissions: ["monthly-fees:read"]
  },
  {
    title: "Enviar comunicado",
    href: "/dashboard/notificacoes/enviar",
    description: "Avisos enviados aos membros",
    icon: "megaphone",
    permissions: ["notifications:create"]
  },
  {
    title: "Categorias",
    href: "/dashboard/categorias",
    description: "Estrutura de estudos e pontos",
    icon: "folder",
    permissions: ["categories:manage"]
  },
  {
    title: "Usuários",
    href: "/dashboard/usuarios",
    description: "Papéis, grupos e permissões",
    icon: "users",
    permissions: ["users:manage"]
  },
  {
    title: "Configuracoes",
    href: "/dashboard/configuracoes",
    description: "Nome e logo do terreiro",
    icon: "settings",
    permissions: ["settings:manage"]
  },
  {
    title: "Notificacoes",
    href: "/dashboard/notificacoes",
    description: "Leitura e envio de comunicados",
    icon: "bell",
    permissions: ["notifications:read"]
  }
];

export function getNavigationByPermissions(
  permissions: string[]
): NavigationItem[] {
  const permissionSet = new Set(permissions);

  return dashboardNavigation.filter((item) =>
    item.permissions.some((permission) => permissionSet.has(permission))
  );
}
