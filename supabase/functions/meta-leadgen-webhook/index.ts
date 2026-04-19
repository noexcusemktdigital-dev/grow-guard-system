// @ts-nocheck
// Webhook PÚBLICO chamado pelo Meta quando há novo lead em formulário instantâneo.
// Configurar no painel Meta App > Webhooks > Page > leadgen com esta URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("META_LEADGEN_VERIFY_TOKEN") || "noexcuse_leadgen_verify";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // GET: verificação inicial do webhook (Meta envia hub.challenge)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("[meta-leadgen-webhook] payload:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Estrutura padrão Meta: { object: 'page', entry: [{ id, changes: [{ field: 'leadgen', value: {...} }] }] }
    if (body.object !== "page") {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const events: Array<{ pageId: string; leadgenId: string; formId: string; createdTime: number }> = [];
    for (const entry of body.entry ?? []) {
      const pageId = String(entry.id);
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;
        const v = change.value || {};
        events.push({
          pageId,
          leadgenId: String(v.leadgen_id),
          formId: String(v.form_id),
          createdTime: v.created_time,
        });
      }
    }

    for (const evt of events) {
      // Localiza a organização dona da página
      const { data: page } = await supabase
        .from("meta_leadgen_subscribed_pages")
        .select("organization_id, page_access_token, page_name")
        .eq("page_id", evt.pageId)
        .eq("active", true)
        .maybeSingle();

      if (!page) {
        await supabase.from("meta_leadgen_events").insert({
          page_id: evt.pageId,
          form_id: evt.formId,
          leadgen_id: evt.leadgenId,
          status: "failed",
          error_message: "Page not subscribed in any organization",
          raw_payload: evt as any,
        });
        continue;
      }

      // Busca detalhes do lead na Graph API
      let leadDetail: any = null;
      try {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/${evt.leadgenId}?access_token=${page.page_access_token}`,
        );
        leadDetail = await r.json();
      } catch (e) {
        console.error("Failed to fetch lead detail:", e);
      }

      // Converte field_data em objeto { name, email, phone... }
      const fields: Record<string, string> = {};
      for (const f of leadDetail?.field_data ?? []) {
        fields[f.name] = (f.values ?? []).join(", ");
      }

      // Resolve mapeamento (form-specific > default da org)
      const { data: mappings } = await supabase
        .from("meta_leadgen_form_mappings")
        .select("*")
        .eq("organization_id", page.organization_id)
        .eq("active", true)
        .or(`form_id.eq.${evt.formId},is_default.eq.true`);

      const formMap = mappings?.find((m: any) => m.form_id === evt.formId);
      const defaultMap = mappings?.find((m: any) => m.is_default);
      const mapping = formMap || defaultMap;

      // Cria lead no CRM
      const leadName =
        fields.full_name || fields.name || fields["nome_completo"] || fields["nome"] || "Lead Meta Ads";
      const leadEmail = fields.email || fields["e-mail"] || null;
      const leadPhone = fields.phone_number || fields.phone || fields["telefone"] || null;

      const { data: newLead, error: leadErr } = await supabase
        .from("crm_leads")
        .insert({
          organization_id: page.organization_id,
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          source: "Meta Lead Ads",
          funnel_id: mapping?.funnel_id ?? null,
          stage: mapping?.stage ?? "Novo Lead",
          assigned_to: mapping?.assigned_to ?? null,
          notes: `Formulário: ${leadDetail?.form_name ?? evt.formId}\nPágina: ${page.page_name ?? evt.pageId}\n\nCampos:\n${Object.entries(fields).map(([k, v]) => `• ${k}: ${v}`).join("\n")}`,
          custom_fields: fields,
        })
        .select("id")
        .single();

      await supabase.from("meta_leadgen_events").insert({
        organization_id: page.organization_id,
        page_id: evt.pageId,
        form_id: evt.formId,
        leadgen_id: evt.leadgenId,
        raw_payload: evt as any,
        lead_data: leadDetail,
        crm_lead_id: newLead?.id ?? null,
        status: leadErr ? "failed" : "processed",
        error_message: leadErr?.message ?? null,
        processed_at: new Date().toISOString(),
      });

      await supabase
        .from("meta_leadgen_subscribed_pages")
        .update({ last_lead_at: new Date().toISOString() })
        .eq("page_id", evt.pageId)
        .eq("organization_id", page.organization_id);
    }

    return new Response(JSON.stringify({ ok: true, processed: events.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[meta-leadgen-webhook] error:", err);
    // Sempre retornar 200 ao Meta para evitar reentrega em loop por erro nosso
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
