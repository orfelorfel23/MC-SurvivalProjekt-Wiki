
-- Tighten SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_editor(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor(UUID) TO authenticated;

-- wiki_search must remain callable publicly (powers the public search)
-- handle_new_user / touch_updated_at are trigger functions; restrict execute
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC;

-- Storage policies for wiki-media
CREATE POLICY "wiki_media_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'wiki-media');

CREATE POLICY "wiki_media_editor_insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wiki-media' AND public.is_editor(auth.uid()));

CREATE POLICY "wiki_media_editor_update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'wiki-media' AND public.is_editor(auth.uid()));

CREATE POLICY "wiki_media_editor_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'wiki-media' AND public.is_editor(auth.uid()));
