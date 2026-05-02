// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, CheckCircle, X, Check, PartyPopper } from "lucide-react";
import logoDark from "@/assets/NOE3.png";

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Um caractere especial (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const Welcome = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const portal = searchParams.get("portal") || "";
  const tokenHash = searchParams.get("token_hash") || "";
  const tokenType = searchParams.get("type") || "";
  const tokenEmail = searchParams.get("email") || "";

  const allRulesPass = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    // Check if URL hash contains an error from Supabase redirect (e.g. otp_expired)
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const hashParams = new URLSearchParams(hash.replace("#", ""));
      const errorCode = hashParams.get("error_code");
      const errorDesc = hashParams.get("error_description");
      console.warn("[Welcome] URL hash error:", errorCode, errorDesc);

      // If we have token_hash params, we can still try explicit verification
      if (tokenHash && tokenType) {
        // Clean the hash so it doesn't interfere
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        // No token_hash — this is a legacy link that already expired
        setSessionError(true);
        setVerifying(false);
        return;
      }
    }

    // If we have token_hash, verify explicitly (new flow)
    if (tokenHash && tokenType) {
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: tokenType as "recovery",
      }).then(({ data, error }) => {
        if (error) {
          console.error("[Welcome] verifyOtp error:", error.message);
          setSessionError(true);
          setVerifying(false);
        } else if (data?.session) {
          setSessionReady(true);
          setVerifying(false);
        } else {
          console.warn("[Welcome] verifyOtp returned no session");
          setSessionError(true);
          setVerifying(false);
        }
      });
      return;
    }

    // Legacy flow: listen for auth state changes (for old action_link style)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setSessionReady(true);
        setVerifying(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        setVerifying(false);
      }
    });

    const timeout = setTimeout(() => {
      setVerifying(false);
      setSessionReady((ready) => {
        if (!ready) setSessionError(true);
        return ready;
      });
    }, 15000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [tokenHash, tokenType]);

  const getRedirectPath = () => {
    if (portal === "franchise") return "/acessofranquia";
    if (portal === "saas") return "/";
    return "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass) {
      reportError(new Error("A senha não atende todos os requisitos."), { title: "A senha não atende todos os requisitos.", category: "welcome.validation" });
      return;
    }
    if (password !== confirmPassword) {
      reportError(new Error("As senhas não coincidem"), { title: "As senhas não coincidem", category: "welcome.validation" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      console.error("[Welcome] updateUser error:", error.message, error.status, error);

      // Map specific errors to user-friendly messages
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("same_password") || msg.includes("different_password")) {
        reportError(error, { title: "A nova senha deve ser diferente da senha atual.", category: "welcome.auth" });
      } else if (msg.includes("weak_password") || msg.includes("leaked") || msg.includes("pwned") || msg.includes("breached")) {
        reportError(error, { title: "Essa senha foi encontrada em vazamentos de dados. Por segurança, escolha uma senha diferente que não tenha sido exposta.", category: "welcome.auth" });
      } else if (error.status === 401 || msg.includes("not authenticated") || msg.includes("session")) {
        reportError(error, { title: "Sessão expirada. Peça ao administrador para reenviar o convite.", category: "welcome.auth" });
      } else if (error.status === 403) {
        reportError(error, { title: "Link expirado. Peça ao administrador para reenviar o convite.", category: "welcome.auth" });
      } else {
        reportError(error, { title: error.message || "Erro ao criar senha. Tente novamente.", category: "welcome.auth" });
      }
    } else {
      setSuccess(true);
      toast.success("Conta criada com sucesso!");

      // Mark invitation as accepted via edge function (no auth needed)
      try {
        const email = tokenEmail || (await supabase.auth.getUser()).data?.user?.email;
        if (email) {
          const { data: respData, error: fnErr } = await invokeEdge("manage-member", {
            body: { action: "accept_invitation", email },
          });
          if (fnErr) {
            console.warn("[Welcome] manage-member invoke error:", fnErr);
          } else if (respData?.error) {
            console.warn("[Welcome] manage-member returned error:", respData.error);
          }
        }
      } catch (e) {
        console.warn("[Welcome] Failed to mark invitation as accepted:", e);
      }

      await supabase.auth.signOut({ scope: "local" });
      const dest = getRedirectPath();
      setTimeout(() => navigate(dest), 2500);
    }
  };

  return (
    <>
      <SEOHead
        title="Bem-vindo ao Sistema Noé"
        description="Comece sua jornada na plataforma de marketing digital para franquias. Configure sua conta e acesse todas as ferramentas."
        canonical="https://noexcuse.com.br/welcome"
        noindex={true}
      />
    <div className="min-h-screen flex items-center justify-center p-8 bg-[hsl(0,0%,5%)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logoDark} alt="NoExcuse" className="h-8 mx-auto object-contain" />
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-[hsl(355,78%,50%)] mx-auto" />
            <h2 className="text-xl font-bold text-white">Conta criada com sucesso!</h2>
            <p className="text-white/50 text-sm">Redirecionando para o login...</p>
          </div>
        ) : sessionError && !sessionReady ? (
          <div className="text-center space-y-4">
            <X className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Link expirado ou inválido</h2>
            <p className="text-white/50 text-sm">Peça ao administrador para reenviar o convite.</p>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => navigate("/")}
            >
              Ir para o login
            </Button>
          </div>
        ) : verifying || !sessionReady ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-white/50 mx-auto animate-spin" />
            <p className="text-white/50 text-sm">Verificando seu convite...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <PartyPopper className="h-6 w-6 text-[hsl(355,78%,50%)]" />
                <h2 className="text-2xl font-bold text-white">Bem-vindo!</h2>
              </div>
              <p className="text-white/50 text-sm">
                Crie sua senha para acessar a plataforma NoExcuse Digital
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Sua senha</Label>
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

              {password.length > 0 && (
                <div className="space-y-1.5 rounded-lg bg-white/5 p-3">
                  {PASSWORD_RULES.map((rule) => {
                    const pass = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2 text-xs">
                        {pass ? (
                          <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-white/30 shrink-0" />
                        )}
                        <span className={pass ? "text-green-400" : "text-white/40"}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
               )}


              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-white/70">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                  <PasswordInput
                    id="confirm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                    required
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-400">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white"
                disabled={loading || !allRulesPass || !passwordsMatch}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar minha conta
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default Welcome;
