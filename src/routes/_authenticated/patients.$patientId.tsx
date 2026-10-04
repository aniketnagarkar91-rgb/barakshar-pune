import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePlus2, FileDown, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/clinic/Field";
import { PatientForm, toPatientRow, validatePatient, type PatientInput } from "@/components/clinic/PatientForm";
import { openDocument } from "@/components/clinic/hooks";
import { bmi } from "@/lib/clinic";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  head: () => ({ meta: [{ title: "Patient — Barakshar Clinic" }, { name: "description", content: "Patient profile and visit history." }] }),
  component: PatientPage,
});

function toInput(p: Record<string, unknown>): PatientInput {
  const s = (k: string) => (p[k] == null ? "" : String(p[k]));
  return { name: s("name"), age: s("age"), gender: s("gender"), height_cm: s("height_cm"), weight_kg: s("weight_kg"), mobile: s("mobile"), email: s("email"), address: s("address") };
}

function PatientPage() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PatientInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patient = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
      if (error) throw error;
      return data;
    },
  });
  const visits = useQuery({
    queryKey: ["visits", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("visits").select("id,visit_date,status,symptoms,visit_documents(id,kind,storage_path,created_at)").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { if (patient.data && !form) setForm(toInput(patient.data)); }, [patient.data, form]);

  async function newVisit() {
    const { data, error } = await supabase.from("visits").insert({ patient_id: patientId }).select("id").single();
    if (error || !data) return toast.error(error?.message ?? "Could not create visit");
    navigate({ to: "/visits/$visitId", params: { visitId: data.id } });
  }
  async function saveEdit() {
    if (!form) return;
    const errs = validatePatient(form); setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please fix the highlighted fields");
    const { error } = await supabase.from("patients").update(toPatientRow(form)).eq("id", patientId);
    if (error) return toast.error(error.message);
    toast.success("Patient updated"); setEditing(false);
    qc.invalidateQueries({ queryKey: ["patient", patientId] });
  }
  async function download(path: string) {
    try { await openDocument(path); } catch { toast.error("Could not open file"); }
  }

  const p = patient.data;
  if (patient.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!p) return <p>Patient not found. <Link to="/dashboard" className="text-primary">Back</Link></p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/dashboard" className="text-sm text-primary">← All patients</Link>
          <h1 className="mt-1 text-3xl font-extrabold text-primary-deep">{p.name}</h1>
          <p className="text-sm text-muted-foreground">{[p.age && `${p.age} yrs`, p.gender, p.mobile, bmi(p.height_cm, p.weight_kg) && `BMI ${bmi(p.height_cm, p.weight_kg)}`].filter(Boolean).join(" · ")}</p>
        </div>
        <Button variant="hero" onClick={newVisit}><FilePlus2 />New case paper</Button>
      </div>

      <Section title="Profile" action={!editing && <Button size="sm" variant="soft" onClick={() => setEditing(true)}><Pencil />Edit</Button>}>
        {editing && form ? (
          <>
            <PatientForm value={form} onChange={setForm} errors={errors} />
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => { setEditing(false); setForm(toInput(p)); }}>Cancel</Button><Button onClick={saveEdit}>Save</Button></div>
          </>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            {[["Email", p.email], ["Height", p.height_cm && `${p.height_cm} cm`], ["Weight", p.weight_kg && `${p.weight_kg} kg`], ["Address", p.address]].map(([k, v]) => (
              <div key={k as string}><dt className="text-xs font-semibold uppercase text-muted-foreground">{k}</dt><dd>{(v as string) || "—"}</dd></div>
            ))}
          </dl>
        )}
      </Section>

      <Section title="Visit history" desc="Every case paper and prescription PDF is kept — nothing is overwritten.">
        {visits.data?.length === 0 && <p className="text-sm text-muted-foreground">No visits yet.</p>}
        <ol className="space-y-3">
          {visits.data?.map((v) => {
            const complaints = (v.symptoms as { complaint?: string }[]).map((s) => s.complaint).filter(Boolean).join(", ");
            const docs = [...(v.visit_documents ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
            return (
              <li key={v.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-primary-deep">{new Date(v.visit_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <Button asChild size="sm" variant="soft"><Link to="/visits/$visitId" params={{ visitId: v.id }}>Open</Link></Button>
                </div>
                {complaints && <p className="mt-2 text-sm text-muted-foreground">{complaints}</p>}
                {docs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {docs.map((d) => (
                      <button key={d.id} onClick={() => download(d.storage_path)} className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs hover:bg-primary-soft">
                        <FileDown className="h-3.5 w-3.5 text-primary" />
                        {d.kind === "case_paper" ? "Case paper" : "Prescription"} · {new Date(d.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}
