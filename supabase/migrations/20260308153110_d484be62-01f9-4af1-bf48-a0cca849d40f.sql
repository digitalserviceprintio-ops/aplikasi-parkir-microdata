
-- App announcements table for update/maintenance notifications
CREATE TABLE public.app_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, update, maintenance, warning
  app_version text DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON public.app_announcements
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage announcements" ON public.app_announcements
  FOR ALL USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- Licenses table
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  is_permanent boolean NOT NULL DEFAULT false,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.profiles(id) DEFAULT NULL,
  used_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check license" ON public.licenses
  FOR SELECT USING (true);

CREATE POLICY "License can be claimed on registration" ON public.licenses
  FOR UPDATE USING (true) WITH CHECK (true);

-- Insert one permanent license key
INSERT INTO public.licenses (license_key, is_permanent) VALUES ('PARK-PERMANENT-2024-XYZQ', true);
