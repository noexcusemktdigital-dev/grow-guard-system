// Matriz types and constants (extracted from matrizData.ts)

export type MatrizArea = "Financeiro" | "Comercial" | "Juridico" | "Marketing" | "Operacoes" | "Direcao";
export type MatrizUserStatus = "Ativo" | "Inativo";
export type NivelAcesso = "sem_acesso" | "visualizacao" | "edicao" | "admin";

export interface ModuloPermissao {
  modulo: string;
  nivel: NivelAcesso;
}

export interface PermissoesEspeciais {
  podeVerFinanceiroCompleto: boolean;
  podeEditarRepasse: boolean;
  podeGerarDre: boolean;
  podeExcluirContratos: boolean;
  podeCriarCampanhas: boolean;
  podeEnviarComunicadoGlobal: boolean;
  podeAlterarPermissoes: boolean;
}

export interface MatrizUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  area: MatrizArea;
  status: MatrizUserStatus;
  lastLogin: string;
  permissoes: ModuloPermissao[];
  permissoesEspeciais: PermissoesEspeciais;
  perfilBase?: string;
}

export interface PerfilPreConfigurado {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  permissoes: ModuloPermissao[];
  permissoesEspeciais: PermissoesEspeciais;
}

export interface ModuloSection {
  secao: string;
  modulos: string[];
}

// Constants
export const modulosPorSecao: ModuloSection[] = [
  { secao: "Administrativo", modulos: ["Financeiro", "Contratos", "Fechamentos (DRE)"] },
  { secao: "Comercial", modulos: ["Marketing", "Academy", "Metas e Ranking"] },
  { secao: "Rede", modulos: ["Unidades", "CRM Expansão", "Onboarding", "Atendimento", "Matriz"] },
  { secao: "Principal", modulos: ["Comunicados", "Agenda", "Dashboard"] },
];

export const todosModulos = modulosPorSecao.flatMap(s => s.modulos);

const allAdmin = (modulos: string[]): ModuloPermissao[] =>
  modulos.map(m => ({ modulo: m, nivel: "admin" as NivelAcesso }));

const allView = (modulos: string[]): ModuloPermissao[] =>
  modulos.map(m => ({ modulo: m, nivel: "visualizacao" as NivelAcesso }));

const noAccess = (modulos: string[]): ModuloPermissao[] =>
  modulos.map(m => ({ modulo: m, nivel: "sem_acesso" as NivelAcesso }));

const allEspeciaisOn: PermissoesEspeciais = {
  podeVerFinanceiroCompleto: true, podeEditarRepasse: true, podeGerarDre: true,
  podeExcluirContratos: true, podeCriarCampanhas: true, podeEnviarComunicadoGlobal: true,
  podeAlterarPermissoes: true,
};

const allEspeciaisOff: PermissoesEspeciais = {
  podeVerFinanceiroCompleto: false, podeEditarRepasse: false, podeGerarDre: false,
  podeExcluirContratos: false, podeCriarCampanhas: false, podeEnviarComunicadoGlobal: false,
  podeAlterarPermissoes: false,
};

