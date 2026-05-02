// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'seed-demo-data');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Find user
    const { data: users } = await sb.auth.admin.listUsers();
    const user = users?.users?.find((u: { email?: string }) => u.email === "franqueado.teste@noexcuse.com");
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: getCorsHeaders(req) });

    const userId = user.id;

    // 2. Find org
    const { data: membership } = await sb.from("organization_memberships").select("organization_id").eq("user_id", userId).single();
    if (!membership) return new Response(JSON.stringify({ error: "No org found" }), { status: 404, headers: getCorsHeaders(req) });

    const orgId = membership.organization_id;

    // 3. Clean existing data (order matters for FK)
    await sb.from("crm_activities").delete().eq("organization_id", orgId);
    await sb.from("crm_lead_notes").delete().eq("organization_id", orgId);
    await sb.from("crm_tasks").delete().eq("organization_id", orgId);
    await sb.from("crm_proposals").delete().eq("organization_id", orgId);
    await sb.from("crm_files").delete().eq("organization_id", orgId);
    await sb.from("contracts").delete().eq("organization_id", orgId);
    await sb.from("crm_leads").delete().eq("organization_id", orgId);
    await sb.from("crm_funnels").delete().eq("organization_id", orgId);
    await sb.from("crm_products").delete().eq("organization_id", orgId);
    await sb.from("calendar_events").delete().eq("organization_id", orgId);
    await sb.from("announcements").delete().eq("organization_id", orgId);

    // 4. Update profile
    await sb.from("profiles").update({
      full_name: "Davi Oliveira",
      job_title: "Sócio-Diretor",
      phone: "(41) 99876-5432",
      bio: "Franqueado No Excuse Digital desde 2024. Especialista em marketing digital para pequenas e médias empresas.",
    }).eq("id", userId);

    // 5. Create funnel
    const stages = [
      { name: "Novo Lead", color: "#6366f1", order: 0 },
      { name: "Primeiro Contato", color: "#3b82f6", order: 1 },
      { name: "Follow-up", color: "#0ea5e9", order: 2 },
      { name: "Diagnóstico", color: "#14b8a6", order: 3 },
      { name: "Apresentação de Estratégia", color: "#22c55e", order: 4 },
      { name: "Proposta", color: "#eab308", order: 5 },
      { name: "Venda", color: "#10b981", order: 6 },
      { name: "Oportunidade Perdida", color: "#ef4444", order: 7 },
    ];

    const { data: funnel } = await sb.from("crm_funnels").insert({
      organization_id: orgId,
      name: "Funil de Clientes",
      description: "Funil principal de prospecção de clientes",
      is_default: true,
      stages: JSON.stringify(stages),
    }).select().single();

    const funnelId = funnel!.id;

    // 6. Create products
    const products = [
      { name: "Assessoria de Marketing Digital", price: 3500, unit: "mensal", category: "Marketing", description: "Gestão completa de marketing digital" },
      { name: "Gestão de Redes Sociais", price: 2500, unit: "mensal", category: "Social Media", description: "Criação de conteúdo e gestão de redes" },
      { name: "Tráfego Pago", price: 2000, unit: "mensal", category: "Performance", description: "Gestão de campanhas Google e Meta Ads" },
      { name: "Criação de Site", price: 5000, unit: "projeto", category: "Web", description: "Landing page ou site institucional" },
      { name: "Branding & Identidade Visual", price: 4000, unit: "projeto", category: "Design", description: "Logo, paleta, manual de marca" },
    ];
    await sb.from("crm_products").insert(products.map(p => ({ ...p, organization_id: orgId, is_active: true })));

    // 7. Create 12 leads
    const now = new Date();
    const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

    const leadsData = [
      // Novo Lead (2)
      { name: "Ricardo Mendes", email: "ricardo@techsol.com", phone: "(41) 99876-5432", company: "TechSol Ltda", stage: "Novo Lead", source: "Meta Leads", value: 5000, tags: ["tech", "quente"], created_at: d(1) },
      { name: "Camila Ferreira", email: "camila@bellasaude.com", phone: "(11) 98765-1234", company: "Bella Saúde", stage: "Novo Lead", source: "Indicação", value: 3500, tags: ["saúde"], created_at: d(2) },
      // Primeiro Contato (2)
      { name: "André Souza", email: "andre@autoshop.com", phone: "(21) 97654-3210", company: "Auto Center Premium", stage: "Primeiro Contato", source: "WhatsApp", value: 8000, tags: ["auto", "urgente"], created_at: d(5) },
      { name: "Fernanda Lima", email: "fernanda@escola.com", phone: "(31) 91234-5678", company: "Criativa Kids", stage: "Primeiro Contato", source: "Formulário", value: 2000, tags: ["educação"], created_at: d(7) },
      // Follow-up (1)
      { name: "Bruno Almeida", email: "bruno@restaurante.com", phone: "(41) 93456-7890", company: "Sabor & Arte", stage: "Follow-up", source: "Orgânico", value: 2500, tags: ["food"], created_at: d(10) },
      // Diagnóstico (1)
      { name: "Juliana Costa", email: "juliana@modafit.com", phone: "(43) 94567-8901", company: "Moda Fit Store", stage: "Diagnóstico", source: "Meta Leads", value: 4000, tags: ["moda", "e-commerce"], created_at: d(12) },
      // Apresentação de Estratégia (2)
      { name: "Carlos Eduardo", email: "carlos@imobiliaria.com", phone: "(41) 95678-9012", company: "Imóveis Premium PR", stage: "Apresentação de Estratégia", source: "Indicação", value: 6000, tags: ["imobiliário", "quente"], created_at: d(15) },
      { name: "Patrícia Ramos", email: "patricia@clinicaodonto.com", phone: "(11) 96789-0123", company: "Clínica OdontoVida", stage: "Apresentação de Estratégia", source: "Eventos", value: 3500, tags: ["saúde"], created_at: d(14) },
      // Proposta (2)
      { name: "Marcos Vinícius", email: "marcos@construtora.com", phone: "(41) 97890-1234", company: "MV Construtora", stage: "Proposta", source: "Indicação", value: 12000, tags: ["construção", "premium"], created_at: d(20) },
      { name: "Renata Dias", email: "renata@petshop.com", phone: "(43) 98901-2345", company: "PetLove Shop", stage: "Proposta", source: "Meta Leads", value: 5500, tags: ["pet"], created_at: d(18) },
      // Venda (1)
      { name: "Thiago Martins", email: "thiago@academia.com", phone: "(41) 99012-3456", company: "Power Gym", stage: "Venda", source: "WhatsApp", value: 4500, tags: ["fitness", "convertido"], created_at: d(30) },
      // Oportunidade Perdida (1)
      { name: "Luciana Pereira", email: "luciana@joalheria.com", phone: "(11) 90123-4567", company: "Brilhare Joias", stage: "Oportunidade Perdida", source: "Orgânico", value: 3000, tags: [], created_at: d(25) },
    ];

    const { data: leads } = await sb.from("crm_leads").insert(
      leadsData.map(l => ({
        organization_id: orgId,
        funnel_id: funnelId,
        assigned_to: userId,
        name: l.name,
        email: l.email,
        phone: l.phone,
        company: l.company,
        stage: l.stage,
        source: l.source,
        value: l.value,
        tags: l.tags,
        created_at: l.created_at,
        won_at: l.stage === "Venda" ? d(2) : null,
        lost_at: l.stage === "Oportunidade Perdida" ? d(5) : null,
        lost_reason: l.stage === "Oportunidade Perdida" ? "Optou por outro fornecedor" : null,
      }))
    ).select("id, name");

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to insert leads" }), { status: 500, headers: getCorsHeaders(req) });
    }

    const leadMap: Record<string, string> = {};
    leads.forEach((l: { name: string; id: string }) => { leadMap[l.name] = l.id; });

    // 8. Activities (~15)
    const activities = [
      { lead: "Ricardo Mendes", title: "Ligação de primeiro contato", type: "call", description: "Não atendeu, deixar recado", created_at: d(0) },
      { lead: "Ricardo Mendes", title: "WhatsApp enviado", type: "whatsapp", description: "Enviada mensagem de apresentação", created_at: d(0) },
      { lead: "Camila Ferreira", title: "WhatsApp recebido", type: "whatsapp", description: "Interessada em saber mais sobre gestão de redes", created_at: d(1) },
      { lead: "André Souza", title: "Ligação realizada", type: "call", description: "Conversa de 15min, muito interessado. Agendar reunião.", created_at: d(3) },
      { lead: "André Souza", title: "Reunião presencial", type: "meeting", description: "Apresentação na empresa. Gostou da proposta de tráfego pago.", created_at: d(2) },
      { lead: "Fernanda Lima", title: "Email enviado", type: "email", description: "Enviado case de sucesso do segmento educação", created_at: d(5) },
      { lead: "Bruno Almeida", title: "Follow-up WhatsApp", type: "whatsapp", description: "Perguntou sobre prazo de resultados", created_at: d(3) },
      { lead: "Juliana Costa", title: "Diagnóstico enviado", type: "email", description: "Análise completa de presença digital enviada por email", created_at: d(4) },
      { lead: "Carlos Eduardo", title: "Reunião online", type: "meeting", description: "Apresentação de estratégia completa. Muito receptivo.", created_at: d(3) },
      { lead: "Patrícia Ramos", title: "Reunião presencial", type: "meeting", description: "Apresentação na clínica. Pediu proposta formal.", created_at: d(5) },
      { lead: "Marcos Vinícius", title: "Proposta enviada", type: "email", description: "Proposta de R$12.000/mês enviada. Aguardando retorno.", created_at: d(2) },
      { lead: "Marcos Vinícius", title: "Follow-up ligação", type: "call", description: "Disse que está analisando com os sócios", created_at: d(1) },
      { lead: "Renata Dias", title: "Proposta enviada", type: "email", description: "Proposta de gestão de redes + tráfego pago", created_at: d(3) },
      { lead: "Thiago Martins", title: "Contrato assinado", type: "meeting", description: "Fechou! Início dos trabalhos em 15 dias.", created_at: d(2) },
      { lead: "Luciana Pereira", title: "Ligação final", type: "call", description: "Informou que fechou com outro fornecedor. Manter contato.", created_at: d(5) },
    ];

    await sb.from("crm_activities").insert(
      activities.filter(a => leadMap[a.lead]).map(a => ({
        organization_id: orgId,
        lead_id: leadMap[a.lead],
        title: a.title,
        type: a.type,
        description: a.description,
        user_id: userId,
        created_at: a.created_at,
      }))
    );

    // 9. Notes (~8)
    const notes = [
      { lead: "Ricardo Mendes", content: "Lead veio por campanha de Meta Ads. Tem empresa de tecnologia e precisa de presença digital." },
      { lead: "André Souza", content: "Muito interessado em tráfego pago para gerar leads de oficina mecânica. Budget alto." },
      { lead: "Bruno Almeida", content: "Restaurante quer aumentar delivery. Precisa de fotos profissionais do cardápio." },
      { lead: "Juliana Costa", content: "E-commerce de moda fitness. Instagram com 15k seguidores mas vendas baixas." },
      { lead: "Carlos Eduardo", content: "Imobiliária com 3 unidades. Quer centralizar marketing digital. Potencial de R$6k/mês." },
      { lead: "Marcos Vinícius", content: "Construtora grande. Proposta de assessoria completa. Decisão depende de 2 sócios." },
      { lead: "Thiago Martins", content: "Fechou contrato de 12 meses! Foco em Instagram e Google Ads para captação de alunos." },
      { lead: "Luciana Pereira", content: "Perdemos por preço. Concorrente ofereceu 40% mais barato. Manter no radar." },
    ];

    await sb.from("crm_lead_notes").insert(
      notes.filter(n => leadMap[n.lead]).map(n => ({
        organization_id: orgId,
        lead_id: leadMap[n.lead],
        content: n.content,
        user_id: userId,
      }))
    );

    // 10. Tasks (~8)
    const tasks = [
      { lead: "Ricardo Mendes", title: "Fazer primeiro contato", due_date: d(-1), priority: "high" },
      { lead: "Camila Ferreira", title: "Enviar apresentação institucional", due_date: d(-1), priority: "medium" },
      { lead: "André Souza", title: "Preparar diagnóstico digital", due_date: d(0), priority: "high" },
      { lead: "Bruno Almeida", title: "Agendar visita presencial", due_date: d(1), priority: "medium" },
      { lead: "Carlos Eduardo", title: "Enviar proposta formal", due_date: d(0), priority: "high" },
      { lead: "Marcos Vinícius", title: "Follow-up proposta - ligar", due_date: d(1), priority: "high" },
      { lead: "Renata Dias", title: "Follow-up proposta PetLove", due_date: d(2), priority: "medium" },
      { lead: "Thiago Martins", title: "Agendar reunião de kickoff", due_date: d(3), priority: "medium", completed_at: d(1) },
    ];

    await sb.from("crm_tasks").insert(
      tasks.filter(t => leadMap[t.lead]).map(t => ({
        organization_id: orgId,
        lead_id: leadMap[t.lead],
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
        assigned_to: userId,
        completed_at: (t as { completed_at?: string }).completed_at || null,
      }))
    );

    // 11. Proposals (4)
    const proposals = [
      { lead: "Marcos Vinícius", title: "Proposta Assessoria Completa - MV Construtora", value: 12000, status: "sent", sent_at: d(2) },
      { lead: "Renata Dias", title: "Proposta Redes + Tráfego - PetLove", value: 5500, status: "sent", sent_at: d(3) },
      { lead: "Thiago Martins", title: "Proposta Marketing Digital - Power Gym", value: 4500, status: "accepted", sent_at: d(10), accepted_at: d(2) },
      { lead: "Carlos Eduardo", title: "Proposta Imóveis Premium (rascunho)", value: 6000, status: "draft" },
    ];

    await sb.from("crm_proposals").insert(
      proposals.filter(p => leadMap[p.lead]).map(p => ({
        organization_id: orgId,
        lead_id: leadMap[p.lead],
        title: p.title,
        value: p.value,
        status: p.status,
        created_by: userId,
        items: JSON.stringify([]),
        sent_at: (p as { sent_at?: string }).sent_at || null,
        accepted_at: (p as { accepted_at?: string }).accepted_at || null,
      }))
    );

    // 12. Contracts (3)
    const contracts = [
      { lead: "Thiago Martins", title: "Contrato Assessoria Digital - Power Gym", status: "active", monthly_value: 4500, total_value: 54000, duration_months: 12, start_date: "2026-02-01", end_date: "2027-01-31", signed_at: d(2), signer_name: "Thiago Martins", signer_email: "thiago@academia.com" },
      { lead: "Marcos Vinícius", title: "Contrato Marketing - MV Construtora", status: "pending_signature", monthly_value: 12000, total_value: 144000, duration_months: 12, signer_name: "Marcos Vinícius", signer_email: "marcos@construtora.com" },
      { lead: "Luciana Pereira", title: "Contrato Redes Sociais - Brilhare Joias (cancelado)", status: "cancelled", monthly_value: 3000, total_value: 18000, duration_months: 6 },
    ];

    await sb.from("contracts").insert(
      contracts.filter(c => leadMap[c.lead]).map(c => ({
        organization_id: orgId,
        lead_id: leadMap[c.lead],
        title: c.title,
        status: c.status,
        monthly_value: c.monthly_value,
        total_value: c.total_value,
        duration_months: c.duration_months,
        start_date: (c as { start_date?: string }).start_date || null,
        end_date: (c as { end_date?: string }).end_date || null,
        signed_at: (c as { signed_at?: string }).signed_at || null,
        signer_name: (c as { signer_name?: string }).signer_name || null,
        signer_email: (c as { signer_email?: string }).signer_email || null,
        created_by: userId,
      }))
    );

    // 13. Calendar events (6)
    const events = [
      { title: "Reunião com MV Construtora", description: "Follow-up proposta de assessoria completa", start: 1, durationH: 1, color: "#eab308" },
      { title: "Apresentação - Imóveis Premium PR", description: "Apresentação de estratégia digital", start: 2, durationH: 1.5, color: "#22c55e" },
      { title: "Kickoff Power Gym", description: "Reunião inicial de alinhamento com novo cliente", start: 3, durationH: 2, color: "#10b981" },
      { title: "Visita presencial Sabor & Arte", description: "Visitar restaurante para entender operação de delivery", start: 4, durationH: 1, color: "#3b82f6" },
      { title: "Follow-up PetLove Shop", description: "Ligar para Renata sobre proposta enviada", start: 1, durationH: 0.5, color: "#f97316" },
      { title: "Encontro da Rede - Franqueados PR", description: "Evento mensal de networking entre franqueados", start: 7, durationH: 3, color: "#6366f1" },
    ];

    await sb.from("calendar_events").insert(
      events.map(e => {
        const start = new Date(now.getTime() + e.start * 86400000);
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + e.durationH * 3600000);
        return {
          organization_id: orgId,
          title: e.title,
          description: e.description,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          color: e.color,
          created_by: userId,
        };
      })
    );

    // 14. Announcements (3)
    await sb.from("announcements").insert([
      {
        organization_id: orgId,
        title: "🚨 Atualização do Sistema - Nova versão do CRM",
        content: "Informamos que o sistema foi atualizado com novas funcionalidades no CRM: kanban melhorado, propostas integradas e relatórios avançados. Confira as novidades!",
        type: "update",
        priority: "critical",
        created_by: userId,
        published_at: d(1),
      },
      {
        organization_id: orgId,
        title: "📊 Meta do mês: 15 novos clientes",
        content: "A meta da rede para este mês é captar 15 novos clientes. Utilize os materiais de prospecção disponíveis na plataforma. Boas vendas!",
        type: "info",
        priority: "high",
        created_by: userId,
        published_at: d(3),
      },
      {
        organization_id: orgId,
        title: "📅 Evento: Workshop de Vendas Consultivas",
        content: "No próximo sábado às 9h teremos um workshop online sobre técnicas de vendas consultivas. Inscrições pelo link no Drive de materiais.",
        type: "event",
        priority: "normal",
        created_by: userId,
        published_at: d(5),
      },
    ]);

    return new Response(
      JSON.stringify({ success: true, leads_created: leads.length, org_id: orgId }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: getCorsHeaders(req) });
  }
});
