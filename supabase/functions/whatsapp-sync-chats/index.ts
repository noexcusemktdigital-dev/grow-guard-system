// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

function parseLastMessageTime(raw: unknown): string | null {
  if (raw == null || typeof raw === "boolean") return null;

  // Object with _seconds / seconds (Firestore-style)
  if (typeof raw === "object" && raw !== null) {
    const secs = raw._seconds || raw.seconds;
    if (secs) {
      const d = new Date(Number(secs) * 1000);
      if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    return null;
  }

  // Number directly
  if (typeof raw === "number" && raw > 0) {
    const ms = raw > 9999999999 ? raw : raw * 1000;
    const d = new Date(ms);
    if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
  }

  // String
  if (typeof raw === "string") {
    // Numeric string
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      const ms = num > 9999999999 ? num : num * 1000;
      const d = new Date(ms);
      if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    // BR format DD/MM/YYYY HH:mm or DD/MM/YYYY
    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
      const [, dd, mm, yyyy, hh, mi, ss] = brMatch;
      const d = new Date(`${yyyy}-${mm}-${dd}T${hh || "00"}:${mi || "00"}:${ss || "00"}`);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    // ISO parse
    const isoDate = new Date(raw);
    if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() >= 2019 && isoDate.getFullYear() <= 2030) {
      return isoDate.toISOString();
    }
  }

  return null;
}

function extractTimestamp(chat: Record<string, unknown>): string | null {
  // Chain of fallback fields
  const candidates = [
    chat.lastMessageTime,
    chat.lastMessageTimestamp,
    chat.timestamp,
    chat.t,
    chat.lastInteraction,
    chat.lastActivity,
  ];

  for (const c of candidates) {
    const parsed = parseLastMessageTime(c);
    if (parsed) return parsed;
  }

  // Nested lastMessage object
  if (chat.lastMessage && typeof chat.lastMessage === "object") {
    const nested = [
      chat.lastMessage.timestamp,
      chat.lastMessage.t,
      chat.lastMessage.time,
      chat.lastMessage.messageTimestamp,
    ];
    for (const c of nested) {
      const parsed = parseLastMessageTime(c);
      if (parsed) return parsed;
    }
  }

  return null;
}

