// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, Settings2, ChevronDown, FileSpreadsheet, BookUser, HelpCircle } from "lucide-react";
import { Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClienteCRMHeaderProps {
  activeTab: "pipeline" | "contatos";
  setActiveTab: (t: "pipeline" | "contatos") => void;
  allLeadsCount: number;
  crmSettingsLeadRouletteEnabled?: boolean;
  atLimit: boolean;
  view: "kanban" | "list";
  setView: (v: "kanban" | "list") => void;
  setNewLeadOpen: (v: boolean) => void;
  setCsvImportOpen: (v: boolean) => void;
  setTutorialOpen: (v: boolean) => void;
  tutorialOpen: boolean;
  configRoute?: string;
}

export function ClienteCRMHeader({
  activeTab,
  setActiveTab,
  allLeadsCount,
  crmSettingsLeadRouletteEnabled,
  atLimit,
  view,
  setView,
  setNewLeadOpen,
  setCsvImportOpen,
  setTutorialOpen,
  configRoute = "/cliente/crm/config",
}: ClienteCRMHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <PageHeader
      title="CRM de Vendas"
      subtitle={activeTab === "pipeline"
        ? `${allLeadsCount} leads · Gerencie seus leads e oportunidades`
        : "Base de dados de contatos"
      }
      icon={<Users className="w-5 h-5 text-primary" />}
      actions={
        <div className="flex items-center gap-2">
          {crmSettingsLeadRouletteEnabled && activeTab === "pipeline" && (
            <Badge variant="outline" className="text-[10px] gap-1"><Shuffle className="w-3 h-3" /> Roleta ativa</Badge>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTutorialOpen(true)}>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tutorial do CRM</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant={activeTab === "contatos" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setActiveTab(activeTab === "contatos" ? "pipeline" : "contatos")}
          >
            <BookUser className="w-3.5 h-3.5" />
            Contatos
          </Button>

          {activeTab === "pipeline" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1" disabled={atLimit}>
                    <Plus className="w-3.5 h-3.5" /> Novo Lead
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    if (atLimit) {
                      toast({ title: "Limite de leads atingido", description: "Faça upgrade do plano para adicionar mais leads.", variant: "destructive" });
                      return;
                    }
                    setNewLeadOpen(true);
                  }} className="gap-2 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Criar Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCsvImportOpen(true)} className="gap-2 text-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Importar Planilha
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
                <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("kanban")}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("list")}>
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}

          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => navigate(configRoute)}>
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Configurações</span>
          </Button>
        </div>
      }
    />
  );
}
