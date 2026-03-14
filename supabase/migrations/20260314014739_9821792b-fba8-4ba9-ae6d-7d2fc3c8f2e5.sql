
-- Update handle_new_user to default role 'kasir' instead of 'attendant'
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN NEW;
END;
$function$;

-- Update profiles default role
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'kasir';

-- Update RLS policies that reference 'attendant' to include 'kasir'
DROP POLICY IF EXISTS "Admin can insert cards" ON public.parking_cards;
CREATE POLICY "Admin can insert cards" ON public.parking_cards
  FOR INSERT TO public
  WITH CHECK (has_role('admin') OR has_role('kasir'));

DROP POLICY IF EXISTS "View parking cards" ON public.parking_cards;
CREATE POLICY "View parking cards" ON public.parking_cards
  FOR SELECT TO public
  USING (has_role('admin') OR has_role('kasir'));

DROP POLICY IF EXISTS "Create transactions" ON public.transactions;
CREATE POLICY "Create transactions" ON public.transactions
  FOR INSERT TO public
  WITH CHECK (has_role('admin') OR has_role('kasir'));

DROP POLICY IF EXISTS "Update transactions" ON public.transactions;
CREATE POLICY "Update transactions" ON public.transactions
  FOR UPDATE TO public
  USING (has_role('admin') OR (has_role('kasir') AND created_by = auth.uid()));

DROP POLICY IF EXISTS "View transactions" ON public.transactions;
CREATE POLICY "View transactions" ON public.transactions
  FOR SELECT TO public
  USING (has_role('admin') OR has_role('kasir'));
