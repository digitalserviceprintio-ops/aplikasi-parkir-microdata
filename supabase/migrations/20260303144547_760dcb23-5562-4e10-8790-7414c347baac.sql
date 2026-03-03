
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'attendant' CHECK (role IN ('admin', 'attendant', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parking_rates table
CREATE TABLE public.parking_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type TEXT NOT NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('flat', 'hourly')),
  rate_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  exit_time TIMESTAMPTZ,
  total_price NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: check role
CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.has_role('admin'));

-- Transactions RLS
CREATE POLICY "View transactions" ON public.transactions FOR SELECT USING (
  public.has_role('admin') OR public.has_role('owner') OR created_by = auth.uid()
);
CREATE POLICY "Create transactions" ON public.transactions FOR INSERT WITH CHECK (
  public.has_role('admin') OR public.has_role('attendant')
);
CREATE POLICY "Update transactions" ON public.transactions FOR UPDATE USING (
  public.has_role('admin') OR (public.has_role('attendant') AND created_by = auth.uid())
);
CREATE POLICY "Delete transactions" ON public.transactions FOR DELETE USING (
  public.has_role('admin')
);

-- Parking rates RLS
CREATE POLICY "Anyone can view rates" ON public.parking_rates FOR SELECT USING (true);
CREATE POLICY "Admin can insert rates" ON public.parking_rates FOR INSERT WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admin can update rates" ON public.parking_rates FOR UPDATE USING (public.has_role('admin'));
CREATE POLICY "Admin can delete rates" ON public.parking_rates FOR DELETE USING (public.has_role('admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendant')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_parking_rates_updated_at BEFORE UPDATE ON public.parking_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default parking rates
INSERT INTO public.parking_rates (vehicle_type, rate_type, rate_amount) VALUES
('motor', 'flat', 2000),
('mobil', 'flat', 5000),
('lainnya', 'flat', 3000);
