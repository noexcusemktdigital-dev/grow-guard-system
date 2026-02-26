import { LifeBuoy, MessageSquare, BookOpen, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function SupportButton() {
  const { role } = useAuth();
  const isCliente = role === "cliente_admin" || role === "cliente_user";

  if (!isCliente) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <LifeBuoy className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-2">
        <p className="text-sm font-semibold">Central de Suporte</p>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => window.open("/cliente/configuracoes", "_self")}>
          <MessageSquare className="w-3.5 h-3.5" /> Abrir ticket de suporte
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs">
          <BookOpen className="w-3.5 h-3.5" /> Documentação / FAQ
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => window.open("mailto:suporte@noexcuse.com.br")}>
          <Mail className="w-3.5 h-3.5" /> suporte@noexcuse.com.br
        </Button>
      </PopoverContent>
    </Popover>
  );
}
