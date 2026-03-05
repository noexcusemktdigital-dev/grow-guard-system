
CREATE TABLE public.client_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,
  content_id uuid REFERENCES public.client_content(id),
  type text NOT NULL DEFAULT 'art',
  format text,
  style text,
  duration text,
  input_text text,
  reference_image_urls text[],
  result_url text,
  result_data jsonb,
  status text DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org posts"
  ON public.client_posts FOR SELECT
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert org posts"
  ON public.client_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update org posts"
  ON public.client_posts FOR UPDATE
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete org posts"
  ON public.client_posts FOR DELETE
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));
