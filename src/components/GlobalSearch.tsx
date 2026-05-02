import { useEffect, useState, useMemo } from "react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/* ─── Page definitions per portal ─── */
const franqueadoraPages = [
  { label: "Início", path: "/franqueadora/inicio" },
  { label: "CRM", path: "/franqueadora/crm" },
  { label: "Financeiro", path: "/franqueadora/financeiro" },
  { label: "Unidades", path: "/franqueadora/unidades" },
  { label: "Comunicados", path: "/franqueadora/comunicados" },
  { label: "Marketing", path: "/franqueadora/marketing" },
  { label: "Academy", path: "/franqueadora/treinamentos" },
  { label: "Metas & Ranking", path: "/franqueadora/metas" },
  { label: "Onboarding", path: "/franqueadora/onboarding" },
  { label: "Contratos", path: "/franqueadora/contratos" },
  { label: "Agenda", path: "/franqueadora/agenda" },
  { label: "Atendimento", path: "/franqueadora/atendimento" },
  { label: "Matriz de Acesso", path: "/franqueadora/matriz" },
  { label: "Playbooks", path: "/franqueadora/playbooks" },
  { label: "Chat", path: "/franqueadora/chat" },
];

const franqueadoraActions = [
  { label: "Novo Lead", path: "/franqueadora/crm" },
  { label: "Novo Comunicado", path: "/franqueadora/comunicados" },
];

const franqueadoPages = [
  { label: "Início", path: "/franqueado/inicio" },
  { label: "Agenda", path: "/franqueado/agenda" },
  { label: "Comunicados", path: "/franqueado/comunicados" },
  { label: "Prospecção IA", path: "/franqueado/prospeccao" },
  { label: "Estratégia", path: "/franqueado/estrategia" },
  { label: "Propostas", path: "/franqueado/propostas" },
  { label: "CRM", path: "/franqueado/crm" },
  { label: "Materiais", path: "/franqueado/materiais" },
  { label: "Academy", path: "/franqueado/academy" },
  { label: "Financeiro", path: "/franqueado/financeiro" },
  { label: "Contratos", path: "/franqueado/contratos" },
  { label: "Diagnóstico", path: "/franqueado/diagnostico" },
  { label: "Minha Unidade", path: "/franqueado/unidade" },
  { label: "Metas & Ranking", path: "/franqueado/metas" },
  { label: "Suporte", path: "/franqueado/suporte" },
];

const franqueadoActions = [
  { label: "Novo Lead", path: "/franqueado/crm" },
  { label: "Nova Proposta", path: "/franqueado/propostas" },
];

const clientePages = [
  { label: "Início", path: "/cliente/inicio" },
  { label: "Tarefas", path: "/cliente/checklist" },
  { label: "Agenda", path: "/cliente/agenda" },
  { label: "Gamificação", path: "/cliente/gamificacao" },
  { label: "Plano de Vendas", path: "/cliente/plano-vendas" },
  { label: "CRM", path: "/cliente/crm" },
  { label: "WhatsApp", path: "/cliente/chat" },
  { label: "Agentes IA", path: "/cliente/agentes-ia" },
  { label: "Scripts", path: "/cliente/scripts" },
  { label: "Disparos", path: "/cliente/disparos" },
  { label: "Relatórios", path: "/cliente/dashboard" },
  { label: "Plano de Marketing", path: "/cliente/plano-marketing" },
  { label: "Conteúdos", path: "/cliente/conteudos" },
  { label: "Postagem", path: "/cliente/postagem" },
  { label: "Redes Sociais", path: "/cliente/redes-sociais" },
  { label: "Sites", path: "/cliente/sites" },
  { label: "Tráfego Pago", path: "/cliente/trafego-pago" },
  { label: "Integrações", path: "/cliente/integracoes" },
  { label: "Plano & Créditos", path: "/cliente/plano-creditos" },
  { label: "Configurações", path: "/cliente/configuracoes" },
  { label: "Avaliações", path: "/cliente/avaliacoes" },
  { label: "Suporte", path: "/cliente/suporte" },
  { label: "Marketing Hub", path: "/cliente/marketing-hub" },
  { label: "Comunicados", path: "/cliente/comunicados" },
];

const clienteActions = [
  { label: "Novo Lead", path: "/cliente/crm" },
  { label: "Novo Script", path: "/cliente/scripts" },
  { label: "Novo Conteúdo", path: "/cliente/conteudos" },
];

function getPortalData(pathname: string) {
  if (pathname.startsWith("/cliente")) return { pages: clientePages, actions: clienteActions };
  if (pathname.startsWith("/franqueado/") || pathname === "/franqueado") return { pages: franqueadoPages, actions: franqueadoActions };
  return { pages: franqueadoraPages, actions: franqueadoraActions };
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessRoute, isReadOnly } = useRoleAccess();

  const { pages, actions } = useMemo(() => {
    const data = getPortalData(location.pathname);
    // Filter out routes the current user cannot access
    return {
      pages: data.pages.filter((p) => canAccessRoute(p.path)),
      actions: data.actions.filter((a) => canAccessRoute(a.path)),
    };
  }, [location.pathname, canAccessRoute]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar no sistema...</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar páginas, ações..."  aria-label="Buscar páginas, ações"/>
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            {pages.map((item) => (
              <CommandItem key={item.path} onSelect={() => handleSelect(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {actions.length > 0 && (
            <CommandGroup heading="Ações Rápidas">
              {actions.map((item) => (
                <CommandItem key={item.path + item.label} onSelect={() => handleSelect(item.path)}>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
