import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { supabase as defaultClient } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge";
import type { User, Session } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

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
  // Hydrate profile + role from cache to keep app usable when DB is slow/unavailable.
  // Real values re-fetched in background; cache is only a fallback to avoid blank UI.
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const cached = localStorage.getItem("noe-cached-profile");
      return cached ? (JSON.parse(cached) as Profile) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<AppRole | null>(() => {
    try {
      const cached = localStorage.getItem("noe-cached-role");
      return (cached as AppRole) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Guard against concurrent fetchProfileAndRole calls
  const fetchingRef = useRef(false);
  const lastFetchedUserRef = useRef<string | null>(null);
  const roleRef = useRef<AppRole | null>(null);
  const initializedRef = useRef(false);

  // Keep roleRef in sync
  useEffect(() => { roleRef.current = role; }, [role]);

  const fetchProfileAndRole = useCallback(async (currentUser: User, force = false) => {
    // Skip if already fetching or if we already fetched for this user (unless forced)
    if (fetchingRef.current) return;
    if (!force && lastFetchedUserRef.current === currentUser.id && roleRef.current !== null) return;

    fetchingRef.current = true;

    try {
      const path = window.location.pathname;
      const isSaasPortal = path.startsWith("/cliente") || path === "/" || path.startsWith("/crescimento");

      // Fast timeouts (6s) with max 2 retries
      const fetchWithRetry = async <T,>(fn: () => PromiseLike<T>, label: string): Promise<T | null> => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const result = await withTimeout(fn(), 15000, null as T);
            if (result !== null) return result;
          } catch {
            // retry
          }
          if (attempt < 1) await new Promise(r => setTimeout(r, 300));
        }
        return null;
      };

      const portal = isSaasPortal ? "saas" : "franchise";

      const [profileResult, roleResult] = await Promise.all([
        fetchWithRetry(
          // PERF: only fetch the columns the AuthContext exposes — avoids reading
          // every profile column on every login (lighter on DB I/O).
          () => supabase.from("profiles").select("id,full_name,avatar_url,phone,job_title").eq("id", currentUser.id).single(),
          "Profile fetch"
        ),
        fetchWithRetry(
          () => supabase.rpc("get_user_role", { _user_id: currentUser.id, _portal: portal }),
          "Role fetch"
        ),
      ]);

      // Handle profile
      if (profileResult?.data) {
        const p = profileResult.data as Profile;
        setProfile(p);
        try { localStorage.setItem("noe-cached-profile", JSON.stringify(p)); } catch { /* cache is optional */ }
      }

      // Handle roles
      const resolvedRole = (roleResult as { data: AppRole | null } | null)?.data;

      if (resolvedRole) {
        setRole(resolvedRole);
        lastFetchedUserRef.current = currentUser.id;
        try { localStorage.setItem("noe-cached-role", resolvedRole); } catch { /* cache is optional */ }
      } else {
        // SEC-FIX CODE-003: Never grant a role on DB timeout — fail secure instead.
        // Previous code fell back to "cliente_user" or "franqueado", allowing privilege escalation
        // for any user whose role fetch timed out (slow DB, new signup, error state, attacker).
        if (roleResult === null) {
          logger.warn("[Auth] Role fetch timed out — keeping session, will retry on next navigation");
          lastFetchedUserRef.current = currentUser.id;
          return;
        }

        // Genuine "no roles" — wait for provisioning
        const signupSource = currentUser.user_metadata?.signup_source;
        const isGoogleOAuth = currentUser.app_metadata?.provider === "google";

        if (signupSource === "saas" || isGoogleOAuth) {
          if (isGoogleOAuth) {
            const { data: existingOrg } = await supabase.rpc("get_user_org_id", { _user_id: currentUser.id, _portal: "saas" });
            if (!existingOrg) {
              try {
                // Ensure custom client has the session before invoking edge function
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!currentSession) {
                  const { data: { session: defaultSess } } = await defaultClient.auth.getSession();
                  if (defaultSess) {
                    await supabase.auth.setSession({
                      access_token: defaultSess.access_token,
                      refresh_token: defaultSess.refresh_token,
                    });
                  }
                }

                const companyName = currentUser.user_metadata?.full_name
                  ? `${currentUser.user_metadata.full_name}'s Company`
                  : "Minha Empresa";
                await invokeEdge("signup-saas", {
                  body: { user_id: currentUser.id, company_name: companyName },
                });
                logger.info("[Auth] Auto-provisioned Google OAuth user via signup-saas");
              } catch (provisionErr) {
                logger.error("[Auth] Failed to auto-provision Google OAuth user:", provisionErr);
              }
            }
          }

          // Poll for role creation
          let found = false;
          for (let poll = 0; poll < 10 && !found; poll++) {
            await new Promise(r => setTimeout(r, 1000));
            const { data: polledRoles } = await withTimeout(
              supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
              5000,
              { data: null } as { data: { role: string }[] | null }
            );
            if (polledRoles && polledRoles.length > 0) {
              const roles = polledRoles.map((r: { role: string }) => r.role as AppRole);
              const topRole = roles.find((r: AppRole) => r === "cliente_admin") || roles[0];
              setRole(topRole);
              lastFetchedUserRef.current = currentUser.id;
              found = true;
            }
          }
          if (!found) {
            logger.error("[Auth] Role not found after 10s polling — provisioning may have failed. Role set to null.");
            lastFetchedUserRef.current = currentUser.id;
          }
        }
      }
    } catch (err) {
      logger.error("[Auth] fetchProfileAndRole failed:", err);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // STEP 1: Restore session from storage FIRST, before any listener
    const initialize = async () => {
      let restoredSession: Session | null = null;

      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        restoredSession = existingSession;
      } catch (err) {
        logger.error("[Auth] getSession failed:", err);
      }

      // If no session on custom client, check default client for OAuth redirects
      if (!restoredSession) {
        try {
          const { data: { session: defaultSession } } = await defaultClient.auth.getSession();
          if (defaultSession) {
            const { data: { session: transferred } } = await supabase.auth.setSession({
              access_token: defaultSession.access_token,
              refresh_token: defaultSession.refresh_token,
            });
            await defaultClient.auth.signOut({ scope: 'local' });
            restoredSession = transferred;
          }
        } catch (err) {
          logger.error("[Auth] OAuth session transfer failed:", err);
        }
      }

      if (!mounted) return;

      // Apply restored session
      if (restoredSession?.user) {
        setSession(restoredSession);
        setUser(restoredSession.user);
        await fetchProfileAndRole(restoredSession.user, true);
      }

      // Mark loading complete AFTER session is verified
      if (mounted) {
        setLoading(false);
        initializedRef.current = true;
      }

      // STEP 2: Register listener AFTER session is restored
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;

          // Skip INITIAL_SESSION — we already handled it via getSession()
          if (_event === "INITIAL_SESSION") return;

          // For TOKEN_REFRESHED, just update session/user refs — skip re-fetching
          if (_event === "TOKEN_REFRESHED") {
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
            }
            // SEC-FIX: never clear session on TOKEN_REFRESHED with null — it's a transient
            // refresh failure (network blip, slow DB). Keep current session, Supabase will retry.
            return;
          }

          // SIGNED_OUT — only act when explicitly signed out (user clicked logout)
          if (_event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setProfile(null);
            setRole(null);
            lastFetchedUserRef.current = null;
            return;
          }

          // Any other event with no session — ignore to prevent spurious logouts
          if (!newSession) return;

          // SIGNED_IN (new login, not initial)
          setSession(newSession);
          setUser(newSession.user);

          // Fire-and-forget — no await to prevent blocking the listener queue
          fetchProfileAndRole(newSession.user, true).catch((e) =>
            logger.error("[Auth] fetchProfileAndRole in listener failed:", e)
          );

          // PERF: only invoke accept_invitation if a pending invite actually exists for this email.
          // Previously called on every SIGNED_IN, hammering the edge function (7-13s each call).
          if (_event === "SIGNED_IN" && newSession.user.email) {
            const userEmail = newSession.user.email;
            supabase
              .from("pending_invitations")
              .select("id")
              .eq("email", userEmail)
              .is("accepted_at", null)
              .limit(1)
              .maybeSingle()
              .then(({ data }) => {
                if (data) {
                  invokeEdge("manage-member", {
                    body: { action: "accept_invitation", email: userEmail },
                  }).catch((e: unknown) => logger.warn("[Auth] accept_invitation fallback error:", e));
                }
              });
          }
        }
      );

      // Cleanup
      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanupPromise = initialize();

    return () => {
      mounted = false;
      cleanupPromise.then((unsub) => unsub?.());
    };
  }, []);

  const signOut = async (redirectTo?: string) => {
    const target = redirectTo || (
      role === "cliente_admin" || role === "cliente_user" ? "/" : "/acessofranquia"
    );
    analytics.track(ANALYTICS_EVENTS.LOGOUT);
    analytics.reset();
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    lastFetchedUserRef.current = null;
    try {
      localStorage.removeItem("noe-cached-role");
      localStorage.removeItem("noe-cached-profile");
    } catch { /* cache cleanup is optional */ }
    window.location.href = target;
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,phone,job_title")
        .eq("id", user.id)
        .single();
      if (profileData) {
        const p = profileData as Profile;
        setProfile(p);
        try { localStorage.setItem("noe-cached-profile", JSON.stringify(p)); } catch { /* cache is optional */ }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
