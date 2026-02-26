
CREATE TABLE public.social_art_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  art_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  prompt_used TEXT,
  style TEXT,
  nivel TEXT,
  format TEXT,
  feedback_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_art_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert feedback" ON public.social_art_feedback
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can view org feedback" ON public.social_art_feedback
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Service role full access" ON public.social_art_feedback
  FOR ALL USING (true);

CREATE INDEX idx_social_art_feedback_org ON public.social_art_feedback(organization_id);
CREATE INDEX idx_social_art_feedback_status ON public.social_art_feedback(organization_id, status);
