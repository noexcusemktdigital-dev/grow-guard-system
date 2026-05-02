// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-sync-photos');
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
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;
    const syncPreviews = body.syncPreviews !== false;

    // Find connected instance (any provider)
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (!instance) {
      return new Response(JSON.stringify({
        success: true,
        photos_updated: 0,
        previews_updated: 0,
        photos_failed: 0,
        skipped: "no_instance",
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const isEvolution = instance.provider !== "zapi";

    // Build fetch helpers per provider
    async function fetchProfilePicture(phone: string): Promise<string | null> {
      try {
        if (isEvolution) {
          // Evolution API v1
          const baseUrl = (instance.base_url || "").replace(/\/$/, "");
          const instanceName = encodeURIComponent(instance.instance_id);
          const res = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": instance.client_token || "",
            },
            body: JSON.stringify({ number: phone }),
          });
          if (res.ok) {
            const data = await res.json();
            return data?.profilePictureUrl || data?.profilePicUrl || data?.picture || data?.url || null;
          }
        } else {
          // Z-API fallback
          const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
          const res = await fetch(`${zapiBase}/profile-picture?phone=${phone}`, {
            headers: { "Client-Token": instance.client_token },
          });
          if (res.ok) {
            const data = await res.json();
            return data?.link || data?.imgUrl || data?.profilePictureUrl || null;
          }
        }
      } catch {
        // silently fail
      }
      return null;
    }

    // Get contacts without photos
    const { data: contactsNoPhoto } = await adminClient
      .from("whatsapp_contacts")
      .select("id, phone")
      .eq("organization_id", orgId)
      .is("photo_url", null)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    let photosUpdated = 0;
    let photosFailed = 0;

    for (const contact of (contactsNoPhoto || [])) {
      const picUrl = await fetchProfilePicture(contact.phone);
      if (picUrl) {
        await adminClient
          .from("whatsapp_contacts")
          .update({ photo_url: picUrl })
          .eq("id", contact.id);
        photosUpdated++;
      } else {
        photosFailed++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Phase 2: Sync previews
    let previewsUpdated = 0;

    if (syncPreviews) {
      const { data: contactsNoPreview } = await adminClient
        .from("whatsapp_contacts")
        .select("id, phone")
        .eq("organization_id", orgId)
        .is("last_message_preview", null)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(Math.min(limit, 30));

      for (const contact of (contactsNoPreview || [])) {
        try {
          if (isEvolution) {
            // For Evolution, get last message from DB instead of API call
            const { data: lastMsg } = await adminClient
              .from("whatsapp_messages")
              .select("content, type")
              .eq("contact_id", contact.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastMsg) {
              let preview = lastMsg.content;
              if (!preview) {
                const typeMap: Record<string, string> = {
                  image: "📷 Imagem", audio: "🎵 Áudio", video: "🎬 Vídeo",
                  document: "📄 Documento", sticker: "🏷️ Figurinha",
                };
                preview = typeMap[lastMsg.type] || null;
              }
              if (preview) {
                if (preview.length > 100) preview = preview.slice(0, 97) + "...";
                await adminClient
                  .from("whatsapp_contacts")
                  .update({ last_message_preview: preview })
                  .eq("id", contact.id);
                previewsUpdated++;
              }
            }
          } else {
            // Z-API: fetch from API
            const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
            const res = await fetch(`${zapiBase}/chat-messages/${contact.phone}?amount=1`, {
              headers: { "Client-Token": instance.client_token },
            });
            if (res.ok) {
              const data = await res.json();
              const msgs = Array.isArray(data) ? data : (data?.messages || []);
              if (msgs.length > 0) {
                const msg = msgs[0];
                let preview = msg.text?.message || msg.text || msg.body || msg.caption || null;
                if (!preview) {
                  if (msg.image) preview = "📷 Imagem";
                  else if (msg.audio || msg.ptt) preview = "🎵 Áudio";
                  else if (msg.video) preview = "🎬 Vídeo";
                  else if (msg.document) preview = "📄 Documento";
                  else if (msg.sticker) preview = "🏷️ Figurinha";
                }
                if (preview) {
                  if (preview.length > 100) preview = preview.slice(0, 97) + "...";
                  await adminClient
                    .from("whatsapp_contacts")
                    .update({ last_message_preview: preview })
                    .eq("id", contact.id);
                  previewsUpdated++;
                }
              }
            }
          }
        } catch {
          // Skip silently
        }
        await new Promise(r => setTimeout(r, 150));
      }
    }

    console.log(`[sync-photos] Done: ${photosUpdated} photos, ${previewsUpdated} previews, ${photosFailed} failed`);

    return new Response(JSON.stringify({
      success: true,
      photos_updated: photosUpdated,
      previews_updated: previewsUpdated,
      photos_failed: photosFailed,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-photos] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