export const perfisPreConfigurados: PerfilPreConfigurado[] = [
  {
    id: "super_admin", nome: "Super Admin", descricao: "Acesso total a todos os módulos e permissões especiais", icone: "Crown",
    permissoes: allAdmin(todosModulos),
    permissoesEspeciais: allEspeciaisOn,
  },
  {
    id: "financeiro", nome: "Financeiro", descricao: "Admin em Financeiro, Contratos e Fechamentos. Visualização comercial.", icone: "DollarSign",
    permissoes: [
      ...allAdmin(["Financeiro", "Contratos", "Fechamentos (DRE)"]),
      ...allView(["Marketing", "Academy", "Metas e Ranking"]),
      ...allView(["Unidades"]),
      ...noAccess(["CRM Expansão", "Onboarding", "Atendimento", "Matriz"]),
      ...allView(["Comunicados", "Agenda", "Dashboard"]),
    ],
    permissoesEspeciais: { ...allEspeciaisOff, podeVerFinanceiroCompleto: true, podeEditarRepasse: true, podeGerarDre: true },
  },
  {
    id: "comercial", nome: "Comercial", descricao: "Admin em CRM, Metas e Marketing. Visualização no restante.", icone: "TrendingUp",
    permissoes: [
      ...allView(["Financeiro", "Contratos", "Fechamentos (DRE)"]),
      ...allAdmin(["Marketing", "Metas e Ranking"]),
      ...allView(["Academy"]),
      ...allAdmin(["CRM Expansão"]),
      ...allView(["Unidades", "Onboarding", "Atendimento"]),
      ...noAccess(["Matriz"]),
      ...allView(["Comunicados", "Agenda", "Dashboard"]),
    ],
    permissoesEspeciais: { ...allEspeciaisOff, podeCriarCampanhas: true },
  },
  {
    id: "cs_operacoes", nome: "CS / Operações", descricao: "Admin em Onboarding, Atendimento e Unidades.", icone: "Headphones",
    permissoes: [
      ...allView(["Financeiro", "Contratos", "Fechamentos (DRE)"]),
      ...allView(["Marketing", "Academy", "Metas e Ranking"]),
      ...allAdmin(["Unidades", "Onboarding", "Atendimento"]),
      ...noAccess(["CRM Expansão", "Matriz"]),
      ...allView(["Comunicados", "Agenda", "Dashboard"]),
    ],
    permissoesEspeciais: allEspeciaisOff,
  },
  {
    id: "marketing", nome: "Marketing", descricao: "Admin em Marketing, Comunicados e Agenda.", icone: "Megaphone",
    permissoes: [
      ...noAccess(["Financeiro", "Contratos", "Fechamentos (DRE)"]),
      ...allAdmin(["Marketing"]),
      ...allView(["Academy", "Metas e Ranking"]),
      ...allView(["Unidades"]),
      ...noAccess(["CRM Expansão", "Onboarding", "Atendimento", "Matriz"]),
      ...allAdmin(["Comunicados", "Agenda"]),
      ...allView(["Dashboard"]),
    ],
    permissoesEspeciais: { ...allEspeciaisOff, podeCriarCampanhas: true, podeEnviarComunicadoGlobal: true },
  },
];

export const areas: MatrizArea[] = ["Financeiro", "Comercial", "Juridico", "Marketing", "Operacoes", "Direcao"];

export const permissoesEspeciaisConfig: { key: keyof PermissoesEspeciais; label: string; descricao: string; critica: boolean }[] = [
  { key: "podeVerFinanceiroCompleto", label: "Visualizar dados financeiros completos", descricao: "Acesso irrestrito a todos os dados financeiros da rede", critica: false },
  { key: "podeEditarRepasse", label: "Editar repasse", descricao: "Pode modificar valores e configurações de repasse às unidades", critica: false },
  { key: "podeGerarDre", label: "Gerar DRE", descricao: "Pode gerar e exportar demonstrativos de resultado", critica: false },
  { key: "podeExcluirContratos", label: "Excluir contratos", descricao: "Pode remover permanentemente contratos do sistema", critica: true },
  { key: "podeCriarCampanhas", label: "Criar campanhas", descricao: "Pode criar e gerenciar campanhas de marketing", critica: false },
  { key: "podeEnviarComunicadoGlobal", label: "Enviar comunicados globais", descricao: "Pode enviar comunicados para toda a rede de franqueados", critica: false },
  { key: "podeAlterarPermissoes", label: "Alterar permissões de outros usuários", descricao: "Pode modificar as permissões e acessos de outros usuários da matriz", critica: true },
];

// Helpers
export function getModulosBySection(): ModuloSection[] {
  return modulosPorSecao;
}

export function getPerfilById(id: string): PerfilPreConfigurado | undefined {
  return perfisPreConfigurados.find(p => p.id === id);
}

export function getUserModulosHabilitados(user: MatrizUser): string[] {
  return user.permissoes.filter(p => p.nivel !== "sem_acesso").map(p => p.modulo);
}

export function applyPerfil(user: MatrizUser, perfilId: string): MatrizUser {
  const perfil = getPerfilById(perfilId);
  if (!perfil) return user;
  return {
    ...user,
    permissoes: [...perfil.permissoes],
    permissoesEspeciais: { ...perfil.permissoesEspeciais },
    perfilBase: perfilId,
  };
}

export function getNivelAcessoLabel(nivel: NivelAcesso): string {
  const map: Record<NivelAcesso, string> = {
    sem_acesso: "Sem acesso", visualizacao: "Visualização", edicao: "Edição", admin: "Admin",
  };
  return map[nivel];
}

export function getAreaColor(area: MatrizArea): string {
  const map: Record<MatrizArea, string> = {
    Financeiro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Comercial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Juridico: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Marketing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Operacoes: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    Direcao: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[area];
}
