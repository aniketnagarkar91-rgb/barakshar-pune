import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/clinic/Field";
import { PatientForm, toPatientRow, usePatientState, validatePatient } from "@/components/clinic/PatientForm";

export const Route = createFileRoute("/_authenticated/patients/new")({
  head: () => ({ meta: [{ title: "New patient — Barakshar Clinic" }, { name: "description", content: "Register a new patient." }] }),
  component: NewPatient,
});

function NewPatient() {
  const navigate = useNavigate();
  const [v, setV] = usePatientState();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(startVisit: boolean) {
    const errs = validatePatient(v);
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please fix the highlighted fields");
    setBusy(true);
    const { data, error } = await supabase.from("patients").insert(toPatientRow(v)).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Could not save"); }
    if (startVisit) {
      const { data: visit, error: e2 } = await supabase.from("visits").insert({ patient_id: data.id }).select("id").single();
      setBusy(false);
      if (e2 || !visit) return toast.error(e2?.message ?? "Could not start visit");
      toast.success("Patient registered");
      return navigate({ to: "/visits/$visitId", params: { visitId: visit.id } });
    }
    setBusy(false);
    toast.success("Patient registered");
    navigate({ to: "/patients/$patientId", params: { patientId: data.id } });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-deep">Register patient</h1>
      <Section title="Patient details" desc="Fields marked * are required.">
        <PatientForm value={v} onChange={setV} errors={errors} />
      </Section>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={() => save(false)}>Save patient</Button>
        <Button variant="hero" disabled={busy} onClick={() => save(true)}>Save & start case paper</Button>
      </div>
    </div>
  );
}
