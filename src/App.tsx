import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { FranqueadoraLayout } from "./components/FranqueadoraLayout";
import FinanceiroDashboard from "./pages/FinanceiroDashboard";
import FinanceiroMesAMes from "./pages/FinanceiroMesAMes";
import FinanceiroClientes from "./pages/FinanceiroClientes";
import FinanceiroConfiguracoes from "./pages/FinanceiroConfiguracoes";

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
              <Route path="financeiro/mes-a-mes" element={<FinanceiroMesAMes />} />
              <Route path="financeiro/clientes" element={<FinanceiroClientes />} />
              <Route path="financeiro/configuracoes" element={<FinanceiroConfiguracoes />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
