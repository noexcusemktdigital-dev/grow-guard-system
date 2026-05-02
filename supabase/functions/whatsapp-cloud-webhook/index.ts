// @ts-nocheck
// =============================================================================
// WhatsApp Cloud API (Meta) — Webhook receiver
// GET  → verificação Meta (hub.challenge)
// POST → entry[].changes[] (messages, statuses, errors)
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { verifyMetaWebhook } from "../_shared/hmac.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const VERSION = "v21.0";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-cloud-webhook');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const verifyToken = Deno.env.get("WHATSAPP_CLOUD_VERIFY_TOKEN") || "";
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // ─── GET: Meta verification handshake ───
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
      log.info('meta_verification_ok');
      // text/plain — Meta challenge must be plain text; x-request-id added for tracing
      return new Response(challenge ?? "", {
        status: 200,
        headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "text/plain" }),
      });
    }

    log.warn('meta_verification_failed', { mode, hasToken: !!token });
    return new Response("Forbidden", {
      status: 403,
      headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "text/plain" }),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: withCorrelationHeader(ctx, getCorsHeaders(req)),
    });
  }

  // ─── POST: Webhook payload ───
  // OBRIGATÓRIO: ler raw body ANTES de JSON.parse para validar HMAC
  const rawBody = await req.text();

  // Validação HMAC SHA-256 (header x-hub-signature-256)
  // Aceita o nome dedicado do runbook e os aliases legados do app Meta.
  const appSecret = Deno.env.get("WHATSAPP_CLOUD_APP_SECRET") ??
    Deno.env.get("WHATSAPP_APP_SECRET") ??
    Deno.env.get("META_APP_SECRET");
  const validation = await verifyMetaWebhook(req, rawBody, appSecret);
  if (!validation.valid) {
    log.warn('hmac_failed', { reason: validation.reason });
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "application/json" }),
    });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    log.error('invalid_json', { error: String(e) });
    // Sempre responder 200 para a Meta não reentregar em loop, mas logar.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "application/json" }),
    });
  }

  // Object esperado: "whatsapp_business_account"
  const object = body?.object;
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  // Processa cada entry de forma resiliente: erros em uma não derrubam as outras.
  for (const entry of entries) {
    try {
      await processEntry(adminClient, entry, body);
    } catch (err) {
      console.error("[whatsapp-cloud-webhook] entry processing error:", err);
      // Log de auditoria sem expor segredos.
      try {
        await adminClient.from("whatsapp_cloud_webhook_logs").insert({
          payload: entry,
          event_type: "error",
          processed: false,
          error: String((err as Error)?.message || err),
        });
      } catch {
        // Logging best-effort — ignora falha de auditoria
      }
    }
  }

  // Resposta rápida (Meta exige < 5s)
  log.info('done', { object });
  return new Response(JSON.stringify({ ok: true, object }), {
    status: 200,
    headers: withCorrelationHeader(ctx, { ...getCorsHeaders(req), "Content-Type": "application/json" }),
  });
});

// =============================================================================
// Processa uma entry do webhook Meta
// =============================================================================
async function processEntry(adminClient: any, entry: any, _rawBody: any) {
  const wabaId = entry?.id || null;
  const changes = Array.isArray(entry?.changes) ? entry.changes : [];

  for (const change of changes) {
    const value = change?.value || {};
    const phoneNumberId = value?.metadata?.phone_number_id || null;
    const displayPhoneNumber = value?.metadata?.display_phone_number || null;

    // Localiza instância pela phone_number_id (preferencial) ou waba_id
    let instance: any = null;
    if (phoneNumberId) {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("provider", "whatsapp_cloud")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();
      instance = data;
    }
    if (!instance && wabaId) {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("provider", "whatsapp_cloud")
        .eq("waba_id", wabaId)
        .limit(1)
        .maybeSingle();
      instance = data;
    }

    const orgId = instance?.organization_id || null;
    const instanceId = instance?.id || null;

    // Determina tipo de evento
    let eventType: "messages" | "statuses" | "errors" | "unknown" = "unknown";
    if (Array.isArray(value?.messages)) eventType = "messages";
    else if (Array.isArray(value?.statuses)) eventType = "statuses";
    else if (Array.isArray(value?.errors)) eventType = "errors";

    // Auditoria (sem expor tokens; payload já é da Meta, sem nossos secrets)
    try {
      await adminClient.from("whatsapp_cloud_webhook_logs").insert({
        organization_id: orgId,
        instance_id: instanceId,
        phone_number_id: phoneNumberId,
        event_type: eventType,
        payload: { field: change?.field, value, waba_id: wabaId },
        processed: false,
      });
    } catch (logErr) {
      console.error("[whatsapp-cloud-webhook] log insert error:", logErr);
    }

    if (!instance) {
      console.warn("[whatsapp-cloud-webhook] no matching instance", { phoneNumberId, wabaId });
      continue;
    }

    // ─── Mensagens recebidas ───
    if (eventType === "messages") {
      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      for (const msg of value.messages) {
        try {
          await handleIncomingMessage(adminClient, instance, msg, contacts, displayPhoneNumber);
        } catch (e) {
          console.error("[whatsapp-cloud-webhook] message handle error:", e);
        }
      }
    }

    // ─── Status de entrega/leitura/erros ───
    if (eventType === "statuses") {
      for (const st of value.statuses) {
        try {
          await handleStatusUpdate(adminClient, instance, st);
        } catch (e) {
          console.error("[whatsapp-cloud-webhook] status handle error:", e);
        }
      }
    }

    if (eventType === "errors") {
      console.error("[whatsapp-cloud-webhook] webhook errors:", JSON.stringify(value.errors));
    }
  }
}

