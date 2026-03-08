
-- Create client_tasks table for the new task management system
CREATE TABLE public.client_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_team TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;

-- RLS: Members can read all tasks in their org
CREATE POLICY "Members can view org tasks"
  ON public.client_tasks FOR SELECT
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- RLS: Members can create tasks in their org
CREATE POLICY "Members can create tasks"
  ON public.client_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- RLS: Members can update tasks in their org
CREATE POLICY "Members can update tasks"
  ON public.client_tasks FOR UPDATE
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- RLS: Members can delete tasks in their org
CREATE POLICY "Members can delete tasks"
  ON public.client_tasks FOR DELETE
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Index for fast org queries
CREATE INDEX idx_client_tasks_org ON public.client_tasks(organization_id);
CREATE INDEX idx_client_tasks_assigned ON public.client_tasks(assigned_to);
CREATE INDEX idx_client_tasks_due ON public.client_tasks(due_date);
