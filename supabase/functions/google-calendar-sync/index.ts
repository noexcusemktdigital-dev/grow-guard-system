// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
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
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

serve(async (req) => {
  const ctx = newRequestContext(req, 'google-calendar-sync');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const jsonRes = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return jsonRes({ error: "Unauthorized" }, 401);
    const userId = user.id;

    const { action, event, portal } = await req.json();

    const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: portal || "saas" });
    if (!orgId) return jsonRes({ error: "Organização não encontrada" }, 400);

    // Get stored tokens
    const { data: tokenRow } = await serviceClient
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!tokenRow) return jsonRes({ error: "Google Calendar não conectado" }, 400);

    // Refresh token if expired
    let accessToken = tokenRow.access_token;
    if (!accessToken || new Date(tokenRow.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      if (!refreshed) {
        return jsonRes({ error: "Falha ao renovar token do Google. Reconecte sua conta." }, 401);
      }
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await serviceClient.from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: newExpiry, updated_at: new Date().toISOString() })
        .eq("id", tokenRow.id);
    }

    const calendarId = tokenRow.google_calendar_id || "primary";

    // PULL
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
        return jsonRes({ error: "Falha ao buscar eventos do Google" }, 500);
      }

      const data = await res.json();
      const googleEvents = data.items || [];
      let imported = 0;

      for (const ge of googleEvents) {
        if (!ge.start || ge.status === "cancelled") continue;

        const startAt = ge.start.dateTime || `${ge.start.date}T00:00:00`;
        const endAt = ge.end?.dateTime || ge.end?.date ? (ge.end.dateTime || `${ge.end.date}T23:59:59`) : startAt;
        const allDay = !ge.start.dateTime;

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

      console.log(`Google sync pull: ${imported} imported, ${googleEvents.length} total from Google, org=${orgId}`);
      return jsonRes({ success: true, imported, total: googleEvents.length });
    }

    // PUSH
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

      const googleEventId = event.google_event_id;
      let res;

      if (googleEventId) {
        res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(googleEvent),
          }
        );
      } else {
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
        return jsonRes({ error: "Falha ao sincronizar com Google" }, 500);
      }

      const created = await res.json();

      if (event.id && !googleEventId) {
        await serviceClient.from("calendar_events")
          .update({ google_event_id: created.id })
          .eq("id", event.id);
      }

      return jsonRes({ success: true, google_event_id: created.id });
    }

    // DELETE
    if (action === "delete" && event?.google_event_id) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.google_event_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return jsonRes({ success: true });
    }

    return jsonRes({ error: "Ação inválida. Use: pull, push, delete" }, 400);
  } catch (e) {
    console.error("google-calendar-sync error:", e);
    return jsonRes({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
