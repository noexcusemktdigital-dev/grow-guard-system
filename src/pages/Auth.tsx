import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import SpaceLoginScene from "@/components/ui/space-login-scene";
import logoLight from "@/assets/noe2.png";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seu email e senha.");
    } else {
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar email de recuperação.");
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — space scene */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <SpaceLoginScene />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logoLight} alt="NoExcuse" className="h-10 mx-auto object-contain" />
          </div>

          {mode === "login" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
                <p className="text-muted-foreground text-sm mt-1">Entre com suas credenciais para acessar a plataforma</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline w-full text-center block mt-2"
                >
                  Esqueci minha senha
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setMode("login")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
                <h2 className="text-2xl font-bold text-foreground">Recuperar senha</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Informe seu email e enviaremos um link para redefinir sua senha
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            Acesso somente por convite do administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
