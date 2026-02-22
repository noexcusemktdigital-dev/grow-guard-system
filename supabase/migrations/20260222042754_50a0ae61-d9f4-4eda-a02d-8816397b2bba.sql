
-- =============================================
-- BLOCO 1: CRIAÇÃO DE TODAS AS TABELAS
-- =============================================

-- =============== GRUPO CRM ===============

CREATE TABLE public.crm_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_funnels_org ON public.crm_funnels(organization_id);
ALTER TABLE public.crm_funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org funnels" ON public.crm_funnels FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage funnels" ON public.crm_funnels FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  funnel_id uuid REFERENCES public.crm_funnels(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  stage text NOT NULL DEFAULT 'novo',
  source text,
  value numeric DEFAULT 0,
  assigned_to uuid,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}'::jsonb,
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_leads_org ON public.crm_leads(organization_id);
CREATE INDEX idx_crm_leads_funnel ON public.crm_leads(funnel_id);
CREATE INDEX idx_crm_leads_stage ON public.crm_leads(stage);
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org leads" ON public.crm_leads FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can insert leads" ON public.crm_leads FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can update leads" ON public.crm_leads FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can delete leads" ON public.crm_leads FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id uuid,
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_activities_lead ON public.crm_activities(lead_id);
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org activities" ON public.crm_activities FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can insert activities" ON public.crm_activities FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to uuid,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed_at timestamptz,
  priority text DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tasks_lead ON public.crm_tasks(lead_id);
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org tasks" ON public.crm_tasks FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage tasks" ON public.crm_tasks FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.crm_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org files" ON public.crm_files FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage files" ON public.crm_files FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.crm_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  value numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org proposals" ON public.crm_proposals FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage proposals" ON public.crm_proposals FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.crm_lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org notes" ON public.crm_lead_notes FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage notes" ON public.crm_lead_notes FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

-- =============== GRUPO FINANCEIRO ===============

CREATE TABLE public.finance_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month, year)
);
ALTER TABLE public.finance_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org months" ON public.finance_months FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage months" ON public.finance_months FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org finance clients" ON public.finance_clients FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage finance clients" ON public.finance_clients FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  finance_month_id uuid REFERENCES public.finance_months(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.finance_clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  category text,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org revenues" ON public.finance_revenues FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage revenues" ON public.finance_revenues FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  finance_month_id uuid REFERENCES public.finance_months(id) ON DELETE SET NULL,
  description text NOT NULL,
  category text,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  is_recurring boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org expenses" ON public.finance_expenses FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage expenses" ON public.finance_expenses FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  salary numeric DEFAULT 0,
  hire_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org employees" ON public.finance_employees FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage employees" ON public.finance_employees FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_franchisees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  franchisee_org_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  royalty_percentage numeric DEFAULT 0,
  marketing_fee numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_franchisees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org franchisees" ON public.finance_franchisees FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage franchisees" ON public.finance_franchisees FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.finance_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'loan',
  total_amount numeric NOT NULL DEFAULT 0,
  installment_amount numeric NOT NULL DEFAULT 0,
  total_installments integer NOT NULL DEFAULT 1,
  paid_installments integer NOT NULL DEFAULT 0,
  start_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org installments" ON public.finance_installments FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage installments" ON public.finance_installments FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO COMUNICACAO ===============

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'info',
  priority text NOT NULL DEFAULT 'normal',
  target_roles text[] DEFAULT '{}',
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org announcements" ON public.announcements FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  UNIQUE(announcement_id, user_id)
);
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own views" ON public.announcement_views FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own views" ON public.announcement_views FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own views" ON public.announcement_views FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE public.daily_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message text NOT NULL,
  author text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org messages" ON public.daily_messages FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage messages" ON public.daily_messages FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO ATENDIMENTO ===============

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  assigned_to uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org tickets" ON public.support_tickets FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can update tickets" ON public.support_tickets FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket members can view messages" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND is_member_of_org(auth.uid(), t.organization_id))
);
CREATE POLICY "Ticket members can send messages" ON public.support_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND is_member_of_org(auth.uid(), t.organization_id))
);

-- =============== GRUPO CONTRATOS ===============

CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org templates" ON public.contract_templates FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage templates" ON public.contract_templates FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'draft',
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org contracts" ON public.contracts FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO ACADEMY ===============

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  difficulty text DEFAULT 'beginner',
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org modules" ON public.academy_modules FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage modules" ON public.academy_modules FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  duration_minutes integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org lessons" ON public.academy_lessons FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage lessons" ON public.academy_lessons FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org quizzes" ON public.academy_quizzes FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage quizzes" ON public.academy_quizzes FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.academy_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.academy_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view quiz questions" ON public.academy_quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.academy_quizzes q WHERE q.id = quiz_id AND is_member_of_org(auth.uid(), q.organization_id))
);
CREATE POLICY "Admins can manage quiz questions" ON public.academy_quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.academy_quizzes q WHERE q.id = quiz_id AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
);

CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz,
  progress_percent integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.academy_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own progress" ON public.academy_progress FOR ALL USING (user_id = auth.uid());

CREATE TABLE public.academy_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.academy_quiz_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attempts" ON public.academy_quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_url text,
  UNIQUE(user_id, module_id)
);
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certs" ON public.academy_certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert certs" ON public.academy_certificates FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============== GRUPO AGENDA ===============

CREATE TABLE public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org calendars" ON public.calendars FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage calendars" ON public.calendars FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  recurrence text,
  color text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_calendar_events_org ON public.calendar_events(organization_id);
