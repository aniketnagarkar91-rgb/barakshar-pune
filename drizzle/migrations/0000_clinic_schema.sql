CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  clinic_name text DEFAULT 'Barakshar Clinic',
  phone text,
  address text,
  registration_no text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  mobile text,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own patients" ON public.patients FOR ALL TO authenticated USING (auth.uid() = practitioner_id) WITH CHECK (auth.uid() = practitioner_id);
CREATE INDEX patients_practitioner_idx ON public.patients(practitioner_id, name);

CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL DEFAULT auth.uid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'draft',
  symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  examination jsonb NOT NULL DEFAULT '{}'::jsonb,
  prescription jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own visits" ON public.visits FOR ALL TO authenticated USING (auth.uid() = practitioner_id) WITH CHECK (auth.uid() = practitioner_id);
CREATE INDEX visits_patient_idx ON public.visits(patient_id, visit_date DESC);

CREATE TABLE public.visit_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL DEFAULT auth.uid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  kind text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.visit_documents TO authenticated;
GRANT ALL ON public.visit_documents TO service_role;
ALTER TABLE public.visit_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own docs select" ON public.visit_documents FOR SELECT TO authenticated USING (auth.uid() = practitioner_id);
CREATE POLICY "own docs insert" ON public.visit_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = practitioner_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_patients BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_visits BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "own files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);