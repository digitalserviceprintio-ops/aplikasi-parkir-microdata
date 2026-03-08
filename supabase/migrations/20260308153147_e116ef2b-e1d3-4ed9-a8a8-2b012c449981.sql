
-- Tighten license update policy: only allow updating is_used, used_by, used_at when not already used
DROP POLICY "License can be claimed on registration" ON public.licenses;
CREATE POLICY "License can be claimed on registration" ON public.licenses
  FOR UPDATE USING (is_used = false) WITH CHECK (is_used = true);
