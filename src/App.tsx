import { lazy, Suspense } from "react";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleAccessGuard } from "./components/RoleAccessGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { AnalyticsPageTracker } from "@/lib/analytics-page-tracker";

// Eager: only truly critical auth pages
import SaasAuth from "./pages/SaasAuth";
import NotFound from "./pages/NotFound";

const Auth = lazy(() => import("./pages/Auth"));
const PlataformaDoEmpresario = lazy(() => import("./pages/PlataformaDoEmpresario"));
const SaasLanding = lazy(() => import("./pages/SaasLanding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Welcome = lazy(() => import("./pages/Welcome"));

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
const FranqueadoraChat = lazy(() => import("./pages/franqueadora/FranqueadoraChat"));
const NotificacoesPage = lazy(() => import("./pages/NotificacoesPage"));
const ApresentacaoPage = lazy(() => import("./pages/Apresentacao"));
const Anuncios = lazy(() => import("./pages/Anuncios"));
const FranqueadoAnuncios = lazy(() => import("./pages/franqueado/FranqueadoAnuncios"));
const AdsNetwork = lazy(() => import("./pages/franqueadora/AdsNetwork"));

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
const FranqueadoAcompanhamento = lazy(() => import("./pages/franqueado/FranqueadoAcompanhamento"));

// Cliente pages
const ClienteInicio = lazy(() => import("./pages/cliente/ClienteInicio"));
const ClienteAcompanhamento = lazy(() => import("./pages/cliente/ClienteAcompanhamento"));
const ClienteChecklist = lazy(() => import("./pages/cliente/ClienteChecklist"));
const ClienteNotificacoes = lazy(() => import("./pages/cliente/ClienteNotificacoes"));
const ClienteGamificacao = lazy(() => import("./pages/cliente/ClienteGamificacao"));
const ClientePlanoVendas = lazy(() => import("./pages/cliente/ClientePlanoVendas"));
const ClienteChat = lazy(() => import("./pages/cliente/ClienteChat"));
const ClienteGPSNegocio = lazy(() => import("./pages/cliente/ClienteGPSNegocio"));
const ClienteCRM = lazy(() => import("./pages/cliente/ClienteCRM"));
const CrmConfigPage = lazy(() => import("./components/crm/CrmConfigPage"));
const CrmMetaLeadAdsPage = lazy(() => import("./components/crm/CrmMetaLeadAdsPage"));
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
const ClienteFaq = lazy(() => import("./pages/cliente/ClienteFaq"));
const ContasSociais = lazy(() => import("./pages/cliente/ContasSociais"));
const SocialAnalytics = lazy(() => import("./pages/cliente/SocialAnalytics"));
const ClienteRedesSociaisHub = lazy(() => import("./pages/cliente/ClienteRedesSociaisHub"));
const ClientePostagem = lazy(() => import("./pages/cliente/ClientePostagem"));

// PERF-005: staleTime aumentado para 2min (era 30s) — reduz refetches em ~75%
// e alivia CPU do banco. Queries que precisam de dados frescos (CRM kanban, créditos,
// notificações realtime) sobrescrevem localmente com staleTime menor.
// gcTime de 15min mantém o cache em memória para navegação rápida entre páginas.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,         // 5min default global
      gcTime: 1000 * 60 * 15,           // 15min em memória
      retry: 1,
      refetchOnWindowFocus: false,      // Evita refetch ao voltar pra aba
      refetchOnReconnect: false,        // Evita tempestade de refetch ao reconectar
    },
  },
});

/**
 * AdminOnlyRoute — redireciona cliente_user para /cliente/inicio antes de montar o componente.
 * Defesa em profundidade: o FeatureGateOverlay bloqueia visualmente, mas o componente ainda
 * era montado e as queries eram executadas. Este wrapper impede a montagem completa.
 */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  if (role === "cliente_user") return <Navigate to="/cliente/inicio" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

