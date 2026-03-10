import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;
    const syncPreviews = body.syncPreviews !== false; // default true

    // Find connected Z-API instance (sync-photos uses Z-API endpoints only)
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "connected")
      .eq("provider", "zapi")
      .limit(1)
      .maybeSingle();

    if (!instance) {
      // No Z-API instance connected — skip gracefully instead of erroring
      return new Response(JSON.stringify({
        success: true,
        photos_updated: 0,
        previews_updated: 0,
        photos_failed: 0,
        skipped: "no_zapi_instance",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders: Record<string, string> = { "Client-Token": instance.client_token };

    // Get contacts without photos, ordered by most recent
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
      try {
        const res = await fetch(`${zapiBase}/profile-picture?phone=${contact.phone}`, {
          headers: zapiHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          const picUrl = data?.link || data?.imgUrl || data?.profilePictureUrl || null;
          if (picUrl) {
            await adminClient
              .from("whatsapp_contacts")
              .update({ photo_url: picUrl })
              .eq("id", contact.id);
            photosUpdated++;
          }
        }
      } catch {
        photosFailed++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Phase 2: Sync previews for contacts without preview
    let previewsUpdated = 0;

    if (syncPreviews) {
      const { data: contactsNoPreview } = await adminClient
        .from("whatsapp_contacts")
        .select("id, phone")
        .eq("organization_id", orgId)
        .is("last_message_preview", null)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(Math.min(limit, 30)); // cap at 30 to avoid timeout

      for (const contact of (contactsNoPreview || [])) {
        try {
          // Try to get last 1 message from Z-API
          const res = await fetch(`${zapiBase}/chat-messages/${contact.phone}?amount=1`, {
            headers: zapiHeaders,
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-photos] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
