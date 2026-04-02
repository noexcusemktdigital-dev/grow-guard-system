
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid NOT NULL,
  role text NOT NULL DEFAULT 'cliente_user',
  team_ids text[] DEFAULT '{}',
  full_name text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE(email, organization_id)
);

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pending invitations for their org"
ON public.pending_invitations FOR SELECT TO authenticated
USING (
  public.is_member_of_org(auth.uid(), organization_id)
);

CREATE POLICY "Members can delete pending invitations for their org"
ON public.pending_invitations FOR DELETE TO authenticated
USING (
  public.is_member_of_org(auth.uid(), organization_id)
);
