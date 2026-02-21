import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { FranqueadoraLayout } from "./components/FranqueadoraLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<Navigate to="/franqueadora/financeiro" replace />} />
            <Route path="franqueadora" element={<FranqueadoraLayout />}>
              <Route index element={<Navigate to="/franqueadora/financeiro" replace />} />
              <Route path="financeiro" element={<FinanceiroDashboard />} />
              <Route path="financeiro/despesas" element={<FinanceiroDespesas />} />
              <Route path="financeiro/receitas" element={<FinanceiroReceitas />} />
              <Route path="financeiro/repasse" element={<FinanceiroRepasse />} />
              <Route path="financeiro/fechamentos" element={<FinanceiroFechamentos />} />
              <Route path="financeiro/configuracoes" element={<FinanceiroConfiguracoes />} />
              <Route path="contratos" element={<ContratosGerenciamento />} />
              <Route path="contratos/gerador" element={<ContratosGerador />} />
              <Route path="contratos/templates" element={<ContratosTemplates />} />
              <Route path="contratos/configuracoes" element={<ContratosConfiguracoes />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="treinamentos" element={<Academy />} />
              <Route path="metas" element={<MetasRanking />} />
              <Route path="unidades" element={<Unidades />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
