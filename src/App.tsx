import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eager: Auth pages (first paint)
import Auth from "./pages/Auth";
import SaasAuth from "./pages/SaasAuth";
import SaasLanding from "./pages/SaasLanding";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy: everything else
const Index = lazy(() => import("./pages/Index"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const FranqueadoraLayout = lazy(() => import("./components/FranqueadoraLayout").then(m => ({ default: m.FranqueadoraLayout })));
const FranqueadoLayout = lazy(() => import("./components/FranqueadoLayout").then(m => ({ default: m.FranqueadoLayout })));
const ClienteLayout = lazy(() => import("./components/ClienteLayout").then(m => ({ default: m.ClienteLayout })));

// Franqueadora pages
const Home = lazy(() => import("./pages/Home"));
const FinanceiroDashboard = lazy(() => import("./pages/FinanceiroDashboard"));
const ContratosGerador = lazy(() => import("./pages/ContratosGerador"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Academy = lazy(() => import("./pages/Academy"));
const MetasRanking = lazy(() => import("./pages/MetasRanking"));
const Unidades = lazy(() => import("./pages/Unidades"));
const CrmExpansao = lazy(() => import("./pages/CrmExpansao"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Atendimento = lazy(() => import("./pages/Atendimento"));
const Comunicados = lazy(() => import("./pages/Comunicados"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Matriz = lazy(() => import("./pages/Matriz"));
const SaasDashboard = lazy(() => import("./pages/franqueadora/SaasDashboard"));
const FranqueadoraPropostas = lazy(() => import("./pages/franqueadora/FranqueadoraPropostas"));
const Playbooks = lazy(() => import("./pages/franqueadora/Playbooks"));
const FranqueadoraCandidatos = lazy(() => import("./pages/franqueadora/FranqueadoraCandidatos"));
const FranqueadoraPerfil = lazy(() => import("./pages/franqueadora/FranqueadoraPerfil"));
const NotificacoesPage = lazy(() => import("./pages/NotificacoesPage"));

// Franqueado pages
const FranqueadoDashboard = lazy(() => import("./pages/franqueado/FranqueadoDashboard"));
const FranqueadoAgenda = lazy(() => import("./pages/franqueado/FranqueadoAgenda"));
const FranqueadoComunicados = lazy(() => import("./pages/franqueado/FranqueadoComunicados"));
const FranqueadoSuporte = lazy(() => import("./pages/franqueado/FranqueadoSuporte"));
const FranqueadoProspeccaoIA = lazy(() => import("./pages/franqueado/FranqueadoProspeccaoIA"));
const FranqueadoEstrategia = lazy(() => import("./pages/franqueado/FranqueadoEstrategia"));
const FranqueadoPropostas = lazy(() => import("./pages/franqueado/FranqueadoPropostas"));
const FranqueadoCRM = lazy(() => import("./pages/franqueado/FranqueadoCRM"));
const FranqueadoMateriais = lazy(() => import("./pages/franqueado/FranqueadoMateriais"));
const FranqueadoAcademy = lazy(() => import("./pages/franqueado/FranqueadoAcademy"));
const FranqueadoFinanceiro = lazy(() => import("./pages/franqueado/FranqueadoFinanceiro"));
const FranqueadoContratos = lazy(() => import("./pages/franqueado/FranqueadoContratos"));
const FranqueadoPerfil = lazy(() => import("./pages/franqueado/FranqueadoPerfil"));
const FranqueadoConfiguracoes = lazy(() => import("./pages/franqueado/FranqueadoConfiguracoes"));
const FranqueadoDiagnostico = lazy(() => import("./pages/franqueado/FranqueadoDiagnostico"));
const FranqueadoMinhaUnidade = lazy(() => import("./pages/franqueado/FranqueadoMinhaUnidade"));
const FranqueadoMetasRanking = lazy(() => import("./pages/franqueado/FranqueadoMetasRanking"));

// Cliente pages
const ClienteInicio = lazy(() => import("./pages/cliente/ClienteInicio"));
const ClienteChecklist = lazy(() => import("./pages/cliente/ClienteChecklist"));
const ClienteNotificacoes = lazy(() => import("./pages/cliente/ClienteNotificacoes"));
const ClienteGamificacao = lazy(() => import("./pages/cliente/ClienteGamificacao"));
const ClientePlanoVendas = lazy(() => import("./pages/cliente/ClientePlanoVendas"));
const ClienteChat = lazy(() => import("./pages/cliente/ClienteChat"));
const ClienteCRM = lazy(() => import("./pages/cliente/ClienteCRM"));
const CrmConfigPage = lazy(() => import("./components/crm/CrmConfigPage"));
const ClienteAgentesIA = lazy(() => import("./pages/cliente/ClienteAgentesIA"));
const ClienteScripts = lazy(() => import("./pages/cliente/ClienteScripts"));
const ClienteDisparos = lazy(() => import("./pages/cliente/ClienteDisparos"));
const ClienteDashboard = lazy(() => import("./pages/cliente/ClienteDashboard"));
const ClientePlanoMarketing = lazy(() => import("./pages/cliente/ClientePlanoMarketing"));
const ClienteConteudos = lazy(() => import("./pages/cliente/ClienteConteudos"));
const ClienteRedesSociais = lazy(() => import("./pages/cliente/ClienteRedesSociais"));
const ClienteSites = lazy(() => import("./pages/cliente/ClienteSites"));
const ClienteTrafegoPago = lazy(() => import("./pages/cliente/ClienteTrafegoPago"));
const ClienteIntegracoes = lazy(() => import("./pages/cliente/ClienteIntegracoes"));
const ClientePlanoCreditos = lazy(() => import("./pages/cliente/ClientePlanoCreditos"));
const ClienteConfiguracoes = lazy(() => import("./pages/cliente/ClienteConfiguracoes"));
const ClienteAvaliacoes = lazy(() => import("./pages/cliente/ClienteAvaliacoes"));
const ClienteOnboardingCompany = lazy(() => import("./pages/cliente/ClienteOnboardingCompany"));
const ClienteSuporte = lazy(() => import("./pages/cliente/ClienteSuporte"));
const ClienteAgenda = lazy(() => import("./pages/cliente/ClienteAgenda"));
const ClienteMarketingHub = lazy(() => import("./pages/cliente/ClienteMarketingHub"));
const ClienteComunicados = lazy(() => import("./pages/cliente/ClienteComunicados"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth routes */}
              <Route path="/acessofranquia" element={<Auth />} />
              <Route path="/app" element={<SaasAuth />} />
              <Route path="/landing" element={<Navigate to="/" replace />} />
              <Route path="/termos" element={<TermosDeUso />} />
              <Route path="/privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/" element={<SaasLanding />} />

              {/* Protected app shell */}
              <Route path="/franqueadora/*" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                <Route path="*" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]}><FranqueadoraLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/franqueadora/inicio" replace />} />
                  <Route path="inicio" element={<Home />} />
                  <Route path="financeiro" element={<FinanceiroDashboard />} />
                  <Route path="contratos" element={<ContratosGerador />} />
                  <Route path="marketing" element={<Marketing />} />
                  <Route path="treinamentos" element={<Academy />} />
                  <Route path="metas" element={<MetasRanking />} />
                  <Route path="unidades" element={<Unidades />} />
                  <Route path="crm" element={<CrmExpansao />} />
                  <Route path="crm/config" element={<CrmConfigPage />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="atendimento" element={<Atendimento />} />
                  <Route path="comunicados" element={<Comunicados />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="matriz" element={<Matriz />} />
                  <Route path="logs" element={<SaasDashboard />} />
                  <Route path="propostas" element={<FranqueadoraPropostas />} />
                  <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
                  <Route path="estrategia" element={<FranqueadoEstrategia />} />
                  <Route path="perfil" element={<FranqueadoraPerfil />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="candidatos" element={<FranqueadoraCandidatos />} />
                  <Route path="notificacoes" element={<NotificacoesPage />} />
                </Route>
              </Route>

              <Route path="/franqueado/*" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                <Route path="*" element={<ProtectedRoute allowedRoles={["franqueado"]}><FranqueadoLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/franqueado/inicio" replace />} />
                  <Route path="inicio" element={<FranqueadoDashboard />} />
                  <Route path="agenda" element={<FranqueadoAgenda />} />
                  <Route path="comunicados" element={<FranqueadoComunicados />} />
                  <Route path="suporte" element={<FranqueadoSuporte />} />
                  <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
                  <Route path="estrategia" element={<FranqueadoEstrategia />} />
                  <Route path="propostas" element={<FranqueadoPropostas />} />
                  <Route path="crm" element={<FranqueadoCRM />} />
                  <Route path="crm/config" element={<CrmConfigPage />} />
                  <Route path="materiais" element={<FranqueadoMateriais />} />
                  <Route path="academy" element={<FranqueadoAcademy />} />
                  <Route path="financeiro" element={<FranqueadoFinanceiro />} />
                  <Route path="contratos" element={<FranqueadoContratos />} />
                  <Route path="diagnostico" element={<FranqueadoDiagnostico />} />
                  <Route path="unidade" element={<FranqueadoMinhaUnidade />} />
                  <Route path="metas" element={<FranqueadoMetasRanking />} />
                  <Route path="perfil" element={<FranqueadoPerfil />} />
                  <Route path="configuracoes" element={<FranqueadoConfiguracoes />} />
                  <Route path="notificacoes" element={<NotificacoesPage />} />
                </Route>
              </Route>

              {/* Cliente onboarding (full-screen, no sidebar) */}
              <Route path="/cliente/onboarding" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><ClienteOnboardingCompany /></ProtectedRoute>} />

              <Route path="/cliente/*" element={<ProtectedRoute><Index /></ProtectedRoute>}>
                <Route path="*" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><ClienteLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/cliente/inicio" replace />} />
                  <Route path="inicio" element={<ClienteInicio />} />
                  <Route path="checklist" element={<ClienteChecklist />} />
                  <Route path="agenda" element={<ClienteAgenda />} />
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
                  <Route path="suporte" element={<ClienteSuporte />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