function extractLastMessagePreview(chat: Record<string, unknown>): string | null {
  if (chat.lastMessageText && typeof chat.lastMessageText === "string") return chat.lastMessageText.slice(0, 200);
  if (chat.lastMessage) {
    if (typeof chat.lastMessage === "string") return chat.lastMessage.slice(0, 200);
    if (typeof chat.lastMessage === "object") {
      const body = chat.lastMessage.body || chat.lastMessage.content || chat.lastMessage.text;
      if (body && typeof body === "string") return body.slice(0, 200);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-sync-chats');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: claimsData.claims.sub, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { instanceId, phone: filterPhone } = body;

    // Find the instance
    let instance: Record<string, unknown> | null = null;
    if (instanceId) {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceId)
        .maybeSingle();
      instance = data;
    } else {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();
      instance = data;
    }

    if (!instance) {
      return new Response(JSON.stringify({ error: "No connected WhatsApp instance found" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders: Record<string, string> = { "Client-Token": instance.client_token };

    // Fetch all chats from Z-API (paginated)
    let allChats: Record<string, unknown>[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const chatsRes = await fetch(`${zapiBase}/chats?page=${page}&pageSize=${pageSize}`, {
        headers: zapiHeaders,
      });
      if (!chatsRes.ok) {
        console.error(`Z-API /chats error (page ${page}):`, await chatsRes.text());
        break;
      }
      const chatsData = await chatsRes.json();
      const chats = Array.isArray(chatsData) ? chatsData : [];
      if (chats.length === 0) break;
      allChats = allChats.concat(chats);
      if (chats.length < pageSize) break;
      page++;
      if (page > 20) break;
    }

    console.log(`[sync] Fetched ${allChats.length} chats from Z-API`);

    // Classify chats by type (individual, group, broadcast) but keep all except broadcast/status
    let validChats = allChats.filter((chat: Record<string, unknown>) => {
      const phone = chat.phone || "";
      if (!phone) return false;
      if (phone.includes("broadcast")) return false;
      if (phone === "status") return false;
      if (phone.includes("status@broadcast")) return false;
      return true;
    });
    
    // Detect contact type
    const getContactType = (chat: Record<string, unknown>): string => {
      if (chat.isGroup) return "group";
      const phone = chat.phone || "";
      if (phone.includes("@g.us") || /^\d+-\d{10,}$/.test(phone) || phone.endsWith("-group")) return "group";
      return "individual";
    };

    if (filterPhone) {
      validChats = validChats.filter((c: Record<string, unknown>) => c.phone === filterPhone);
    }

    console.log(`[sync] ${validChats.length} valid chats after filtering`);

    // Collect all phones from Z-API for orphan detection
    const zapiPhones = new Set<string>(validChats.map((c: Record<string, unknown>) => c.phone as string));

    // Get existing contacts in ONE query
    const { data: existingContacts } = await adminClient
      .from("whatsapp_contacts")
      .select("id, phone, attending_mode, last_message_preview")
      .eq("organization_id", orgId);

    const existingMap = new Map<string, { id: string; attending_mode: string | null; last_message_preview: string | null }>();
    (existingContacts || []).forEach((c: { id: string; phone: string; attending_mode: string | null; last_message_preview: string | null }) => {
      existingMap.set(c.phone, { id: c.id, attending_mode: c.attending_mode, last_message_preview: c.last_message_preview });
    });

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let timestampsFound = 0;

    const BATCH_SIZE = 100;
    for (let batchStart = 0; batchStart < validChats.length; batchStart += BATCH_SIZE) {
      const batch = validChats.slice(batchStart, batchStart + BATCH_SIZE);
      const inserts: Record<string, unknown>[] = [];
      const updates: { id: string; data: Record<string, unknown> }[] = [];

      for (let i = 0; i < batch.length; i++) {
        const chat = batch[i];
        let phone = chat.phone;
        const contactType = getContactType(chat);
        
        // Normalize phone format: groups must use -group (native Z-API format from /chats)
        if (contactType === "group") {
          // Ensure -group suffix, remove @g.us if present
          phone = phone.replace('@g.us', '').replace(/-group$/, '') + '-group';
        }
        
        const name = chat.name || null;
        const photoUrl = chat.imgUrl || chat.profileThumbnail || null;
        const unreadCount = parseInt(chat.unreadCount ?? chat.unreadMessages ?? chat.unread ?? chat.unreadQtd ?? "0") || 0;
        const participantCount = contactType === "group" ? (chat.participants?.length || null) : null;

        const lastMsgTime = extractTimestamp(chat);
        if (lastMsgTime) timestampsFound++;

        const preview = extractLastMessagePreview(chat);
        const existing = existingMap.get(phone);

        if (existing) {
          const upd: Record<string, unknown> = {
            instance_id: instance.id,
            unread_count: unreadCount,
            contact_type: contactType,
          };
          // Do NOT overwrite last_message_at — the webhook sets it accurately.
          // Z-API /chats timestamps are imprecise and break ordering.
          if (name) upd.name = name;
          if (photoUrl) upd.photo_url = photoUrl;
          if (preview && !existing.last_message_preview) upd.last_message_preview = preview;
          if (participantCount !== null) upd.participant_count = participantCount;
          updates.push({ id: existing.id, data: upd });
          contactsUpdated++;
        } else {
          inserts.push({
            organization_id: orgId,
            phone,
            name,
            last_message_at: lastMsgTime || new Date().toISOString(),
            unread_count: unreadCount,
            instance_id: instance.id,
            attending_mode: contactType === "group" ? "human" : "ai",
            photo_url: photoUrl,
            last_message_preview: preview,
            contact_type: contactType,
            participant_count: participantCount,
          });
          existingMap.set(phone, { id: "pending", attending_mode: contactType === "group" ? "human" : "ai", last_message_preview: preview });
          contactsCreated++;
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await adminClient.from("whatsapp_contacts").insert(inserts);
        if (insertError) console.error("[sync] Batch insert error:", insertError.message);
      }

      for (const upd of updates) {
        await adminClient.from("whatsapp_contacts").update(upd.data).eq("id", upd.id);
      }
    }

    // --- Remove orphan contacts not in Z-API and inactive ---
    let contactsRemoved = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all contacts for this org+instance that are NOT in the Z-API set
    const { data: allDbContacts } = await adminClient
      .from("whatsapp_contacts")
      .select("id, phone, last_message_at")
      .eq("organization_id", orgId)
      .eq("instance_id", instance.id);

    const orphans = (allDbContacts || []).filter((c: { id: string; phone: string; last_message_at: string | null }) => !zapiPhones.has(c.phone));

    for (const orphan of orphans) {
      const lastMsg = orphan.last_message_at ? new Date(orphan.last_message_at) : null;
      const isOld = !lastMsg || lastMsg.toISOString() < sevenDaysAgo;

      if (!isOld) continue;

      // Check if there are recent messages in the DB for this contact
      const { count } = await adminClient
        .from("whatsapp_messages")
        .select("id", { count: "exact", head: true })
        .eq("contact_id", orphan.id)
        .gte("created_at", sevenDaysAgo);

      if ((count ?? 0) > 0) continue;

      // Safe to delete
      await adminClient.from("whatsapp_messages").delete().eq("contact_id", orphan.id);
      await adminClient.from("whatsapp_contacts").delete().eq("id", orphan.id);
      contactsRemoved++;
    }

    console.log(`[sync] Done: ${contactsCreated} created, ${contactsUpdated} updated, ${contactsRemoved} removed`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_created: contactsCreated,
        contacts_updated: contactsUpdated,
        contacts_removed: contactsRemoved,
        total_chats_found: validChats.length,
        timestamps_found: timestampsFound,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
