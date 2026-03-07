import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const pages = [
  { label: "Início", path: "/franqueadora/inicio", group: "Páginas" },
  { label: "CRM & Expansão", path: "/franqueadora/crm", group: "Páginas" },
  { label: "Financeiro", path: "/franqueadora/financeiro/dashboard", group: "Páginas" },
  { label: "Unidades", path: "/franqueadora/unidades", group: "Páginas" },
  { label: "Comunicados", path: "/franqueadora/comunicados", group: "Páginas" },
  { label: "Marketing", path: "/franqueadora/marketing", group: "Páginas" },
  { label: "Academy", path: "/franqueadora/academy", group: "Páginas" },
  { label: "Metas & Ranking", path: "/franqueadora/metas", group: "Páginas" },
  { label: "Onboarding", path: "/franqueadora/onboarding", group: "Páginas" },
  { label: "Contratos", path: "/franqueadora/contratos/gerenciamento", group: "Páginas" },
  { label: "Agenda", path: "/franqueadora/agenda", group: "Páginas" },
  { label: "Atendimento", path: "/franqueadora/atendimento", group: "Páginas" },
  { label: "Matriz de Acesso", path: "/franqueadora/matriz", group: "Páginas" },
];

const quickActions = [
  { label: "Novo Lead", path: "/franqueadora/crm", group: "Ações Rápidas" },
  { label: "Gerar Proposta", path: "/franqueado/propostas", group: "Ações Rápidas" },
  { label: "Novo Comunicado", path: "/franqueadora/comunicados", group: "Ações Rápidas" },
  { label: "Nova Receita", path: "/franqueadora/financeiro/receitas", group: "Ações Rápidas" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
        <CommandInput placeholder="Buscar páginas, ações..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            {pages.map((item) => (
              <CommandItem key={item.path} onSelect={() => handleSelect(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((item) => (
              <CommandItem key={item.path + item.label} onSelect={() => handleSelect(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
