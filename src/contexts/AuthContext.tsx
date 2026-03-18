import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { supabase as defaultClient } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
}

type AppRole = "super_admin" | "admin" | "franqueado" | "cliente_admin" | "cliente_user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Timeout helper
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (currentUser: User) => {
    try {
      // Determine portal context from URL
      const path = window.location.pathname;
      const isSaasPortal = path.startsWith("/cliente") || path.startsWith("/app") || path === "/" || path.startsWith("/landing");

      // Fetch profile and roles in parallel with 5s timeout each
      const [profileResult, roleResult] = await Promise.allSettled([
        withTimeout(
          supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
          5000,
          { data: null, error: { message: "timeout" } } as any
        ),
        withTimeout(
          supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
          5000,
          { data: null, error: { message: "timeout" } } as any
        ),
      ]);

      // Handle profile
      if (profileResult.status === "fulfilled" && profileResult.value?.data) {
        setProfile(profileResult.value.data as Profile);
      } else {
        console.warn("[Auth] Profile fetch failed or timed out");
      }

      // Handle roles
      const roleData = roleResult.status === "fulfilled" ? roleResult.value?.data : null;

      if (roleData && roleData.length > 0) {
        const roles = roleData.map((r: any) => r.role as AppRole);

        const saasRoles: AppRole[] = ["cliente_admin", "cliente_user"];
        const franchiseRoles: AppRole[] = ["super_admin", "admin", "franqueado"];
        const portalRoles = isSaasPortal
          ? roles.filter((r: AppRole) => saasRoles.includes(r))
          : roles.filter((r: AppRole) => franchiseRoles.includes(r));

        const priorityOrder: AppRole[] = isSaasPortal
          ? ["cliente_admin", "cliente_user", "super_admin", "admin", "franqueado"]
          : ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
        const topRole = (portalRoles.length > 0 ? portalRoles[0] : null)
          || priorityOrder.find((p) => roles.includes(p))
          || roles[0];
        setRole(topRole);
      } else {
        // New user from SaaS signup — provision
        const signupSource = currentUser.user_metadata?.signup_source;
        if (signupSource === "saas" || currentUser.app_metadata?.provider === "google") {
          const companyName = currentUser.user_metadata?.company_name ||
            (currentUser.user_metadata?.full_name ? currentUser.user_metadata.full_name + "'s Company" : "Minha Empresa");

          let provisioned = false;
          for (let attempt = 0; attempt < 2 && !provisioned; attempt++) {
            try {
              console.log(`[Auth] Provisioning attempt ${attempt + 1} for user ${currentUser.id}`);
              await withTimeout(
                supabase.functions.invoke("signup-saas", {
                  body: { user_id: currentUser.id, company_name: companyName },
                }),
                8000,
                { error: { message: "timeout" } } as any
              );

              const { data: verifyRole } = await withTimeout(
                supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
                5000,
                { data: null } as any
              );

              if (verifyRole && verifyRole.length > 0) {
                const roles = verifyRole.map((r: any) => r.role as AppRole);
                const topRole = roles.find((r: AppRole) => r === "cliente_admin") || roles[0];
                setRole(topRole);
                provisioned = true;
                console.log(`[Auth] Provisioning successful, role: ${topRole}`);
              }
            } catch (err) {
              console.error(`[Auth] Provisioning attempt ${attempt + 1} failed:`, err);
            }
          }

          if (!provisioned) {
            console.error("[Auth] All provisioning attempts failed, using fallback role");
            setRole("cliente_admin");
          }
        } else {
          console.warn("[Auth] No roles found and not a SaaS signup, role remains null");
        }
      }
    } catch (err) {
      console.error("[Auth] fetchProfileAndRole failed:", err);
      // Don't leave role as null for SaaS users — check URL context for fallback
      const path = window.location.pathname;
      if (path.startsWith("/cliente") || path.startsWith("/app")) {
        setRole("cliente_admin");
      }
    }
  };

  const initializedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfileAndRole(newSession.user);
        } else {
          setProfile(null);
          setRole(null);
        }

        // Always set loading to false after processing
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        await fetchProfileAndRole(existingSession.user);
      } else {
        // Check default client for OAuth redirect sessions
        try {
          const { data: { session: defaultSession } } = await defaultClient.auth.getSession();
          if (defaultSession) {
            console.log("[Auth] Transferring OAuth session from default client to portal client");
            const { data: { session: transferred } } = await supabase.auth.setSession({
              access_token: defaultSession.access_token,
              refresh_token: defaultSession.refresh_token,
            });
            await defaultClient.auth.signOut({ scope: 'local' });
            if (transferred) {
              setSession(transferred);
              setUser(transferred.user);
              await fetchProfileAndRole(transferred.user);
            }
          }
        } catch (err) {
          console.error("[Auth] OAuth session transfer failed:", err);
        }
      }
      initializedRef.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (redirectTo?: string) => {
    const target = redirectTo || (
      role === "cliente_admin" || role === "cliente_user" ? "/app" : "/acessofranquia"
    );
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    window.location.href = target;
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileData) {
        setProfile(profileData as Profile);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
