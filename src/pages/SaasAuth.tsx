// @ts-nocheck
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { supabase, PORTAL_STORAGE_KEY } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Loader2, Sparkles, CheckCircle2, Check, X, AlertTriangle } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import logoDark from "@/assets/NOE3.png";
import SaasBrandingPanel from "@/components/SaasBrandingPanel";
import { validatePortalAccess } from "@/lib/portalRoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

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
  const [verificationContext, setVerificationContext] = useState<"new" | "existing">("new");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const [referralInfo, setReferralInfo] = useState<{ org_name: string; discount: number } | null>(null);
  const { user: authUser, role: authRole, loading: authLoading } = useAuth();

  // Redirect already-authenticated users based on their role
  useEffect(() => {
    if (authLoading || !authUser) return;

    if (authRole === "cliente_admin" || authRole === "cliente_user") {
      navigate("/cliente/inicio", { replace: true });
    } else if (authRole === "super_admin" || authRole === "admin") {
      navigate("/franqueadora/inicio", { replace: true });
    } else if (authRole === "franqueado") {
      navigate("/franqueado/inicio", { replace: true });
    }
    // If role is null but user exists, wait for role to resolve
  }, [authUser, authRole, authLoading, navigate]);

  // Resolve referral code on mount
  useEffect(() => {
    if (!referralCode) return;
    supabase.rpc("get_referral_by_code", { _code: referralCode }).then(({ data }) => {
      if (data && data.length > 0) {
        setReferralInfo({ org_name: data[0].org_name, discount: data[0].discount_percent });
        setTab("signup"); // Auto-switch to signup
      }
    });
  }, [referralCode]);

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

    let signInResult;
    try {
      signInResult = await supabase.auth.signInWithPassword({ email, password });
    } catch (networkErr) {
      setLoading(false);
      logger.error("[SaasAuth] login network error", networkErr);
      reportError(networkErr, { title: "Não conseguimos contatar o servidor. Verifique sua conexão e tente novamente em instantes.", category: "auth.network" });
      return;
    }

    const { data, error } = signInResult;
    if (error) {
      setLoading(false);
      const msg = (error.message || "").toLowerCase();
      const status = (error as { status?: number }).status;
      logger.error("[SaasAuth] login error", { message: error.message, status });
      analytics.track(ANALYTICS_EVENTS.LOGIN_FAILED, { error_code: error.message, source: "saas" });

      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        reportError(error, { title: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam.", category: "auth.email_not_confirmed" });
        setVerificationContext("existing");
        setMode("verify-email");
      } else if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("invalid_grant")) {
        reportError(error, { title: "E-mail ou senha incorretos. Se entrou pelo Google antes, use 'Entrar com Google' ou 'Esqueci minha senha'.", category: "auth.invalid_credentials" });
      } else if (status === 429 || msg.includes("rate limit") || msg.includes("too many")) {
        reportError(error, { title: "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.", category: "auth.rate_limit" });
      } else if (msg.includes("user not found")) {
        reportError(error, { title: "Nenhuma conta encontrada com esse e-mail. Verifique o endereço ou crie uma conta.", category: "auth.user_not_found" });
      } else if (msg.includes("user disabled") || msg.includes("banned")) {
        reportError(error, { title: "Esta conta está bloqueada. Entre em contato com o suporte.", category: "auth.banned" });
      } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("timeout")) {
        reportError(error, { title: "Serviço temporariamente lento. Aguarde alguns segundos e tente novamente.", category: "auth.network" });
      } else if (status && status >= 500) {
        reportError(error, { title: "Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.", category: "auth.server_error" });
      } else {
        reportError(error, { title: error.message || "Não foi possível entrar. Tente novamente.", category: "auth.login" });
      }
      return;
    }

    // Sign-in succeeded — navigate immediately. Portal validation runs in background
    // and only acts if it returns an explicit deny. DB slowness must NOT block login.
    setLoading(false);
    analytics.identify(data.user.id);
    analytics.track(ANALYTICS_EVENTS.LOGIN_SUCCEEDED, { source: "saas" });
    navigate("/cliente/inicio");

    validatePortalAccess(data.user.id, "saas")
      .then(async (check) => {
        if (!check.allowed) {
          await supabase.auth.signOut({ scope: "local" });
          reportError(new Error(check.message || "Acesso negado."), { title: check.message || "Acesso negado.", category: "auth.portal_access" });
          if (check.redirect) navigate(check.redirect);
        }
      })
      .catch((err) => logger.warn("[SaasAuth] portal validation deferred error", err));
  };

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Número (0-9)", ok: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passedChecks = passwordChecks.filter(c => c.ok).length;
  const passwordStrength = passedChecks <= 1 ? "fraca" : passedChecks <= 3 ? "média" : "forte";
  const strengthColor = passwordStrength === "fraca" ? "hsl(0,72%,51%)" : passwordStrength === "média" ? "hsl(45,93%,52%)" : "hsl(142,71%,45%)";
  const isPasswordValid = password.length >= 8;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      reportError(new Error("A senha deve ter pelo menos 8 caracteres."), { title: "A senha deve ter pelo menos 8 caracteres.", category: "auth.validation" });
      return;
    }
    if (!acceptedTerms) {
      reportError(new Error("Você precisa aceitar os Termos de Uso e a Política de Privacidade."), { title: "Você precisa aceitar os Termos de Uso e a Política de Privacidade.", category: "auth.validation" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await invokeEdge("signup-saas", {
        body: {
          email,
          password,
          full_name: fullName,
          company_name: "Minha Empresa",
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
      });

      if (error || data?.error) {
        setLoading(false);
        const errMsg = data?.error || error?.message || "Erro ao criar conta.";
        if (errMsg === "email_exists") {
          setVerificationContext("existing");
          reportError(new Error(errMsg), { title: "Este email já possui cadastro. Reenviamos a confirmação se a conta ainda não foi ativada.", category: "auth.signup" });
          setMode("verify-email");
        } else {
          reportError(new Error(errMsg), { title: errMsg, category: "auth.signup" });
        }
        return;
      }

      analytics.track(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { source: "saas" });
      setVerificationContext("new");
      setLoading(false);
      setMode("verify-email");
    } catch (err) {
      setLoading(false);
      reportError(err, { title: "Erro ao criar conta. Tente novamente.", category: "auth.signup" });
      logger.error("Signup error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      reportError(error, { title: "Erro ao entrar com Google. Tente novamente.", category: "auth.google" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await invokeEdge("request-password-reset", {
        body: { email, portal: "saas" },
      });
      if (error || data?.error) {
        reportError(error ?? new Error(data?.error), { title: data?.error || "Erro ao enviar email de recuperação.", category: "auth.forgot_password" });
      } else {
        toast.success("Email de recuperação enviado!");
        setMode("form");
      }
    } catch (err) {
      reportError(err, { title: "Erro ao enviar email de recuperação.", category: "auth.forgot_password" });
    }
    setLoading(false);
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
            <h2 className="text-2xl font-bold text-white mb-2">
              {verificationContext === "existing" ? "Este email já está cadastrado" : "Verifique seu email"}
            </h2>
            <p className="text-white/50 text-sm mb-4">
              {verificationContext === "existing" ? (
                <>
                  O email <span className="text-white font-medium">{email}</span> já possui cadastro. Se a conta ainda não foi ativada,
                  você pode reenviar a confirmação abaixo ou entrar após confirmar.
                </>
              ) : (
                <>
                  Enviamos um link de confirmação para <span className="text-white font-medium">{email}</span>. 
                  Clique no link para ativar sua conta e começar seu período de teste gratuito.
                </>
              )}
            </p>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300/90 text-left">
                Não encontrou? Verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo eletrônico</strong>.
              </p>
            </div>
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
                  try {
                    const { data, error } = await invokeEdge("signup-saas", {
                      body: { email, resend_only: true },
                    });
                    if (error || data?.error) reportError(error ?? new Error(data?.error), { title: "Erro ao reenviar. Tente novamente.", category: "auth.resend_email" });
                    else toast.success("Email reenviado!");
                  } catch (err) {
                    reportError(err, { title: "Erro ao reenviar. Tente novamente.", category: "auth.resend_email" });
                  }
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
            {referralInfo && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm text-emerald-400">🎉 Indicação de <strong>{referralInfo.org_name}</strong> — {referralInfo.discount}% de desconto no plano!</span>
              </div>
            )}
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                      <PasswordInput id="login-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                      <PasswordInput id="signup-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]" required />
                    </div>
                    {password.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${(passedChecks / 4) * 100}%`, backgroundColor: strengthColor }}
                            />
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: strengthColor }}>
                            {passwordStrength === "fraca" ? "Fraca" : passwordStrength === "média" ? "Média" : "Forte"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {passwordChecks.map((c) => (
                            <div key={c.label} className="flex items-center gap-1.5">
                              {c.ok ? (
                                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              ) : (
                                <X className="w-3 h-3 text-white/25 shrink-0" />
                              )}
                              <span className={`text-[10px] ${c.ok ? "text-emerald-400" : "text-white/35"}`}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start space-x-2 border border-[hsl(355,78%,50%)]/30 rounded-lg p-3 bg-[hsl(355,78%,50%)]/5">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5 border-[hsl(355,78%,50%)] data-[state=checked]:bg-[hsl(355,78%,50%)] data-[state=checked]:border-[hsl(355,78%,50%)]"
                    />
                    <label htmlFor="terms" className="text-sm text-white/80 leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Link to="/termos" target="_blank" className="text-[hsl(355,78%,60%)] font-semibold underline hover:text-[hsl(355,78%,70%)]">Termos de Uso</Link>
                      {" "}e a{" "}
                      <Link to="/privacidade" target="_blank" className="text-[hsl(355,78%,60%)] font-semibold underline hover:text-[hsl(355,78%,70%)]">Política de Privacidade</Link>
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading || !acceptedTerms || !isPasswordValid}>
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

          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-white/25">
            <Link to="/privacidade" className="hover:text-white/50 transition-colors">Política de Privacidade</Link>
            <span>•</span>
            <Link to="/termos" className="hover:text-white/50 transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaasAuth;
