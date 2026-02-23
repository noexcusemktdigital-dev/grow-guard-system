import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SaasAuth from "./pages/SaasAuth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { FranqueadoraLayout } from "./components/FranqueadoraLayout";
import { FranqueadoLayout } from "./components/FranqueadoLayout";
import { ClienteLayout } from "./components/ClienteLayout";
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
// Cliente Final pages
import ClienteInicio from "./pages/cliente/ClienteInicio";
import ClienteChecklist from "./pages/cliente/ClienteChecklist";
import ClienteNotificacoes from "./pages/cliente/ClienteNotificacoes";
import ClienteGamificacao from "./pages/cliente/ClienteGamificacao";
import ClientePlanoVendas from "./pages/cliente/ClientePlanoVendas";
import ClienteChat from "./pages/cliente/ClienteChat";
import ClienteCRM from "./pages/cliente/ClienteCRM";
import CrmConfigPage from "./components/crm/CrmConfigPage";
import ClienteAgentesIA from "./pages/cliente/ClienteAgentesIA";
import ClienteScripts from "./pages/cliente/ClienteScripts";
import ClienteDisparos from "./pages/cliente/ClienteDisparos";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClientePlanoMarketing from "./pages/cliente/ClientePlanoMarketing";
import ClienteConteudos from "./pages/cliente/ClienteConteudos";
import ClienteRedesSociais from "./pages/cliente/ClienteRedesSociais";
import ClienteSites from "./pages/cliente/ClienteSites";
import ClienteTrafegoPago from "./pages/cliente/ClienteTrafegoPago";
import ClienteIntegracoes from "./pages/cliente/ClienteIntegracoes";
import ClientePlanoCreditos from "./pages/cliente/ClientePlanoCreditos";
import ClienteConfiguracoes from "./pages/cliente/ClienteConfiguracoes";
import ClienteEditorVideo from "./pages/cliente/ClienteEditorVideo";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/app/auth" element={<SaasAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected app shell */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
              <Route index element={<Navigate to="/franqueadora/dashboard" replace />} />

              {/* Franqueadora — super_admin + admin */}
              <Route path="franqueadora" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]}><FranqueadoraLayout /></ProtectedRoute>}>
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

              {/* Franqueado */}
              <Route path="franqueado" element={<ProtectedRoute allowedRoles={["franqueado"]}><FranqueadoLayout /></ProtectedRoute>}>
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

              {/* Cliente Final */}
              <Route path="cliente" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><ClienteLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/cliente/inicio" replace />} />
                <Route path="inicio" element={<ClienteInicio />} />
                <Route path="checklist" element={<ClienteChecklist />} />
                <Route path="notificacoes" element={<ClienteNotificacoes />} />
                <Route path="gamificacao" element={<ClienteGamificacao />} />
                <Route path="plano-vendas" element={<ClientePlanoVendas />} />
                <Route path="chat" element={<ClienteChat />} />
                <Route path="crm" element={<ClienteCRM />} />
                <Route path="crm/config" element={<CrmConfigPage />} />
                
                <Route path="agentes-ia" element={<ClienteAgentesIA />} />
                <Route path="scripts" element={<ClienteScripts />} />
                <Route path="disparos" element={<ClienteDisparos />} />
                <Route path="dashboard" element={<ClienteDashboard />} />
                <Route path="plano-marketing" element={<ClientePlanoMarketing />} />
                <Route path="conteudos" element={<ClienteConteudos />} />
                <Route path="redes-sociais" element={<ClienteRedesSociais />} />
                <Route path="editor-video" element={<ClienteEditorVideo />} />
                <Route path="sites" element={<ClienteSites />} />
                <Route path="trafego-pago" element={<ClienteTrafegoPago />} />
                <Route path="integracoes" element={<ClienteIntegracoes />} />
                <Route path="plano-creditos" element={<ClientePlanoCreditos />} />
                <Route path="configuracoes" element={<ClienteConfiguracoes />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
