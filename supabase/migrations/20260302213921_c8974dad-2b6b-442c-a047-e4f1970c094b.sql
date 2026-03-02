
-- Sales Plans table to persist diagnostic answers (previously in localStorage)
CREATE TABLE public.sales_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.sales_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org sales plan"
ON public.sales_plans FOR SELECT
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert their org sales plan"
ON public.sales_plans FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update their org sales plan"
ON public.sales_plans FOR UPDATE
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE TRIGGER update_sales_plans_updated_at
BEFORE UPDATE ON public.sales_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
