-- BUG-002: Normalize crm_funnels.stages from old {name,color,order} format
-- to new {key,label,color,icon} format.
--
-- Old format: [{"name":"Novo Lead","color":"#6366f1","order":0}, ...]
-- New format: [{"key":"novo_lead","label":"Novo Lead","color":"indigo","icon":"circle-dot"}, ...]
--
-- Detection: stage objects that have "name" key but no "key" key = old format.

DO $$
DECLARE
  rec       RECORD;
  old_stages jsonb;
  new_stages jsonb;
  stage     jsonb;
  i         int;
  stage_name text;
  hex_color  text;
  named_color text;
  stage_key  text;
BEGIN
  FOR rec IN
    SELECT id, stages
    FROM public.crm_funnels
    WHERE stages IS NOT NULL
      AND jsonb_array_length(stages) > 0
      -- old format: first element has "name" but not "key"
      AND (stages->0) ? 'name'
      AND NOT (stages->0) ? 'key'
  LOOP
    old_stages := rec.stages;
    new_stages := '[]'::jsonb;

    FOR i IN 0 .. jsonb_array_length(old_stages) - 1 LOOP
      stage := old_stages->i;
      stage_name := COALESCE(stage->>'name', 'Etapa ' || (i+1)::text);
      hex_color  := lower(COALESCE(stage->>'color', ''));

      -- Map hex → named color
      named_color := CASE hex_color
        WHEN '#6366f1' THEN 'indigo'
        WHEN '#f59e0b' THEN 'amber'
        WHEN '#10b981' THEN 'emerald'
        WHEN '#ef4444' THEN 'red'
        WHEN '#8b5cf6' THEN 'purple'
        WHEN '#06b6d4' THEN 'cyan'
        WHEN '#3b82f6' THEN 'blue'
        WHEN '#f97316' THEN 'orange'
        WHEN '#ec4899' THEN 'pink'
        WHEN '#14b8a6' THEN 'teal'
        WHEN '#a855f7' THEN 'purple'
        WHEN '#22c55e' THEN 'emerald'
        ELSE 'blue'
      END;

      -- Slugify: lowercase, remove accents (simplified), replace spaces with underscore
      stage_key := lower(
        regexp_replace(
          translate(
            lower(stage_name),
            'áàãâäéèêëíìîïóòõôöúùûüçñ',
            'aaaaaaeeeeiiiiooooouuuucn'
          ),
          '[^a-z0-9]+', '_', 'g'
        )
      );
      -- Trim leading/trailing underscores
      stage_key := regexp_replace(stage_key, '^_+|_+$', '', 'g');
      IF stage_key = '' THEN
        stage_key := 'stage_' || i::text;
      END IF;

      new_stages := new_stages || jsonb_build_object(
        'key',   stage_key,
        'label', stage_name,
        'color', named_color,
        'icon',  'circle-dot'
      );
    END LOOP;

    UPDATE public.crm_funnels
    SET stages = new_stages,
        updated_at = now()
    WHERE id = rec.id;

    RAISE NOTICE 'Normalized funnel %: % stages converted', rec.id, jsonb_array_length(old_stages);
  END LOOP;
END;
$$;
