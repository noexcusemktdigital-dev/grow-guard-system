// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { maskPhone, redact } from '../_shared/redact.ts';
import { parseOrThrow, validationErrorResponse, WhatsAppSchemas } from '../_shared/schemas.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

function randomDelay(base: number): number {
  const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
  return Math.max(3, base + variance);
}

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-bulk-send');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { dispatch_id } = parseOrThrow(WhatsAppSchemas.BulkSend, await req.json());

    // Fetch dispatch
    const { data: dispatch, error: dispErr } = await adminClient
      .from("client_dispatches")
      .select("*")
      .eq("id", dispatch_id)
      .eq("organization_id", orgId)
      .single();

    if (dispErr || !dispatch) {
      return new Response(JSON.stringify({ error: "Dispatch not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const recipients: string[] = (dispatch.recipients as string[]) || [];
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (recipients.length > 100) {
      return new Response(JSON.stringify({ error: "Maximum 100 recipients per dispatch" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get Z-API instance
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!instance || instance.status !== "connected") {
      return new Response(JSON.stringify({ error: "WhatsApp instance not connected" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Update dispatch to "sending"
    await adminClient
      .from("client_dispatches")
      .update({ status: "sending" })
      .eq("id", dispatch_id);

    const delayBase = dispatch.delay_seconds || 7;
    const message = dispatch.message || "";
    const imageUrl = dispatch.image_url;
    let sent = 0;
    let failed = 0;
    let stopped = false;

    for (let i = 0; i < recipients.length; i++) {
      const phone = recipients[i].replace(/[\s+()-]/g, "");

      try {
        let zapiUrl: string;
        let body: Record<string, unknown>;

        if (imageUrl) {
          zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-image`;
          body = { phone, image: imageUrl, caption: message };
        } else {
          zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
          body = { phone, message };
        }

        const zapiRes = await fetch(zapiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Client-Token": instance.client_token,
          },
          body: JSON.stringify(body),
        });

        const zapiData = await zapiRes.json();

        if (zapiRes.status === 429) {
          console.warn("Rate limited by Z-API, stopping dispatch");
          failed += recipients.length - i;
          stopped = true;
          break;
        }

        if (zapiRes.ok) {
          sent++;
          // Save to whatsapp_messages
          await adminClient.from("whatsapp_messages").insert({
            organization_id: orgId,
            direction: "outbound",
            type: imageUrl ? "image" : "text",
            content: message,
            status: "sent",
            message_id_zapi: zapiData?.messageId || null,
            metadata: { dispatch_id, phone },
          });
        } else {
          failed++;
          console.warn(`Failed to send to ${maskPhone(phone)}:`, redact(zapiData));
        }
      } catch (err) {
        failed++;
        console.error(`Error sending to ${maskPhone(phone)}:`, err.message);
      }

      // Throttle between sends (skip after last)
      if (i < recipients.length - 1) {
        const delay = randomDelay(delayBase);
        await sleep(delay);
      }
    }

    // Update dispatch with final stats
    const finalStatus = stopped ? "partial" : "sent";
    await adminClient
      .from("client_dispatches")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        stats: { sent, failed, total: recipients.length },
      })
      .eq("id", dispatch_id);

    return new Response(
      JSON.stringify({ success: true, status: finalStatus, stats: { sent, failed, total: recipients.length } }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    const valRes = validationErrorResponse(err, getCorsHeaders(req));
    if (valRes) return valRes;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
