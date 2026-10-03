import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Clinic } from "@/lib/clinic";

export const DEFAULT_CLINIC: Clinic = {
  full_name: "Aniket Nagarkar",
  clinic_name: "Barakshar Clinic",
  phone: "9322313576",
  address: null,
  registration_no: null,
};

export function useClinic() {
  return useQuery({
    queryKey: ["clinic"],
    queryFn: async (): Promise<Clinic> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return DEFAULT_CLINIC;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return {
        full_name: data?.full_name || DEFAULT_CLINIC.full_name,
        clinic_name: data?.clinic_name || DEFAULT_CLINIC.clinic_name,
        phone: data?.phone || DEFAULT_CLINIC.phone,
        address: data?.address ?? null,
        registration_no: data?.registration_no ?? null,
      };
    },
  });
}

export async function openDocument(path: string) {
  const { data, error } = await supabase.storage.from("case-documents").createSignedUrl(path, 120, { download: true });
  if (error || !data) throw error ?? new Error("Could not open file");
  window.open(data.signedUrl, "_blank");
}
