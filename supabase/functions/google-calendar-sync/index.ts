import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Google Calendar não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });

    // Get stored tokens
    const { data: tokenRow } = await serviceClient
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: "Google Calendar não conectado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh token if expired
    let accessToken = tokenRow.access_token;
    if (new Date(tokenRow.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: "Falha ao renovar token do Google. Reconecte sua conta." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await serviceClient.from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: newExpiry, updated_at: new Date().toISOString() })
        .eq("id", tokenRow.id);
    }

    const { action, event } = await req.json();
    const calendarId = tokenRow.google_calendar_id || "primary";

    // PULL: Fetch events from Google and insert/update locally
    if (action === "pull") {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&maxResults=250`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Google Calendar API error:", errText);
        return new Response(JSON.stringify({ error: "Falha ao buscar eventos do Google" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const googleEvents = data.items || [];
      let imported = 0;

      for (const ge of googleEvents) {
        if (!ge.start || ge.status === "cancelled") continue;

        const startAt = ge.start.dateTime || `${ge.start.date}T00:00:00`;
        const endAt = ge.end?.dateTime || ge.end?.date ? (ge.end.dateTime || `${ge.end.date}T23:59:59`) : startAt;
        const allDay = !ge.start.dateTime;

        // Check if already exists
        const { data: existing } = await serviceClient
          .from("calendar_events")
          .select("id")
          .eq("google_event_id", ge.id)
          .eq("organization_id", orgId)
          .maybeSingle();

        if (existing) {
          await serviceClient.from("calendar_events").update({
            title: ge.summary || "Sem título",
            description: ge.description || null,
            start_at: startAt,
            end_at: endAt,
            location: ge.location || null,
            all_day: allDay,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await serviceClient.from("calendar_events").insert({
            organization_id: orgId,
            google_event_id: ge.id,
            title: ge.summary || "Sem título",
            description: ge.description || null,
            start_at: startAt,
            end_at: endAt,
            location: ge.location || null,
            all_day: allDay,
            color: "#22c55e",
            created_by: userId,
          });
          imported++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, imported, total: googleEvents.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUSH: Create/update event in Google
    if (action === "push" && event) {
      const googleEvent = {
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: event.all_day
          ? { date: event.start_at.split("T")[0] }
          : { dateTime: event.start_at, timeZone: "America/Sao_Paulo" },
        end: event.all_day
          ? { date: event.end_at.split("T")[0] }
          : { dateTime: event.end_at, timeZone: "America/Sao_Paulo" },
      };

      let googleEventId = event.google_event_id;
      let res;

      if (googleEventId) {
        // Update existing
        res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(googleEvent),
          }
        );
      } else {
        // Create new
        res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(googleEvent),
          }
        );
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error("Google push error:", errText);
        return new Response(JSON.stringify({ error: "Falha ao sincronizar com Google" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const created = await res.json();

      // Update local event with google_event_id
      if (event.id && !googleEventId) {
        await serviceClient.from("calendar_events")
          .update({ google_event_id: created.id })
          .eq("id", event.id);
      }

      return new Response(
        JSON.stringify({ success: true, google_event_id: created.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE: Remove from Google
    if (action === "delete" && event?.google_event_id) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.google_event_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: pull, push, delete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("google-calendar-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