CREATE INDEX idx_calendar_events_dates ON public.calendar_events(start_at, end_at);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org events" ON public.calendar_events FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage events" ON public.calendar_events FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view" ON public.event_participants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.calendar_events e WHERE e.id = event_id AND is_member_of_org(auth.uid(), e.organization_id))
);
CREATE POLICY "Members can manage participants" ON public.event_participants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.calendar_events e WHERE e.id = event_id AND is_member_of_org(auth.uid(), e.organization_id))
);

-- =============== GRUPO MARKETING ===============

CREATE TABLE public.marketing_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.marketing_folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org folders" ON public.marketing_folders FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage folders" ON public.marketing_folders FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.marketing_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  thumbnail_url text,
  size_bytes bigint,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org assets" ON public.marketing_assets FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage assets" ON public.marketing_assets FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO ONBOARDING ===============

CREATE TABLE public.onboarding_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_org_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  start_date date,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org onboarding" ON public.onboarding_units FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage onboarding" ON public.onboarding_units FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_unit_id uuid NOT NULL REFERENCES public.onboarding_units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org checklist" ON public.onboarding_checklist FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage checklist" ON public.onboarding_checklist FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.onboarding_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_unit_id uuid NOT NULL REFERENCES public.onboarding_units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  date timestamptz,
  notes text,
  status text DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org meetings" ON public.onboarding_meetings FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage meetings" ON public.onboarding_meetings FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_unit_id uuid NOT NULL REFERENCES public.onboarding_units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid,
  due_date date,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org ob tasks" ON public.onboarding_tasks FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage ob tasks" ON public.onboarding_tasks FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.onboarding_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_unit_id uuid NOT NULL REFERENCES public.onboarding_units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_value numeric,
  current_value numeric DEFAULT 0,
  unit text DEFAULT '%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org indicators" ON public.onboarding_indicators FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage indicators" ON public.onboarding_indicators FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO METAS/RANKING ===============

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'revenue',
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric DEFAULT 0,
  period_start date,
  period_end date,
  assigned_to uuid,
  unit_org_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org goals" ON public.goals FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage goals" ON public.goals FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_org_id uuid REFERENCES public.organizations(id),
  month integer NOT NULL,
  year integer NOT NULL,
  score numeric DEFAULT 0,
  position integer,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, unit_org_id, month, year)
);
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org rankings" ON public.rankings FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage rankings" ON public.rankings FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO UNIDADES ===============

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_org_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  city text,
  state text,
  address text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active',
  opened_at date,
  manager_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org units" ON public.units FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage units" ON public.units FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============== GRUPO MATRIZ ===============

CREATE TABLE public.permission_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org profiles" ON public.permission_profiles FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage profiles" ON public.permission_profiles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.permission_profiles(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  UNIQUE(profile_id, module)
);
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view module perms" ON public.module_permissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.permission_profiles pp WHERE pp.id = profile_id AND is_member_of_org(auth.uid(), pp.organization_id))
);
CREATE POLICY "Admins can manage module perms" ON public.module_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.permission_profiles pp WHERE pp.id = profile_id AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
);

-- =============== GRUPO CLIENTE SAAS ===============

CREATE TABLE public.client_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist" ON public.client_checklist_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own checklist" ON public.client_checklist_items FOR ALL USING (user_id = auth.uid());

CREATE TABLE public.client_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'marketing',
  status text NOT NULL DEFAULT 'draft',
  budget numeric DEFAULT 0,
  start_date date,
  end_date date,
  content jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org campaigns" ON public.client_campaigns FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage campaigns" ON public.client_campaigns FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.client_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'post',
  status text NOT NULL DEFAULT 'draft',
  platform text,
  scheduled_at timestamptz,
  published_at timestamptz,
  media_urls text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org content" ON public.client_content FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage content" ON public.client_content FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.client_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  category text,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org scripts" ON public.client_scripts FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage scripts" ON public.client_scripts FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.client_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  message text,
  recipients jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  stats jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org dispatches" ON public.client_dispatches FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage dispatches" ON public.client_dispatches FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.client_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'landing_page',
  url text,
  status text NOT NULL DEFAULT 'draft',
  content jsonb DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org sites" ON public.client_sites FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage sites" ON public.client_sites FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.client_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.client_notifications FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE public.client_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  badges jsonb DEFAULT '[]'::jsonb,
  streak_days integer DEFAULT 0,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.client_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON public.client_gamification FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own gamification" ON public.client_gamification FOR ALL USING (user_id = auth.uid());

-- =============== TRIGGERS updated_at ===============

CREATE TRIGGER update_crm_funnels_updated_at BEFORE UPDATE ON public.crm_funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_proposals_updated_at BEFORE UPDATE ON public.crm_proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_lead_notes_updated_at BEFORE UPDATE ON public.crm_lead_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_months_updated_at BEFORE UPDATE ON public.finance_months FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_clients_updated_at BEFORE UPDATE ON public.finance_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_revenues_updated_at BEFORE UPDATE ON public.finance_revenues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_expenses_updated_at BEFORE UPDATE ON public.finance_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_employees_updated_at BEFORE UPDATE ON public.finance_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_franchisees_updated_at BEFORE UPDATE ON public.finance_franchisees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_installments_updated_at BEFORE UPDATE ON public.finance_installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academy_modules_updated_at BEFORE UPDATE ON public.academy_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academy_lessons_updated_at BEFORE UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_units_updated_at BEFORE UPDATE ON public.onboarding_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_indicators_updated_at BEFORE UPDATE ON public.onboarding_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permission_profiles_updated_at BEFORE UPDATE ON public.permission_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_campaigns_updated_at BEFORE UPDATE ON public.client_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_content_updated_at BEFORE UPDATE ON public.client_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_scripts_updated_at BEFORE UPDATE ON public.client_scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_sites_updated_at BEFORE UPDATE ON public.client_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_gamification_updated_at BEFORE UPDATE ON public.client_gamification FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
