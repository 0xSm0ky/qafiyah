CREATE TABLE IF NOT EXISTS public.poem_aliases (
  slug text PRIMARY KEY CHECK (slug ~ '^[A-Za-z]{4}$'),
  poem_id integer NOT NULL REFERENCES public.poems (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_poem_aliases_poem_id ON public.poem_aliases (poem_id);

CREATE OR REPLACE FUNCTION public.poems_fill_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_candidate text;
  v_attempt   int;
  v_max       constant int := 10;
BEGIN
  IF NEW.slug IS NOT NULL AND length(btrim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;

  FOR v_attempt IN 1..v_max LOOP
    v_candidate := public.random_poem_slug();
    IF NOT EXISTS (SELECT 1 FROM public.poems WHERE slug = v_candidate)
       AND NOT EXISTS (SELECT 1 FROM public.poem_aliases WHERE slug = v_candidate) THEN
      NEW.slug := v_candidate;
      RETURN NEW;
    END IF;
  END LOOP;

  RAISE EXCEPTION
    'poems_fill_slug: could not find a free slug after % attempts', v_max;
END;
$function$;
