import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const portal = searchParams.get("portal") || "";

  const allRulesPass = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type !== "recovery") {
      const queryParams = new URLSearchParams(window.location.search);
      const queryType = queryParams.get("type");
      if (queryType !== "recovery") {
        // Allow staying on page — the session might already be set
      }
    }
  }, []);

  const getRedirectPath = () => {
    if (portal === "franchise") return "/acessofranquia";
    if (portal === "saas") return "/app";
    // Fallback: try to detect from current storage key / path
    const storageKey = localStorage.getItem("noe-franchise-auth");
    if (storageKey) return "/acessofranquia";
    return "/app";
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
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.message?.includes("same_password")) {
        toast.error("A nova senha deve ser diferente da senha atual.");
      } else {
        toast.error("Erro ao redefinir senha. Tente novamente.");
      }
    } else {
      setSuccess(true);
      toast.success("Senha definida com sucesso!");
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[hsl(355,78%,50%)]"
                    required
                  />
                </div>
              </div>

              {/* Password requirements checklist */}
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="confirm"
                    type="password"
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
