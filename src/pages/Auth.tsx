import { useState, useEffect } from "react";
import { supabase, PORTAL_STORAGE_KEY } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import logoDark from "@/assets/NOE3.png";
import { validatePortalAccess } from "@/lib/portalRoleGuard";
import { useAuth } from "@/contexts/AuthContext";

const PHRASES = [
  "SEM DESCULPAS.\nSÓ RESULTADOS.",
  "SUA FRANQUIA\nNO PRÓXIMO NÍVEL.",
  "GESTÃO INTELIGENTE,\nCRESCIMENTO REAL.",
  "CADA DIA É UMA NOVA\nCHANCE DE LIDERAR.",
  "DISCIPLINA HOJE,\nLIBERDADE AMANHÃ.",
  "FOCO NO PROCESSO,\nO RESULTADO VEM.",
];

const Auth = () => {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const navigate = useNavigate();

  // Guard: if JS module was loaded from a SaaS path (/app, /cliente, /),
  // the storageKey is "noe-saas-auth" but this page needs "noe-franchise-auth".
  // Force a hard reload so the module re-initializes with the correct key.
  useEffect(() => {
    if (PORTAL_STORAGE_KEY !== "noe-franchise-auth") {
      window.location.replace(window.location.href);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
        setFadeIn(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message?.includes("Email not confirmed")) {
        toast.error("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
      } else {
        toast.error("Credenciais inválidas. Verifique seu email e senha.");
      }
      return;
    }
    // Block SaaS users from franchise portal (with timeout fallback)
    try {
      const check = await Promise.race([
        validatePortalAccess(data.user.id, "franchise"),
        new Promise<{ allowed: boolean }>((resolve) =>
          setTimeout(() => resolve({ allowed: true }), 3000)
        ),
      ]);
      if (!check.allowed) {
        setLoading(false);
        await supabase.auth.signOut({ scope: 'local' });
        toast.error((check as unknown as { message?: string }).message || "Acesso negado.");
        if ((check as unknown as { redirect?: string }).redirect) navigate((check as unknown as { redirect?: string }).redirect);
        return;
      }
    } catch (err) {
      // Portal validation failed, proceeding
    }
    // Determine redirect based on user role
    let destination = "/franqueado/inicio";
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (roleData && roleData.length > 0) {
        const roles = roleData.map((r) => r.role as string);
        if (roles.includes("super_admin") || roles.includes("admin")) {
          destination = "/franqueadora/inicio";
        }
      }
    } catch (err) {
      // Role fetch failed, using default redirect
    }
    setLoading(false);
    navigate(destination);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: { email, portal: "franchise" },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erro ao enviar email de recuperação.");
      } else {
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setMode("login");
      }
    } catch {
      toast.error("Erro ao enviar email de recuperação.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — red gradient with phrases */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-[hsl(355,78%,50%)] via-[hsl(355,78%,40%)] to-[hsl(355,78%,25%)]">
        <div className="relative z-10 text-center px-12 max-w-lg">
          <p
            className="text-white font-black uppercase italic tracking-tighter leading-[0.95] whitespace-pre-line"
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 4.5rem)",
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {PHRASES[phraseIndex]}
          </p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full translate-y-1/2 translate-x-1/4" />
      </div>

      {/* Right panel — dark form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[hsl(0,0%,5%)]">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <img src={logoDark} alt="NoExcuse" className="h-8 mx-auto object-contain" />
          </div>

          {mode === "login" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
                <p className="text-white/50 text-sm mt-1">Entre com suas credenciais para acessar a plataforma</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-white/40 hover:text-white/70 w-full text-center block mt-2 transition-colors"
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
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
                <h2 className="text-2xl font-bold text-white">Recuperar senha</h2>
                <p className="text-white/50 text-sm mt-1">
                  Informe seu email e enviaremos um link para redefinir sua senha
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white/70">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-white/30 mt-8">
            Acesso somente por convite do administrador
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 text-xs text-white/25">
            <Link to="/privacidade" className="hover:text-white/50 transition-colors">Política de Privacidade</Link>
            <span>•</span>
            <Link to="/termos" className="hover:text-white/50 transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