// UX-002/003: Boundary granular por página — erro em uma rota não desmonta o portal inteiro.
// Envolve cada <Route element> com Suspense + ErrorBoundary próprios.
// O Suspense global no App ainda existe como fallback para o primeiro carregamento.
function PageBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsPageTracker />
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Auth routes */}
              <Route path="/acessofranquia" element={<Auth />} />
              <Route path="/app" element={<Navigate to="/" replace />} />
              <Route path="/landing" element={<Navigate to="/crescimento" replace />} />
              <Route path="/termos" element={<TermosDeUso />} />
              <Route path="/privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/apresentacao/:id" element={<PageBoundary><ApresentacaoPage /></PageBoundary>} />

              <Route path="/" element={<SaasAuth />} />
              <Route path="/crescimento" element={<SaasLanding />} />
              <Route path="/plataformadoempresario" element={<PageBoundary><PlataformaDoEmpresario /></PageBoundary>} />

              {/* Protected app shell */}
              <Route path="/franqueadora/*" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]}><Index /></ProtectedRoute>}>
                <Route path="*" element={<ErrorBoundary><FranqueadoraLayout /></ErrorBoundary>}>
                  <Route index element={<Navigate to="/franqueadora/inicio" replace />} />
                  <Route path="inicio" element={<Home />} />
                  <Route path="financeiro" element={<FinanceiroDashboard />} />
                  <Route path="contratos" element={<ContratosGerador />} />
                  <Route path="marketing" element={<Marketing />} />
                  <Route path="treinamentos" element={<Academy />} />
                  <Route path="metas" element={<MetasRanking />} />
                  <Route path="unidades" element={<Unidades />} />
                  <Route path="crm" element={<PageBoundary><FranqueadoCRM /></PageBoundary>} />
                  <Route path="crm/config" element={<PageBoundary><CrmConfigPage /></PageBoundary>} />
                  <Route path="crm/integracoes/meta-lead-ads" element={<PageBoundary><CrmMetaLeadAdsPage /></PageBoundary>} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="atendimento" element={<Atendimento />} />
                  <Route path="comunicados" element={<Comunicados />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="matriz" element={<Matriz />} />
                  <Route path="logs" element={<SaasDashboard />} />
                  <Route path="propostas" element={<FranqueadoraPropostas />} />
                  <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
                  <Route path="estrategia" element={<FranqueadoEstrategia />} />
                  <Route path="acompanhamento" element={<PageBoundary><FranqueadoAcompanhamento /></PageBoundary>} />
                  <Route path="perfil" element={<FranqueadoraPerfil />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="candidatos" element={<FranqueadoraCandidatos />} />
                  <Route path="chat" element={<FranqueadoraChat />} />
                  <Route path="notificacoes" element={<NotificacoesPage />} />
                  <Route path="anuncios" element={<PageBoundary><Anuncios /></PageBoundary>} />
                  <Route path="ads-rede" element={<PageBoundary><AdsNetwork /></PageBoundary>} />
                </Route>
              </Route>

              <Route path="/franqueado/*" element={<ProtectedRoute allowedRoles={["franqueado"]}><Index /></ProtectedRoute>}>
                <Route path="*" element={<ErrorBoundary><FranqueadoLayout /></ErrorBoundary>}>
                  <Route index element={<Navigate to="/franqueado/inicio" replace />} />
                  <Route path="inicio" element={<FranqueadoDashboard />} />
                  <Route path="agenda" element={<FranqueadoAgenda />} />
                  <Route path="comunicados" element={<FranqueadoComunicados />} />
                  <Route path="suporte" element={<FranqueadoSuporte />} />
                  <Route path="prospeccao" element={<FranqueadoProspeccaoIA />} />
                  <Route path="estrategia" element={<FranqueadoEstrategia />} />
                  <Route path="propostas" element={<FranqueadoPropostas />} />
                  <Route path="acompanhamento" element={<PageBoundary><FranqueadoAcompanhamento /></PageBoundary>} />
                  <Route path="crm" element={<FranqueadoCRM />} />
                  <Route path="crm/config" element={<CrmConfigPage />} />
                  <Route path="crm/integracoes/meta-lead-ads" element={<CrmMetaLeadAdsPage />} />
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
                  <Route path="anuncios" element={<PageBoundary><FranqueadoAnuncios /></PageBoundary>} />
                </Route>
              </Route>

              {/* Cliente onboarding (full-screen, no sidebar) */}
              <Route path="/cliente/onboarding" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><ClienteOnboardingCompany /></ProtectedRoute>} />

              <Route path="/cliente/*" element={<ProtectedRoute allowedRoles={["cliente_admin", "cliente_user"]}><Index /></ProtectedRoute>}>
                <Route path="*" element={<ErrorBoundary><RoleAccessGuard><ClienteLayout /></RoleAccessGuard></ErrorBoundary>}>
                  <Route index element={<Navigate to="/cliente/inicio" replace />} />
                  <Route path="inicio" element={<ClienteInicio />} />
                  <Route path="checklist" element={<ClienteChecklist />} />
                  <Route path="agenda" element={<ClienteAgenda />} />
                  <Route path="notificacoes" element={<ClienteNotificacoes />} />
                  <Route path="gamificacao" element={<ClienteGamificacao />} />
                  <Route path="plano-vendas" element={<Navigate to="/cliente/gps-negocio" replace />} />
                  <Route path="chat" element={<PageBoundary><ClienteChat /></PageBoundary>} />
                  <Route path="gps-negocio" element={<PageBoundary><ClienteGPSNegocio /></PageBoundary>} />
                  <Route path="crm" element={<PageBoundary><ClienteCRM /></PageBoundary>} />
                  <Route path="crm/config" element={<PageBoundary><CrmConfigPage /></PageBoundary>} />
                  <Route path="crm/integracoes/meta-lead-ads" element={<PageBoundary><CrmMetaLeadAdsPage /></PageBoundary>} />
                  <Route path="agentes-ia" element={<PageBoundary><ClienteAgentesIA /></PageBoundary>} />
                  <Route path="scripts" element={<PageBoundary><ClienteScripts /></PageBoundary>} />
                  <Route path="disparos" element={<AdminOnlyRoute><PageBoundary><ClienteDisparos /></PageBoundary></AdminOnlyRoute>} />
                  <Route path="dashboard" element={<AdminOnlyRoute><PageBoundary><ClienteDashboard /></PageBoundary></AdminOnlyRoute>} />
                  <Route path="plano-marketing" element={<Navigate to="/cliente/gps-negocio" replace />} />
                  <Route path="conteudos" element={<PageBoundary><ClienteConteudos /></PageBoundary>} />
                  <Route path="postagem" element={<PageBoundary><ClientePostagem /></PageBoundary>} />
                  <Route path="redes-sociais" element={<PageBoundary><ClienteRedesSociaisHub /></PageBoundary>} />
                  <Route path="sites" element={<PageBoundary><ClienteSites /></PageBoundary>} />
                  <Route path="trafego-pago" element={<AdminOnlyRoute><PageBoundary><ClienteTrafegoPago /></PageBoundary></AdminOnlyRoute>} />
                  <Route path="integracoes" element={<AdminOnlyRoute><PageBoundary><ClienteIntegracoes /></PageBoundary></AdminOnlyRoute>} />
                  <Route path="plano-creditos" element={<AdminOnlyRoute><PageBoundary><ClientePlanoCreditos /></PageBoundary></AdminOnlyRoute>} />
                  <Route path="configuracoes" element={<ClienteConfiguracoes />} />
                  <Route path="avaliacoes" element={<ClienteAvaliacoes />} />
                  <Route path="suporte" element={<ClienteSuporte />} />
                  <Route path="marketing-hub" element={<ClienteMarketingHub />} />
                  <Route path="comunicados" element={<ClienteComunicados />} />
                  <Route path="faq" element={<ClienteFaq />} />
                  <Route path="acompanhamento" element={<PageBoundary><ClienteAcompanhamento /></PageBoundary>} />
                  <Route path="contas-sociais" element={<Navigate to="/cliente/redes-sociais?tab=contas" replace />} />
                  <Route path="analytics-social" element={<Navigate to="/cliente/redes-sociais?tab=analytics" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        <PWAUpdatePrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
