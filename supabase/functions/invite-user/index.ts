import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = user.id;

    const { email, full_name, role, organization_id, team_ids } = await req.json();

    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: "email and organization_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Validate maxUsers server-side ----
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization_id)
      .maybeSingle();

    const planLimits: Record<string, number> = { starter: 10, pro: 20, enterprise: 9999, trial: 2 };
    const maxUsers = planLimits[sub?.plan ?? ""] ?? 10;

    const { count: currentMembers } = await adminClient
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization_id);

    if ((currentMembers ?? 0) >= maxUsers) {
      return new Response(
        JSON.stringify({ error: `Limite de ${maxUsers} usuários do plano atingido. Faça upgrade para adicionar mais.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Create user (instead of inviteUserByEmail) ----
    // Search for existing user by email (filtered server-side to avoid timeout)
    console.log("[invite-user] Checking if user exists:", email);
    const { data: { users: matchedUsers } } = await adminClient.auth.admin.listUsers({
      filter: email,
      page: 1,
      perPage: 1,
    });
    const existingUser = matchedUsers?.find((u: any) => u.email === email);

    let userId: string;

    if (existingUser) {
      // User already exists in auth - check if already in this org
      const { data: existingMembership } = await adminClient
        .from("organization_memberships")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: "Este usuário já é membro desta organização." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = existingUser.id;
    } else {
      // Create new user with email already confirmed
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: full_name || email.split("@")[0] },
      });

      if (createErr) {
        console.error("createUser error:", createErr);
        throw createErr;
      }
      userId = newUser.user.id;
    }

    // Generate a password recovery link so the user can set their own password
    const siteUrl = Deno.env.get("SITE_URL") || "https://grow-guard-system.lovable.app";
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/acessofranquia` },
    });

    if (linkErr) {
      console.error("generateLink error:", linkErr);
      throw linkErr;
    }

    // Send invite email via Resend directly
    const recoveryUrl = linkData?.properties?.action_link;
    if (recoveryUrl) {
      try {
        await sendViaResend(email, buildInviteHtml(recoveryUrl));
        console.log(`Invite email sent via Resend to ${email}`);
      } catch (emailErr) {
        console.error("Failed to send invite email via Resend:", emailErr);
        // Don't block the user creation - log the error but continue
      }
    } else {
      console.warn("No recovery URL generated, skipping email send");
    }

    // Update profile
    await adminClient
      .from("profiles")
      .update({ full_name: full_name || email.split("@")[0] })
      .eq("id", userId);

    // Create membership (ignore if already exists)
    await adminClient.from("organization_memberships").upsert({
      user_id: userId,
      organization_id,
    }, { onConflict: "user_id,organization_id", ignoreDuplicates: true });

    // Set role (upsert to handle existing users)
    const allowedRoles = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
    const validRole = allowedRoles.includes(role) ? role : "cliente_user";
    await adminClient.from("user_roles").upsert({
      user_id: userId,
      role: validRole,
    }, { onConflict: "user_id,role", ignoreDuplicates: true });

    // Assign to teams if provided
    if (Array.isArray(team_ids) && team_ids.length > 0) {
      const teamRows = team_ids.map((tid: string) => ({ team_id: tid, user_id: userId }));
      await adminClient.from("org_team_memberships").insert(teamRows);
    }

    console.log(`User invited: ${email} -> org ${organization_id} as ${validRole} (teams: ${team_ids?.length ?? 0})`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("invite-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
