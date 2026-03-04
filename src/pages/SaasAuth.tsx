import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import logoDark from "@/assets/NOE3.png";
import SaasBrandingPanel from "@/components/SaasBrandingPanel";

const BENEFITS = [
  "CRM completo para nunca perder uma venda",
  "Automação de marketing que trabalha por você",
  "Funil de vendas visual e inteligente",
  "Relatórios que mostram onde está o dinheiro",
  "Gestão de equipe comercial em tempo real",
  "Campanhas de e-mail e WhatsApp integradas",
  "Scripts de vendas prontos para sua equipe",
  "Dashboard com métricas que importam",
  "Controle total dos seus leads e clientes",
  "Integração com redes sociais e tráfego pago",
];

const SaasAuth = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [mode, setMode] = useState<"form" | "forgot" | "verify-email">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setBenefitIndex((i) => (i + 1) % BENEFITS.length);
        setFadeIn(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast.error("Confirme seu email antes de entrar. Verifique sua caixa de entrada.");
      } else {
        toast.error("Credenciais inválidas. Verifique seu email e senha.");
      }
    } else {
      navigate("/cliente/inicio");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, signup_source: "saas" },
        emailRedirectTo: window.location.origin + "/app",
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      // Save terms acceptance
      try {
        await supabase.from("profiles").update({ accepted_terms_at: new Date().toISOString() } as any).eq("id", data.user.id);
      } catch {}
      // Provision org, subscription, wallet
      try {
        await supabase.functions.invoke("signup-saas", {
          body: { user_id: data.user.id, company_name: fullName + "'s Company" },
        });
      } catch (err) {
        console.error("Provisioning error:", err);
      }
    }
    setLoading(false);
    // Show email verification screen
    setMode("verify-email");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      toast.error("Erro ao entrar com Google. Tente novamente.");
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
      toast.success("Email de recuperação enviado!");
      setMode("form");
    }
  };

  const GoogleButton = ({ label }: { label: string }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      onClick={handleGoogleLogin}
      disabled={googleLoading}
    >
      {googleLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      )}
      {label}
    </Button>
  );

  // Email verification screen
  if (mode === "verify-email") {
    return (
      <div className="min-h-screen flex bg-[hsl(225,20%,4%)]">
        <SaasBrandingPanel />
        <div className="flex-1 flex flex-col p-8 overflow-auto">
          <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-full text-center">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[hsl(355,78%,50%)]/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[hsl(355,78%,50%)]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifique seu email</h2>
            <p className="text-white/50 text-sm mb-6">
              Enviamos um link de confirmação para <span className="text-white font-medium">{email}</span>. 
              Clique no link para ativar sua conta e começar seu período de teste gratuito.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  setMode("form");
                  setTab("login");
                }}
              >
                Já confirmei, fazer login
              </Button>
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.resend({ type: "signup", email });
                  if (error) toast.error("Erro ao reenviar. Tente novamente.");
                  else toast.success("Email reenviado!");
                }}
                className="text-sm text-white/40 hover:text-white/70 w-full text-center block transition-colors"
              >
                Reenviar email de confirmação
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[hsl(225,20%,4%)]">
      <SaasBrandingPanel />
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-full">
          <div className="mb-6 shrink-0">
            <div className="lg:hidden text-center mb-6">
              <img src={logoDark} alt="NoExcuse" className="h-10 mx-auto object-contain" />
            </div>
            <div className="h-[100px] flex items-start">
              <p className={`text-xl lg:text-2xl font-black uppercase italic tracking-tighter text-white leading-snug transition-opacity duration-400 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
                {BENEFITS[benefitIndex]}
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(355,78%,50%)] border border-[hsl(355,78%,60%)] shadow-lg shadow-[hsl(355,78%,50%)]/20">
              <Sparkles className="h-5 w-5 text-[hsl(45,93%,52%)]" />
              <span className="text-base font-bold text-white tracking-wide">7 dias grátis</span>
            </div>
          </div>

          {mode === "forgot" ? (
            <>
              <div className="mb-6">
                <button onClick={() => setMode("form")} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Voltar ao login
                </button>
                <h2 className="text-2xl font-bold text-white">Recuperar senha</h2>
                <p className="text-white/50 text-sm mt-1">Informe seu email para receber o link de recuperação</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white/70">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar link
                </Button>
              </form>
            </>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="w-full bg-white/5 border border-white/10">
                <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white/70">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/70">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
                  </Button>
                </form>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-2 bg-[hsl(225,20%,4%)] text-white/40">ou</span></div>
                </div>
                <GoogleButton label="Entrar com Google" />
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-white/40 hover:text-white/70 w-full text-center block mt-2 transition-colors">
                  Esqueci minha senha
                </button>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/70">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input id="signup-name" type="text" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/70">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/70">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5 border-white/20 data-[state=checked]:bg-[hsl(355,78%,50%)] data-[state=checked]:border-[hsl(355,78%,50%)]"
                    />
                    <label htmlFor="terms" className="text-xs text-white/50 leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Link to="/termos" target="_blank" className="text-[hsl(355,78%,60%)] hover:underline">Termos de Uso</Link>
                      {" "}e a{" "}
                      <Link to="/privacidade" target="_blank" className="text-[hsl(355,78%,60%)] hover:underline">Política de Privacidade</Link>
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading || !acceptedTerms}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta grátis
                  </Button>
                </form>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-2 bg-[hsl(225,20%,4%)] text-white/40">ou</span></div>
                </div>
                <GoogleButton label="Criar conta com Google" />
                <p className="text-center text-xs text-white/30 mt-4">Teste grátis por 7 dias • Sem cartão de crédito</p>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaasAuth;
