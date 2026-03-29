import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";

function buildInviteHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 25px;max-width:560px;margin:0 auto;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:22px;font-weight:bold;color:#141a24;margin:0 0 20px;">Você foi convidado</h1>
    <p style="font-size:14px;color:#6c7280;line-height:1.6;margin:0 0 25px;">
      Você foi convidado para a plataforma <strong>NoExcuse Digital</strong>. Clique no botão abaixo para definir sua senha e começar a usar o sistema.
    </p>
    <a href="${confirmationUrl}" style="display:inline-block;background-color:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:500;">
      Definir minha senha
    </a>
    <p style="font-size:12px;color:#999999;margin:30px 0 0;">
      Se você não esperava este convite, pode ignorar este e-mail com segurança.
    </p>
  </div>
</body>
</html>`;
}

async function sendViaResend(to: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject: "Você foi convidado(a) — NoExcuse Digital",
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error [${response.status}]: ${errorBody}`);
  }
}

/** Find an existing user by email using paginated admin.listUsers */
async function findUserByEmail(adminClient: ReturnType<typeof createClient>, email: string): Promise<Record<string, unknown> | null> {
  const normalizedEmail = email.toLowerCase().trim();
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!users || users.length === 0) break;
    const found = users.find((u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail);
    if (found) return found;
    if (users.length < perPage) break; // last page
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[invite-user] Function invoked at", new Date().toISOString());
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const callerId = user.id;

    const { email, full_name, role, organization_id, team_ids } = await req.json();

    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: "email and organization_id required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify caller is member of the org (or parent org for franqueadora)
    const { data: isMember } = await adminClient.rpc("is_member_or_parent_of_org", {
      _user_id: callerId,
      _org_id: organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ---- Determine org type for contextual redirect and limits ----
    const { data: orgData } = await adminClient
      .from("organizations")
      .select("type")
      .eq("id", organization_id)
      .single();
    const orgType = orgData?.type; // 'franqueadora' | 'franqueado' | 'cliente'

    // ---- Validate maxUsers server-side ----
    let maxUsers = 9999; // default for franchise orgs without subscriptions
    if (orgType === "cliente") {
      const { data: sub } = await adminClient
        .from("subscriptions")
        .select("plan, status")
        .eq("organization_id", organization_id)
        .maybeSingle();

      const planLimits: Record<string, number> = { starter: 10, pro: 20, enterprise: 9999, trial: 2 };
      maxUsers = planLimits[sub?.plan ?? ""] ?? 10;
    } else if (orgType === "franqueado") {
      maxUsers = 50; // reasonable limit for franchise units
    } else if (orgType === "franqueadora") {
      maxUsers = 200; // reasonable limit for franqueadora
    }

    const { count: currentMembers } = await adminClient
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization_id);

    if ((currentMembers ?? 0) >= maxUsers) {
      return new Response(
        JSON.stringify({ error: `Limite de ${maxUsers} usuários atingido. Faça upgrade para adicionar mais.` }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ---- Create user (try-first approach) ----
    console.log("[invite-user] Attempting to create user:", email);
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name || email.split("@")[0] },
    });

    let userId: string;
    let isNewUser = true;

    // Robust detection of "user already exists" across Supabase JS versions
    const isEmailExists = createErr && (
      (createErr as any).code === "email_exists" ||
      (createErr as any).code === "user_already_exists" ||
      (createErr as any).status === 422 ||
      (createErr as any).message?.toLowerCase().includes("already been registered") ||
      (createErr as any).message?.toLowerCase().includes("already exists") ||
      (createErr as any).message?.toLowerCase().includes("email_exists")
    );

    if (isEmailExists) {
      isNewUser = false;
      console.log("[invite-user] User already exists, looking up:", email);
      const existing = await findUserByEmail(adminClient, email);
      if (!existing) throw new Error("Usuário existe mas não foi encontrado na listagem");

      // Check if already member of this org
      const { data: existingMembership } = await adminClient
        .from("organization_memberships")
        .select("id")
        .eq("user_id", existing.id)
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: "Este usuário já é membro desta organização." }),
          { status: 409, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      userId = existing.id as string;
    } else if (createErr) {
      console.error("[invite-user] Unrecognized createUser error:", JSON.stringify(createErr, null, 2));
      console.error("[invite-user] Error code:", (createErr as any).code, "| status:", (createErr as any).status, "| message:", (createErr as any).message);
      throw createErr;
    } else {
      userId = newUser.user.id;
    }

    // ---- Prevent self-invite ----
    if (userId === callerId) {
      return new Response(
        JSON.stringify({ error: "Você não pode convidar a si mesmo." }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Generate a password recovery link — redirect based on org type
    const siteUrl = Deno.env.get("SITE_URL") || "https://sistema.noexcusedigital.com.br";
    const redirectPath = "/reset-password";
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}${redirectPath}?portal=${orgType === "cliente" ? "saas" : "franchise"}` },
    });

    if (linkErr) {
      console.error("generateLink error:", linkErr);
      throw linkErr;
    }

    // Send invite email via Resend directly
    const recoveryUrl = linkData?.properties?.action_link;
    console.log("[invite-user] Recovery URL generated:", recoveryUrl ? "YES" : "NO");
    if (recoveryUrl) {
      try {
        await sendViaResend(email, buildInviteHtml(recoveryUrl));
        console.log(`Invite email sent via Resend to ${email}`);
      } catch (emailErr) {
        console.error("Failed to send invite email via Resend:", emailErr);
      }
    } else {
      console.warn("No recovery URL generated, skipping email send");
    }

    // Update profile only for new users (don't overwrite existing profiles)
    if (isNewUser) {
      await adminClient
        .from("profiles")
        .update({ full_name: full_name || email.split("@")[0] })
        .eq("id", userId);
    }

    // Create membership (ignore if already exists)
    await adminClient.from("organization_memberships").upsert({
      user_id: userId,
      organization_id,
    }, { onConflict: "user_id,organization_id", ignoreDuplicates: true });

    // Determine role based on org type
    const allowedRoles = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
    let validRole: string;
    if (allowedRoles.includes(role)) {
      validRole = role;
    } else {
      validRole = (orgType === "franqueadora" || orgType === "franqueado") ? "franqueado" : "cliente_user";
      console.log(`[invite-user] No explicit role, org type=${orgType}, defaulting to ${validRole}`);
    }
    // Check+update/insert role (prevent duplicate roles)
    const { data: existingRole } = await adminClient
      .from("user_roles").select("id").eq("user_id", userId).maybeSingle();
    if (existingRole) {
      await adminClient.from("user_roles").update({ role: validRole }).eq("user_id", userId);
    } else {
      await adminClient.from("user_roles").insert({ user_id: userId, role: validRole });
    }

    // Assign to teams if provided
    if (Array.isArray(team_ids) && team_ids.length > 0) {
      const teamRows = team_ids.map((tid: string) => ({ team_id: tid, user_id: userId }));
      await adminClient.from("org_team_memberships").insert(teamRows);
    }

    console.log(`User invited: ${email} -> org ${organization_id} as ${validRole} (teams: ${team_ids?.length ?? 0})`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("invite-user error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
