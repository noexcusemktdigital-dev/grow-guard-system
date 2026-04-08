import { toast } from "sonner";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  franqueado: "Franqueado",
  cliente_admin: "Admin Cliente",
  cliente_user: "Operador",
};

export function UserMenu() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const roleLabel = role ? roleLabels[role] || role : "—";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const target = (role === "cliente_admin" || role === "cliente_user") ? "/" : "/acessofranquia";
    await signOut(target);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors">
          <Avatar className="h-7 w-7">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium text-foreground">{displayName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{email}</span>
            <span className="text-xs text-primary mt-0.5">{roleLabel}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          if (role === "franqueado") navigate("/franqueado/perfil");
          else if (role === "cliente_admin" || role === "cliente_user") navigate("/cliente/configuracoes?tab=perfil");
          else navigate("/franqueadora/perfil");
        }}>
          <User className="mr-2 h-4 w-4" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          if (role === "franqueado") navigate("/franqueado/configuracoes");
          else if (role === "cliente_admin" || role === "cliente_user") navigate("/cliente/configuracoes?tab=organizacao");
          else navigate("/franqueadora/perfil");
        }}>
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
