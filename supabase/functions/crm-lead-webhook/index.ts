import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const orgId = pathParts[pathParts.length - 1];

    if (!orgId || orgId === "crm-lead-webhook") {
      return new Response(JSON.stringify({ error: "Organization ID required in URL path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, email, phone, company, source, value, tags, custom_fields } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Field 'name' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check org exists
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .maybeSingle();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate by phone or email
    let existingLead = null;
    if (phone) {
      const { data } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();
      existingLead = data;
    }
    if (!existingLead && email) {
      const { data } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId)
        .eq("email", email)
        .maybeSingle();
      existingLead = data;
    }

    if (existingLead) {
      // Update existing lead tags and log activity
      const mergedTags = Array.from(new Set([...(existingLead.tags || []), ...(tags || [])]));
      await supabase
        .from("crm_leads")
        .update({ tags: mergedTags, custom_fields: custom_fields || undefined })
        .eq("id", existingLead.id);

      await supabase.from("crm_activities").insert({
        lead_id: existingLead.id,
        organization_id: orgId,
        type: "note",
        title: "Lead atualizado via webhook",
        description: `Fonte: ${source || "webhook"}`,
      });

      return new Response(
        JSON.stringify({ success: true, lead_id: existingLead.id, action: "updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get default funnel first stage
    const { data: defaultFunnel } = await supabase
      .from("crm_funnels")
      .select("stages")
      .eq("organization_id", orgId)
      .eq("is_default", true)
      .maybeSingle();

    let firstStage = "novo";
    if (defaultFunnel?.stages && Array.isArray(defaultFunnel.stages) && defaultFunnel.stages.length > 0) {
      firstStage = (defaultFunnel.stages as any[])[0].key || "novo";
    }

    // Check roulette
    let assignedTo: string | null = null;
    const { data: settings } = await supabase
      .from("crm_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (settings?.lead_roulette_enabled) {
      const members = (settings.roulette_members as string[]) || [];
      if (members.length > 0) {
        const { data: lastLead } = await supabase
          .from("crm_leads")
          .select("assigned_to")
          .eq("organization_id", orgId)
          .not("assigned_to", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastAssigned = lastLead?.assigned_to;
        const lastIndex = lastAssigned ? members.indexOf(lastAssigned) : -1;
        assignedTo = members[(lastIndex + 1) % members.length];
      }
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from("crm_leads")
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || "Webhook",
        value: value || 0,
        tags: tags || [],
        custom_fields: custom_fields || {},
        stage: firstStage,
        organization_id: orgId,
        assigned_to: assignedTo,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, lead_id: newLead.id, action: "created" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
