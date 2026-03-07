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
import SaasLanding from "./pages/SaasLanding";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { FranqueadoraLayout } from "./components/FranqueadoraLayout";
import { FranqueadoLayout } from "./components/FranqueadoLayout";
import { ClienteLayout } from "./components/ClienteLayout";
import FinanceiroDashboard from "./pages/FinanceiroDashboard";
import FinanceiroControle from "./pages/FinanceiroControle";
import FinanceiroRepasse from "./pages/FinanceiroRepasse";
import FinanceiroFechamentos from "./pages/FinanceiroFechamentos";
import ContratosGerenciamento from "./pages/ContratosGerenciamento";
import ContratosGerador from "./pages/ContratosGerador";
import ContratosTemplates from "./pages/ContratosTemplates";
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
import SaasDashboard from "./pages/franqueadora/SaasDashboard";
import FranqueadoraPropostas from "./pages/franqueadora/FranqueadoraPropostas";
import FranqueadoraPerfil from "./pages/franqueadora/FranqueadoraPerfil";
import NotificacoesPage from "./pages/NotificacoesPage";
// Franqueado pages
import FranqueadoDashboard from "./pages/franqueado/FranqueadoDashboard";
import FranqueadoAgenda from "./pages/franqueado/FranqueadoAgenda";
import FranqueadoComunicados from "./pages/franqueado/FranqueadoComunicados";
import FranqueadoSuporte from "./pages/franqueado/FranqueadoSuporte";
import FranqueadoProspeccaoIA from "./pages/franqueado/FranqueadoProspeccaoIA";
import FranqueadoEstrategia from "./pages/franqueado/FranqueadoEstrategia";
import FranqueadoPropostas from "./pages/franqueado/FranqueadoPropostas";
import FranqueadoCRM from "./pages/franqueado/FranqueadoCRM";
import FranqueadoMateriais from "./pages/franqueado/FranqueadoMateriais";
import FranqueadoAcademy from "./pages/franqueado/FranqueadoAcademy";
import FranqueadoFinanceiro from "./pages/franqueado/FranqueadoFinanceiro";
import FranqueadoContratos from "./pages/franqueado/FranqueadoContratos";
import FranqueadoPerfil from "./pages/franqueado/FranqueadoPerfil";
import FranqueadoConfiguracoes from "./pages/franqueado/FranqueadoConfiguracoes";
import FranqueadoDiagnostico from "./pages/franqueado/FranqueadoDiagnostico";
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
import ClienteAvaliacoes from "./pages/cliente/ClienteAvaliacoes";
import ClienteOnboardingCompany from "./pages/cliente/ClienteOnboardingCompany";
import ClienteComunicados from "./pages/cliente/ClienteComunicados";
import ClienteSuporte from "./pages/cliente/ClienteSuporte";

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
            <Route path="/acessofranquia" element={<Auth />} />
            <Route path="/app" element={<SaasAuth />} />
            <Route path="/landing" element={<SaasLanding />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected app shell */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
              <Route index element={<Navigate to="/franqueadora/inicio" replace />} />

              {/* Franqueadora — super_admin + admin */}
              <Route path="franqueadora" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]}><FranqueadoraLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/franqueadora/inicio" replace />} />
                <Route path="inicio" element={<Home />} />
                <Route path="financeiro" element={<FinanceiroDashboard />} />
                <Route path="financeiro/controle" element={<FinanceiroControle />} />
                <Route path="financeiro/repasse" element={<FinanceiroRepasse />} />
                <Route path="financeiro/fechamentos" element={<FinanceiroFechamentos />} />
                <Route path="contratos" element={<ContratosGerenciamento />} />
                <Route path="contratos/criar" element={<ContratosGerador />} />
                <Route path="contratos/templates" element={<ContratosTemplates />} />
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
                <Route path="saas" element={<SaasDashboard />} />
                <Route path="propostas" element={<FranqueadoraPropostas />} />
                <Route path="perfil" element={<FranqueadoraPerfil />} />
                <Route path="notificacoes" element={<NotificacoesPage />} />
              </Route>

              {/* Franqueado */}
              <Route path="franqueado" element={<ProtectedRoute allowedRoles={["franqueado"]}><FranqueadoLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/franqueado/inicio" replace />} />
                <Route path="inicio" element={<FranqueadoDashboard />} />
                <Route path="agenda" element={<FranqueadoAgenda />} />
                <Route path="comunicados" element={<FranqueadoComunicados />} />
                <Route path="suporte" element={<FranqueadoSuporte />} />
                <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
                <Route path="estrategia" element={<FranqueadoEstrategia />} />
                <Route path="propostas" element={<FranqueadoPropostas />} />
                <Route path="crm" element={<FranqueadoCRM />} />
                <Route path="materiais" element={<FranqueadoMateriais />} />
                <Route path="academy" element={<FranqueadoAcademy />} />
                <Route path="financeiro" element={<FranqueadoFinanceiro />} />
                <Route path="contratos" element={<FranqueadoContratos />} />
                <Route path="diagnostico" element={<FranqueadoDiagnostico />} />
                <Route path="perfil" element={<FranqueadoPerfil />} />
                <Route path="configuracoes" element={<FranqueadoConfiguracoes />} />
                <Route path="notificacoes" element={<NotificacoesPage />} />
              </Route>

              {/* Cliente onboarding (full-screen, no sidebar) */}
              <Route path="cliente/onboarding" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><ClienteOnboardingCompany /></ProtectedRoute>} />

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
                
                
                <Route path="sites" element={<ClienteSites />} />
                <Route path="trafego-pago" element={<ClienteTrafegoPago />} />
                <Route path="integracoes" element={<ClienteIntegracoes />} />
                <Route path="plano-creditos" element={<ClientePlanoCreditos />} />
                <Route path="configuracoes" element={<ClienteConfiguracoes />} />
                <Route path="avaliacoes" element={<ClienteAvaliacoes />} />
                <Route path="comunicados" element={<ClienteComunicados />} />
                <Route path="suporte" element={<ClienteSuporte />} />
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
