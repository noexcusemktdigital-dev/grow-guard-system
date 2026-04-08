import { supabase } from "@/lib/supabase";

type AppRole = "super_admin" | "admin" | "franqueado" | "cliente_admin" | "cliente_user";

const FRANCHISE_ROLES: AppRole[] = ["super_admin", "admin", "franqueado"];
const SAAS_ROLES: AppRole[] = ["cliente_admin", "cliente_user"];

/**
 * After successful login, checks if the user's role is allowed for the current portal.
 * Returns { allowed: true } or { allowed: false, message } and signs out if blocked.
 */
export async function validatePortalAccess(
  userId: string,
  portal: "saas" | "franchise"
): Promise<{ allowed: boolean; message?: string; redirect?: string }> {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  // New users (no role yet) are allowed — they'll be provisioned
  if (!roleData || roleData.length === 0) return { allowed: true };

  const roles = roleData.map((r) => r.role as AppRole);
  const allowedRoles = portal === "saas" ? SAAS_ROLES : FRANCHISE_ROLES;
  const hasAllowedRole = roles.some((r) => allowedRoles.includes(r));

  if (!hasAllowedRole) {
    const redirect = portal === "saas" ? "/acessofranquia" : "/";
    const message =
      portal === "saas"
        ? "Esta conta pertence ao portal da franquia. Acesse /acessofranquia"
        : "Esta conta pertence ao portal SaaS. Acesse /app";
    return { allowed: false, message, redirect };
  }

  return { allowed: true };
}
