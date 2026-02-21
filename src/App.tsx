import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { FranqueadoraLayout } from "./components/FranqueadoraLayout";
import { FranqueadoLayout } from "./components/FranqueadoLayout";
import FinanceiroDashboard from "./pages/FinanceiroDashboard";
import FinanceiroConfiguracoes from "./pages/FinanceiroConfiguracoes";
import FinanceiroDespesas from "./pages/FinanceiroDespesas";
import FinanceiroReceitas from "./pages/FinanceiroReceitas";
import FinanceiroRepasse from "./pages/FinanceiroRepasse";
import FinanceiroFechamentos from "./pages/FinanceiroFechamentos";
import ContratosGerenciamento from "./pages/ContratosGerenciamento";
import ContratosGerador from "./pages/ContratosGerador";
import ContratosTemplates from "./pages/ContratosTemplates";
import ContratosConfiguracoes from "./pages/ContratosConfiguracoes";
import Marketing from "./pages/Marketing";
import Academy from "./pages/Academy";
import MetasRanking from "./pages/MetasRanking";
import Unidades from "./pages/Unidades";
import CrmExpansao from "./pages/CrmExpansao";
import Onboarding from "./pages/Onboarding";
import Atendimento from "./pages/Atendimento";
import Comunicados from "./pages/Comunicados";
import Agenda from "./pages/Agenda";
import Home from "./pages/Home";
import Matriz from "./pages/Matriz";
// Franqueado pages
import FranqueadoDashboard from "./pages/franqueado/FranqueadoDashboard";
import FranqueadoAgenda from "./pages/franqueado/FranqueadoAgenda";
import FranqueadoComunicados from "./pages/franqueado/FranqueadoComunicados";
import FranqueadoSuporte from "./pages/franqueado/FranqueadoSuporte";
import FranqueadoProspeccaoIA from "./pages/franqueado/FranqueadoProspeccaoIA";
import FranqueadoDiagnostico from "./pages/franqueado/FranqueadoDiagnostico";
import FranqueadoPropostas from "./pages/franqueado/FranqueadoPropostas";
import FranqueadoCRM from "./pages/franqueado/FranqueadoCRM";
import FranqueadoMateriais from "./pages/franqueado/FranqueadoMateriais";
import FranqueadoAcademy from "./pages/franqueado/FranqueadoAcademy";
import FranqueadoFinanceiro from "./pages/franqueado/FranqueadoFinanceiro";
import FranqueadoContratos from "./pages/franqueado/FranqueadoContratos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<Navigate to="/franqueadora/dashboard" replace />} />
            <Route path="franqueadora" element={<FranqueadoraLayout />}>
              <Route index element={<Navigate to="/franqueadora/dashboard" replace />} />
              <Route path="dashboard" element={<Home />} />
              <Route path="financeiro" element={<FinanceiroDashboard />} />
              <Route path="financeiro/despesas" element={<FinanceiroDespesas />} />
              <Route path="financeiro/receitas" element={<FinanceiroReceitas />} />
              <Route path="financeiro/repasse" element={<FinanceiroRepasse />} />
              <Route path="financeiro/fechamentos" element={<FinanceiroFechamentos />} />
              <Route path="financeiro/configuracoes" element={<FinanceiroConfiguracoes />} />
              <Route path="contratos" element={<ContratosGerenciamento />} />
              <Route path="contratos/criar" element={<ContratosGerador />} />
              <Route path="contratos/templates" element={<ContratosTemplates />} />
              <Route path="contratos/configuracoes" element={<ContratosConfiguracoes />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="treinamentos" element={<Academy />} />
              <Route path="metas" element={<MetasRanking />} />
              <Route path="unidades" element={<Unidades />} />
              <Route path="crm" element={<CrmExpansao />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="atendimento" element={<Atendimento />} />
              <Route path="comunicados" element={<Comunicados />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="matriz" element={<Matriz />} />
            </Route>
            <Route path="franqueado" element={<FranqueadoLayout />}>
              <Route index element={<Navigate to="/franqueado/dashboard" replace />} />
              <Route path="dashboard" element={<FranqueadoDashboard />} />
              <Route path="agenda" element={<FranqueadoAgenda />} />
              <Route path="comunicados" element={<FranqueadoComunicados />} />
              <Route path="suporte" element={<FranqueadoSuporte />} />
              <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
              <Route path="diagnostico" element={<FranqueadoDiagnostico />} />
              <Route path="propostas" element={<FranqueadoPropostas />} />
              <Route path="crm" element={<FranqueadoCRM />} />
              <Route path="materiais" element={<FranqueadoMateriais />} />
              <Route path="academy" element={<FranqueadoAcademy />} />
              <Route path="financeiro" element={<FranqueadoFinanceiro />} />
              <Route path="contratos" element={<FranqueadoContratos />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
