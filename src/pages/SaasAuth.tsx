import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import logoDark from "@/assets/NOE3.png";

const SaasAuth = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [mode, setMode] = useState<"form" | "forgot">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seu email e senha.");
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
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName, signup_source: "saas" },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Provision SaaS account via edge function
    if (data.user) {
      try {
        const { error: fnError } = await supabase.functions.invoke("signup-saas", {
          body: { user_id: data.user.id, company_name: companyName || fullName + "'s Company" },
        });
        if (fnError) console.error("Provisioning error:", fnError);
      } catch (err) {
        console.error("Provisioning error:", err);
      }
    }

    setLoading(false);
    toast.success("Conta criada com sucesso! Bem-vindo ao período de teste.");
    navigate("/cliente/inicio");
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

  return (
    <div className="min-h-screen flex bg-[hsl(225,20%,4%)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(355,78%,50%)] via-[hsl(355,78%,35%)] to-[hsl(225,20%,4%)]" />
        <div className="absolute inset-0 bg-[hsl(225,20%,4%)]/40" />
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <Sparkles className="h-4 w-4 text-[hsl(45,93%,52%)]" />
            <span className="text-sm font-medium text-white/90">7 dias grátis</span>
          </div>
          <h1 className="mb-3">
            <img src={logoDark} alt="NoExcuse" className="h-14 mx-auto object-contain drop-shadow-lg" />
          </h1>
          <p className="text-xl font-semibold text-white/90 mb-1">
            Gestão Comercial
          </p>
          <p className="text-white/60 text-sm max-w-xs mx-auto mt-4">
            Plataforma completa de marketing e vendas para acelerar seus resultados
          </p>
          <div className="mt-10 flex gap-3 justify-center">
            <div className="h-1.5 w-12 rounded-full bg-white/30" />
            <div className="h-1.5 w-8 rounded-full bg-white/15" />
            <div className="h-1.5 w-4 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logoDark} alt="NoExcuse" className="h-8 mx-auto object-contain" />
            <p className="text-sm text-white/60 mt-1">Gestão Comercial</p>
          </div>

          {mode === "forgot" ? (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setMode("form")}
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
                <h2 className="text-2xl font-bold text-white">Recuperar senha</h2>
                <p className="text-white/50 text-sm mt-1">
                  Informe seu email para receber o link de recuperação
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
                  Enviar link
                </Button>
              </form>
            </>
          ) : (
            <>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
                <TabsList className="w-full bg-white/5 border border-white/10">
                  <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white/70">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          id="login-email"
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
                      <Label htmlFor="login-password" className="text-white/70">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          id="login-password"
                          type="password"
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
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-[hsl(225,20%,4%)] text-white/40">ou</span></div>
                  </div>

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
                    Entrar com Google
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-white/40 hover:text-white/70 w-full text-center block mt-2 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </TabsContent>

                <TabsContent value="signup" className="mt-6 space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-white/70">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-company" className="text-white/70">Nome da empresa</Label>
                      <div className="relative">
                        <Input
                          id="signup-company"
                          type="text"
                          placeholder="Sua empresa"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white/70">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          id="signup-email"
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
                      <Label htmlFor="signup-password" className="text-white/70">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar conta grátis
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-[hsl(225,20%,4%)] text-white/40">ou</span></div>
                  </div>

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
                    Criar conta com Google
                  </Button>

                  <p className="text-center text-xs text-white/30 mt-4">
                    Teste grátis por 7 dias • Sem cartão de crédito
                  </p>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaasAuth;
