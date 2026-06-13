
-- has_role: only allow checking auth.uid() — prevents reading other users' roles via API
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'));
END;
$$;

-- wiki_search: switch to SECURITY INVOKER (only reads public-readable tables, RLS applies)
CREATE OR REPLACE FUNCTION public.wiki_search(q TEXT)
RETURNS TABLE(kind TEXT, slug TEXT, title TEXT, snippet TEXT, image_url TEXT)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT 'items' AS kind, slug, name_de AS title, COALESCE(description_de,'') AS snippet, image_url
  FROM public.items WHERE name_de ILIKE '%'||q||'%' OR COALESCE(name_en,'') ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%' OR COALESCE(oraxen_id,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'befehle', slug, name_de, COALESCE(description_de,''), NULL FROM public.commands
  WHERE name_de ILIKE '%'||q||'%' OR syntax ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'welten', slug, name_de, COALESCE(description_de,''), image_url FROM public.worlds
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'rezepte', slug, name_de, COALESCE(description_de,''), NULL FROM public.recipes
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'bosse', slug, name_de, COALESCE(description_de,''), image_url FROM public.bosses
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'aufgaben', slug, name_de, COALESCE(description_de,''), NULL FROM public.tasks
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'shop', slug, name_de, COALESCE(description_de,''), image_url FROM public.shop_offers
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'pets', slug, name_de, COALESCE(description_de,''), image_url FROM public.pets
  WHERE name_de ILIKE '%'||q||'%' OR COALESCE(description_de,'') ILIKE '%'||q||'%'
  UNION ALL
  SELECT 'wiki', slug, title_de, COALESCE(LEFT(body_de,160),''), NULL FROM public.wiki_pages
  WHERE title_de ILIKE '%'||q||'%' OR COALESCE(body_de,'') ILIKE '%'||q||'%'
  LIMIT 200;
$$;
GRANT EXECUTE ON FUNCTION public.wiki_search(TEXT) TO anon, authenticated;
