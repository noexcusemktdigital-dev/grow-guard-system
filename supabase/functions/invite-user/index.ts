// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { maskEmail } from '../_shared/redact.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, ValidationError, MemberSchemas } from '../_shared/schemas.ts';

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";

function buildInviteHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 25px;max-width:560px;margin:0 auto;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:22px;font-weight:bold;color:#141a24;margin:0 0 20px;">Você foi convidado(a)</h1>
    <p style="font-size:14px;color:#6c7280;line-height:1.6;margin:0 0 25px;">
      Você foi convidado para a plataforma <strong>NoExcuse Digital</strong>. Clique no botão abaixo para criar sua conta e começar a usar o sistema.
    </p>
    <a href="${confirmationUrl}" style="display:inline-block;background-color:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:500;">
      Criar minha conta
    </a>
    <p style="font-size:12px;color:#999999;margin:30px 0 0;">
      Se você não esperava este convite, pode ignorar este e-mail com segurança.
    </p>
  </div>
</body>
</html>`;
}

function buildExistingUserInviteHtml(orgName: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 25px;max-width:560px;margin:0 auto;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:22px;font-weight:bold;color:#141a24;margin:0 0 20px;">Você foi adicionado a uma organização</h1>
    <p style="font-size:14px;color:#6c7280;line-height:1.6;margin:0 0 25px;">
      Você foi adicionado à organização <strong>${orgName}</strong> na plataforma <strong>NoExcuse Digital</strong>. Use sua senha atual para acessar o sistema.
    </p>
    <a href="${loginUrl}" style="display:inline-block;background-color:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:500;">
      Acessar plataforma
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
    if (users.length < perPage) break;
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'invite-user');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Use getUser for reliable auth
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerUser }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !callerUser) {
      console.error("[invite-user] Auth error:", authErr);
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const user = { id: callerUser.id, email: callerUser.email };
    const callerId = user.id;

    const rawBody = await req.json();
    const { email, full_name, role, organization_id, team_ids } = parseOrThrow(MemberSchemas.Invite, rawBody);

    // Prevent self-invite
    if (email.toLowerCase().trim() === user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Você não pode convidar a si mesmo." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Verify caller is member of the org
    const { data: isMember } = await adminClient.rpc("is_member_or_parent_of_org", {
      _user_id: callerId,
      _org_id: organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Sem permissão para convidar nesta organização." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Determine org type
    const { data: orgData } = await adminClient
      .from("organizations")
      .select("type, name")
      .eq("id", organization_id)
      .single();
    const orgType = orgData?.type;
    const orgName = orgData?.name || "Organização";

    // Validate maxUsers server-side
    let maxUsers = 9999;
    if (orgType === "cliente") {
      const { data: sub } = await adminClient
        .from("subscriptions")
        .select("plan, status")
        .eq("organization_id", organization_id)
        .maybeSingle();
      const planLimits: Record<string, number> = { starter: 10, pro: 20, enterprise: 9999, trial: 2 };
      maxUsers = planLimits[sub?.plan ?? ""] ?? 10;
    } else if (orgType === "franqueado") {
      maxUsers = 50;
    } else if (orgType === "franqueadora") {
      maxUsers = 200;
    }

    const { count: currentMembers } = await adminClient
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization_id);

    if ((currentMembers ?? 0) >= maxUsers) {
      return new Response(
        JSON.stringify({ error: `Limite de ${maxUsers} usuários atingido. Faça upgrade para adicionar mais.` }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Create user (try-first approach)
    console.log("[invite-user] Attempting to create user:", maskEmail(email));
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name || email.split("@")[0] },
    });

    let userId: string;
    let isNewUser = true;

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
      console.log("[invite-user] User already exists, looking up:", maskEmail(email));
      const existing = await findUserByEmail(adminClient, email);
      if (!existing) throw new Error("Usuário existe mas não foi encontrado na listagem");

      const { data: existingMembership } = await adminClient
        .from("organization_memberships")
        .select("id")
        .eq("user_id", existing.id)
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: "Este usuário já é membro desta organização." }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      userId = existing.id as string;
    } else if (createErr) {
      console.error("[invite-user] Unrecognized createUser error:", JSON.stringify(createErr, null, 2));
      throw createErr;
    } else {
      userId = newUser.user.id;
    }

    // Send appropriate email
    const siteUrl = Deno.env.get("SITE_URL") || "https://sistema.noexcusedigital.com.br";

    if (isNewUser) {
      // Generate recovery link but extract token_hash to build a safe URL
      // that won't be consumed by email scanners pre-clicking
      const portalParam = orgType === "cliente" ? "saas" : "franchise";
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${siteUrl}/welcome?portal=${portalParam}` },
      });

      if (linkErr) {
        console.error("generateLink error:", linkErr);
        throw linkErr;
      }

      // Build a custom URL using token_hash instead of the action_link.
      // The action_link hits /verify which consumes the OTP on GET — email
      // scanners can trigger this before the real user opens the link.
      // Using token_hash, the frontend calls verifyOtp explicitly only when
      // the user interacts with the page.
      const tokenHash = linkData?.properties?.hashed_token;
      const emailEncoded = encodeURIComponent(email);

      if (tokenHash) {
        const safeInviteUrl = `${siteUrl}/welcome?token_hash=${tokenHash}&type=recovery&email=${emailEncoded}&portal=${portalParam}`;
        console.log("[invite-user] Safe invite URL generated (token_hash approach)");
        try {
          await sendViaResend(email, buildInviteHtml(safeInviteUrl));
          console.log(`Invite email sent via Resend to ${maskEmail(email)}`);
        } catch (emailErr) {
          console.error("Failed to send invite email via Resend:", emailErr);
        }
      } else {
        // Fallback: use action_link if token_hash not available
        const recoveryUrl = linkData?.properties?.action_link;
        console.log("[invite-user] Fallback to action_link (no token_hash)");
        if (recoveryUrl) {
          try {
            await sendViaResend(email, buildInviteHtml(recoveryUrl));
            console.log(`Invite email sent via Resend to ${maskEmail(email)} (fallback)`);
          } catch (emailErr) {
            console.error("Failed to send invite email via Resend:", emailErr);
          }
        }
      }
    } else {
      // Existing user: send informational email (no password reset!)
      const loginUrl = orgType === "cliente" ? `${siteUrl}/app` : `${siteUrl}/acessofranquia`;
      try {
        await sendViaResend(email, buildExistingUserInviteHtml(orgName, loginUrl));
        console.log(`Existing-user invite email sent via Resend to ${maskEmail(email)}`);
      } catch (emailErr) {
        console.error("Failed to send existing-user invite email:", emailErr);
      }
    }

    // Update profile only for new users
    if (isNewUser) {
      await adminClient
        .from("profiles")
        .update({ full_name: full_name || email.split("@")[0] })
        .eq("id", userId);
    }

    // Create membership
    await adminClient.from("organization_memberships").upsert({
      user_id: userId,
      organization_id,
    }, { onConflict: "user_id,organization_id", ignoreDuplicates: true });

    // Determine role
    const allowedRoles = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
    let validRole: string;
    if (allowedRoles.includes(role)) {
      validRole = role;
    } else {
      validRole = (orgType === "franqueadora" || orgType === "franqueado") ? "franqueado" : "cliente_user";
    }

    // Insert role
    const { error: roleInsertErr } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: userId, role: validRole, organization_id },
        { onConflict: "user_id,organization_id" }
      );

    if (roleInsertErr) {
      console.error("[invite-user] Role upsert error:", roleInsertErr);
    }

    // Assign to teams
    if (Array.isArray(team_ids) && team_ids.length > 0) {
      for (const tid of team_ids) {
        await adminClient.from("org_team_memberships")
          .upsert({ team_id: tid, user_id: userId }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      }
    }

    // Save pending invitation record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await adminClient
      .from("pending_invitations")
      .upsert({
        email: email.toLowerCase().trim(),
        organization_id,
        invited_by: callerId,
        role: validRole,
        team_ids: team_ids || [],
        full_name: full_name || null,
        accepted_at: isNewUser ? null : new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "email,organization_id" });

    log.info('done', { user_id: userId, org: organization_id, role: validRole });

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "application/json" }) }
    );
  } catch (err: unknown) {
    const valResp = validationErrorResponse(err, withCorrelationHeader(ctx, getCorsHeaders(req)));
    if (valResp) return valResp;
    log.error('unhandled_error', { error: String(err) });
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "application/json" }),
    });
  }
});
