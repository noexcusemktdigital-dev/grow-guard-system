import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
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

    // Fetch role (highest priority)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id);

    if (roleData && roleData.length > 0) {
      const priorityOrder: AppRole[] = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
      const roles = roleData.map((r) => r.role as AppRole);
      const topRole = priorityOrder.find((p) => roles.includes(p)) || roles[0];
      setRole(topRole);
    } else {
      // New user from SaaS signup — check if they came from Google OAuth or SaaS signup
      const signupSource = currentUser.user_metadata?.signup_source;
      if (signupSource === "saas" || currentUser.app_metadata?.provider === "google") {
        // Provision via edge function
        try {
          const companyName = currentUser.user_metadata?.company_name || 
                             (currentUser.user_metadata?.full_name ? currentUser.user_metadata.full_name + "'s Company" : "Minha Empresa");
          await supabase.functions.invoke("signup-saas", {
            body: { user_id: currentUser.id, company_name: companyName },
          });
          setRole("cliente_admin");
        } catch (err) {
          console.error("Auto-provisioning error:", err);
        }
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchProfileAndRole(newSession.user), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfileAndRole(existingSession.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
