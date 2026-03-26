import { CircleHelp, MessageSquare, BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function SupportButton() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isCliente = role === "cliente_admin" || role === "cliente_user";

  if (!isCliente) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <CircleHelp className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3 space-y-2">
        <p className="text-sm font-semibold">Central de Ajuda</p>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => navigate("/cliente/suporte")}>
          <MessageSquare className="w-3.5 h-3.5" /> Falar com Suporte
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => navigate("/cliente/faq")}>
          <BookOpen className="w-3.5 h-3.5" /> Perguntas Frequentes (FAQ)
        </Button>
      </PopoverContent>
    </Popover>
  );
}
