
-- Allow multiple roles per user (one per portal context)
-- Remove single-role constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- Add composite constraint allowing same user to have different roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE(user_id, role);

-- Update get_user_role to accept optional portal parameter
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _portal text DEFAULT NULL)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND (
      _portal IS NULL
      OR (_portal = 'saas' AND role IN ('cliente_admin', 'cliente_user'))
      OR (_portal = 'franchise' AND role IN ('super_admin', 'admin', 'franqueado'))
    )
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'franqueado' THEN 3
      WHEN 'cliente_admin' THEN 4
      WHEN 'cliente_user' THEN 5
    END
  LIMIT 1
$$;
