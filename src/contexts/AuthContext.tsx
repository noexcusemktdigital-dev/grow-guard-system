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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (currentUser: User) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    // Determine portal context from URL
    const path = window.location.pathname;
    const isSaasPortal = path.startsWith("/cliente") || path.startsWith("/app") || path === "/" || path.startsWith("/landing");

    // Fetch role (portal-aware)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id);

    if (roleData && roleData.length > 0) {
      const roles = roleData.map((r) => r.role as AppRole);
      
      // Filter roles by current portal context
      const saasRoles: AppRole[] = ["cliente_admin", "cliente_user"];
      const franchiseRoles: AppRole[] = ["super_admin", "admin", "franqueado"];
      const portalRoles = isSaasPortal
        ? roles.filter((r) => saasRoles.includes(r))
        : roles.filter((r) => franchiseRoles.includes(r));

      // Use portal-specific role if available, otherwise fallback to priority
      const priorityOrder: AppRole[] = isSaasPortal
        ? ["cliente_admin", "cliente_user", "super_admin", "admin", "franqueado"]
        : ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
      const topRole = (portalRoles.length > 0 ? portalRoles[0] : null)
        || priorityOrder.find((p) => roles.includes(p))
        || roles[0];
      setRole(topRole);
    } else {
      // New user from SaaS signup — check if they came from Google OAuth or SaaS signup
      const signupSource = currentUser.user_metadata?.signup_source;
      if (signupSource === "saas" || currentUser.app_metadata?.provider === "google") {
        // Provision via edge function with retry
        const companyName = currentUser.user_metadata?.company_name || 
                           (currentUser.user_metadata?.full_name ? currentUser.user_metadata.full_name + "'s Company" : "Minha Empresa");
        
        let provisioned = false;
        for (let attempt = 0; attempt < 2 && !provisioned; attempt++) {
          try {
            console.log(`[Auth] Provisioning attempt ${attempt + 1} for user ${currentUser.id}`);
            await supabase.functions.invoke("signup-saas", {
              body: { user_id: currentUser.id, company_name: companyName },
            });
            
            // Re-fetch role to confirm provisioning worked
            const { data: verifyRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentUser.id);
            
            if (verifyRole && verifyRole.length > 0) {
              const roles = verifyRole.map((r) => r.role as AppRole);
              // SaaS provisioning always yields cliente_admin
              const topRole = roles.find((r) => r === "cliente_admin") || roles[0];
              setRole(topRole);
              provisioned = true;
              console.log(`[Auth] Provisioning successful, role: ${topRole}`);
            } else {
              console.warn(`[Auth] Provisioning attempt ${attempt + 1} completed but no role found`);
            }
          } catch (err) {
            console.error(`[Auth] Provisioning attempt ${attempt + 1} failed:`, err);
          }
        }
        
        if (!provisioned) {
          console.error("[Auth] All provisioning attempts failed for user:", currentUser.id);
          setRole("cliente_admin"); // Fallback so user isn't stuck
        }
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

        if (initializedRef.current) {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        await fetchProfileAndRole(existingSession.user);
      } else {
        // Check default client for OAuth redirect sessions (Google OAuth stores in default key)
        const { data: { session: defaultSession } } = await defaultClient.auth.getSession();
        if (defaultSession) {
          console.log("[Auth] Transferring OAuth session from default client to portal client");
          const { data: { session: transferred } } = await supabase.auth.setSession({
            access_token: defaultSession.access_token,
            refresh_token: defaultSession.refresh_token,
          });
          // Sign out from default client to avoid conflicts
          await defaultClient.auth.signOut({ scope: 'local' });
          if (transferred) {
            setSession(transferred);
            setUser(transferred.user);
            await fetchProfileAndRole(transferred.user);
          }
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
