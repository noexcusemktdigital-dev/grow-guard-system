
CREATE TABLE public.quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org quick replies"
  ON public.quick_reply_templates FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org quick replies"
  ON public.quick_reply_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update own org quick replies"
  ON public.quick_reply_templates FOR UPDATE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete own org quick replies"
  ON public.quick_reply_templates FOR DELETE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));