// =============================================================================
// Trata mensagem recebida
// =============================================================================
async function handleIncomingMessage(
  adminClient: any,
  instance: any,
  msg: any,
  contacts: any[],
  _displayPhone: string | null,
) {
  const orgId = instance.organization_id;
  const fromPhone = msg.from || ""; // E.164 sem '+'
  if (!fromPhone) return;

  // Nome do remetente, se vier nos contacts
  const contactInfo = contacts.find((c: any) => c?.wa_id === fromPhone);
  const senderName = contactInfo?.profile?.name || null;

  const messageType = msg.type || "text";
  let content: string | null = null;
  let mediaUrl: string | null = null;

  switch (messageType) {
    case "text":
      content = msg.text?.body || null;
      break;
    case "image":
      content = msg.image?.caption || null;
      mediaUrl = msg.image?.id ? `cloud-media:${msg.image.id}` : null;
      break;
    case "video":
      content = msg.video?.caption || null;
      mediaUrl = msg.video?.id ? `cloud-media:${msg.video.id}` : null;
      break;
    case "audio":
      mediaUrl = msg.audio?.id ? `cloud-media:${msg.audio.id}` : null;
      break;
    case "document":
      content = msg.document?.filename || msg.document?.caption || null;
      mediaUrl = msg.document?.id ? `cloud-media:${msg.document.id}` : null;
      break;
    case "sticker":
      mediaUrl = msg.sticker?.id ? `cloud-media:${msg.sticker.id}` : null;
      break;
    case "button":
      content = msg.button?.text || null;
      break;
    case "interactive":
      content =
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        null;
      break;
    case "location":
      content = `📍 ${msg.location?.latitude},${msg.location?.longitude}`;
      break;
    default:
      content = null;
  }

  // Upsert contato
  const { data: existing } = await adminClient
    .from("whatsapp_contacts")
    .select("id, unread_count")
    .eq("organization_id", orgId)
    .eq("phone", fromPhone)
    .maybeSingle();

  const previewText =
    content?.substring(0, 100) ||
    (messageType === "audio"
      ? "🎤 Áudio"
      : messageType === "image"
      ? "📷 Imagem"
      : messageType === "video"
      ? "🎬 Vídeo"
      : messageType === "document"
      ? "📄 Documento"
      : "📎 Mensagem");

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    await adminClient
      .from("whatsapp_contacts")
      .update({
        name: senderName || undefined,
        last_message_at: new Date().toISOString(),
        last_message_preview: previewText,
        unread_count: (existing.unread_count || 0) + 1,
        instance_id: instance.id,
      })
      .eq("id", contactId);
  } else {
    const { data: newContact } = await adminClient
      .from("whatsapp_contacts")
      .insert({
        organization_id: orgId,
        phone: fromPhone,
        name: senderName,
        last_message_at: new Date().toISOString(),
        last_message_preview: previewText,
        unread_count: 1,
        instance_id: instance.id,
        contact_type: "individual",
        attending_mode: "ai",
      })
      .select("id")
      .single();
    contactId = newContact!.id;
  }

  // Insert mensagem
  await adminClient.from("whatsapp_messages").insert({
    organization_id: orgId,
    contact_id: contactId,
    message_id_zapi: msg.id || null, // reaproveita coluna existente
    direction: "inbound",
    type: messageType,
    content,
    media_url: mediaUrl,
    status: "received",
    metadata: { provider: "whatsapp_cloud", raw: msg },
  });
}

// =============================================================================
// Trata status (sent/delivered/read/failed)
// =============================================================================
async function handleStatusUpdate(adminClient: any, instance: any, st: any) {
  const messageId = st?.id;
  if (!messageId) return;
  const newStatus = st?.status || "sent"; // sent | delivered | read | failed

  await adminClient
    .from("whatsapp_messages")
    .update({
      status: newStatus,
      metadata: { provider: "whatsapp_cloud", status_update: st },
    })
    .eq("organization_id", instance.organization_id)
    .eq("message_id_zapi", messageId);
}
