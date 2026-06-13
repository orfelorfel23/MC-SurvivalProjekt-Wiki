
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Generic editor write policy helper - we inline it on each table.

-- ============ CONTENT TABLES ============

-- WORLDS
CREATE TABLE public.worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  world_type TEXT NOT NULL DEFAULT 'other', -- bosswelt, farmwelt, bauwelt, spawn, other
  description_de TEXT,
  description_en TEXT,
  access_info_de TEXT,
  access_info_en TEXT,
  rules_de TEXT,
  rules_en TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.worlds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worlds TO authenticated;
GRANT ALL ON public.worlds TO service_role;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worlds_public_read" ON public.worlds FOR SELECT USING (true);
CREATE POLICY "worlds_editor_write" ON public.worlds FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_worlds_updated BEFORE UPDATE ON public.worlds FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- COMMANDS
CREATE TABLE public.commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  syntax TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  permission TEXT,
  examples TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commands TO authenticated;
GRANT ALL ON public.commands TO service_role;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commands_public_read" ON public.commands FOR SELECT USING (true);
CREATE POLICY "commands_editor_write" ON public.commands FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_commands_updated BEFORE UPDATE ON public.commands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ITEMS
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  oraxen_id TEXT,
  rarity TEXT NOT NULL DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  description_de TEXT,
  description_en TEXT,
  source_de TEXT,
  source_en TEXT,
  image_url TEXT,
  enchanted BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'misc',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_public_read" ON public.items FOR SELECT USING (true);
CREATE POLICY "items_editor_write" ON public.items FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RECIPES (3x3 grid stored as JSONB array of 9 item slugs or null)
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  result_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  result_count INTEGER NOT NULL DEFAULT 1,
  shaped BOOLEAN NOT NULL DEFAULT true,
  station TEXT NOT NULL DEFAULT 'workbench', -- workbench, smithing, furnace, anvil, other
  -- grid: array of 9 entries, each {item_id: uuid|null, count: int} OR null
  grid JSONB NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null]'::jsonb,
  description_de TEXT,
  description_en TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_public_read" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "recipes_editor_write" ON public.recipes FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX recipes_result_item_idx ON public.recipes(result_item_id);

-- BOSSES
CREATE TABLE public.bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,
  spawn_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'normal', -- easy, normal, hard, nightmare
  description_de TEXT,
  description_en TEXT,
  strategy_de TEXT,
  strategy_en TEXT,
  drops JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{item_id, chance, min, max}]
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bosses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bosses TO authenticated;
GRANT ALL ON public.bosses TO service_role;
ALTER TABLE public.bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bosses_public_read" ON public.bosses FOR SELECT USING (true);
CREATE POLICY "bosses_editor_write" ON public.bosses FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_bosses_updated BEFORE UPDATE ON public.bosses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TASKS (tägliche Aufgaben)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  description_de TEXT,
  description_en TEXT,
  reward_amount INTEGER,
  reward_currency TEXT NOT NULL DEFAULT 'coins',
  reward_extra_de TEXT,
  reward_extra_en TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, one-time
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_public_read" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks_editor_write" ON public.tasks FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SHOP OFFERS
CREATE TABLE public.shop_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_name_override TEXT,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'coins',
  category TEXT NOT NULL DEFAULT 'general',
  description_de TEXT,
  description_en TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_offers TO authenticated;
GRANT ALL ON public.shop_offers TO service_role;
ALTER TABLE public.shop_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_public_read" ON public.shop_offers FOR SELECT USING (true);
CREATE POLICY "shop_editor_write" ON public.shop_offers FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_shop_updated BEFORE UPDATE ON public.shop_offers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PETS / MOUNTS
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT,
  source TEXT, -- e.g. SamusDev RPG Pets
  kind TEXT NOT NULL DEFAULT 'pet', -- pet, mount
  description_de TEXT,
  description_en TEXT,
  skills_de TEXT,
  skills_en TEXT,
  acquire_de TEXT,
  acquire_en TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_public_read" ON public.pets FOR SELECT USING (true);
CREATE POLICY "pets_editor_write" ON public.pets FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_pets_updated BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GENERIC WIKI PAGES
CREATE TABLE public.wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_de TEXT NOT NULL,
  title_en TEXT,
  body_de TEXT,
  body_en TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wiki_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;
GRANT ALL ON public.wiki_pages TO service_role;
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wiki_public_read" ON public.wiki_pages FOR SELECT USING (true);
CREATE POLICY "wiki_editor_write" ON public.wiki_pages FOR ALL TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE TRIGGER trg_wiki_updated BEFORE UPDATE ON public.wiki_pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GLOBAL SEARCH FUNCTION
CREATE OR REPLACE FUNCTION public.wiki_search(q TEXT)
RETURNS TABLE(kind TEXT, slug TEXT, title TEXT, snippet TEXT, image_url TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
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
