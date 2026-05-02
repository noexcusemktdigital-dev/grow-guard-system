import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, CheckCircle, X, Check } from "lucide-react";
import logoDark from "@/assets/NOE3.png";

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Um caractere especial (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const portal = searchParams.get("portal") || "";
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") || "recovery";

  const allRulesPass = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    let cancelled = false;

    // --- Method 1: Explicit token_hash verification (scanner-proof) ---
    if (tokenHash) {
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as "recovery" | "email" | "signup" | "invite" | "magiclink" | "email_change",
      }).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[ResetPassword] verifyOtp error:", error.message);
          setSessionError(true);
        } else if (data?.session) {
          setSessionReady(true);
          setRecoveryConfirmed(true);
        } else {
          console.warn("[ResetPassword] verifyOtp returned no session");
          setSessionError(true);
        }
      });
      return () => { cancelled = true; };
    }

    // --- Method 2: Fallback for old-style action_link URLs ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setRecoveryConfirmed(true);
      }
      if (event === "SIGNED_IN" && session) {
        setSessionReady(true);
        setRecoveryConfirmed(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) {
        setSessionReady(true);
      }
    });

    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setSessionError(true);
        return ready;
      });
    }, 15000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [tokenHash, otpType]);

  const getRedirectPath = () => {
    if (portal === "franchise") return "/acessofranquia";
    if (portal === "saas") return "/";
    const storageKey = localStorage.getItem("noe-franchise-auth");
    if (storageKey) return "/acessofranquia";
    return "/";
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass) {
      toast.error("A senha não atende todos os requisitos.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!recoveryConfirmed) {
      console.warn("[ResetPassword] Recovery event not yet confirmed. Waiting…");
      await new Promise((r) => setTimeout(r, 2000));
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      console.error("[ResetPassword] updateUser error:", error.message, error.status, error);
      if (error.message?.includes("same_password")) {
        toast.error("A nova senha deve ser diferente da senha atual.");
      } else if (error.message?.includes("Password should be")) {
        toast.error("A senha não atende os requisitos mínimos de segurança.");
      } else if (error.status === 422) {
        toast.error("Sessão de recuperação inválida ou expirada. Solicite um novo link de recuperação.");
      } else if (error.status === 403) {
        toast.error("Sessão expirada. Solicite um novo link de recuperação.");
      } else {
        toast.error(error.message || "Erro ao redefinir senha. Tente novamente.");
      }
    } else {
      setSuccess(true);
      toast.success("Senha definida com sucesso!");
      await supabase.auth.signOut({ scope: "local" });
      const dest = getRedirectPath();
      setTimeout(() => navigate(dest), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[hsl(0,0%,5%)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logoDark} alt="NoExcuse" className="h-8 mx-auto object-contain" />
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-[hsl(355,78%,50%)] mx-auto" />
            <h2 className="text-xl font-bold text-white">Senha definida!</h2>
            <p className="text-white/50 text-sm">Redirecionando para a plataforma...</p>
          </div>
        ) : sessionError && !sessionReady ? (
          <div className="text-center space-y-4">
            <X className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Link expirado ou inválido</h2>
            <p className="text-white/50 text-sm">Solicite um novo link de recuperação de senha.</p>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => navigate("/")}
            >
              Voltar ao login
            </Button>
          </div>
        ) : !sessionReady ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 text-white/50 mx-auto animate-spin" />
            <p className="text-white/50 text-sm">Verificando link de recuperação...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Defina sua senha</h2>
              <p className="text-white/50 text-sm mt-1">
                Crie uma senha segura para acessar a plataforma
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Nova senha</Label>
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
                Definir senha
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
