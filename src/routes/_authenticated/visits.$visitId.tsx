import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, FileDown, Plus, Save, Trash2, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, Section } from "@/components/clinic/Field";
import { useClinic, openDocument } from "@/components/clinic/hooks";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  CHRONIC_DISEASES, FAMILY_CONDITIONS, FREQUENCIES, POTENCIES, TIMINGS, TISSUE_SALTS, DISCLAIMER,
  emptyRx, emptySymptom, mergeExam, mergeRx, bmi,
  type Examination, type Patient, type Prescription, type Symptom,
} from "@/lib/clinic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/visits/$visitId")({
  head: () => ({ meta: [{ title: "Case paper — Barakshar Clinic" }, { name: "description", content: "Examination and prescription workflow." }] }),
  component: VisitPage,
});

const STEPS = ["Patient details", "Medical examination", "Case paper PDF", "Dosage & intake", "Prescription PDF"];

function VisitPage() {
  const { visitId } = Route.useParams();
  const qc = useQueryClient();
  const { data: clinic } = useClinic();
  const [step, setStep] = useState(0);
  const [symptoms, setSymptoms] = useState<Symptom[]>([emptySymptom()]);
  const [exam, setExam] = useState<Examination>(mergeExam({}));
  const [rx, setRx] = useState<Prescription>(mergeRx({}));
  const [visitDate, setVisitDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const visit = useQuery({
    queryKey: ["visit", visitId],
    queryFn: async () => {
      const { data, error } = await supabase.from("visits").select("*, patients(*), visit_documents(id,kind,storage_path,created_at)").eq("id", visitId).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!visit.data || loaded) return;
    const s = visit.data.symptoms as Symptom[];
    setSymptoms(s?.length ? s : [emptySymptom()]);
    setExam(mergeExam(visit.data.examination));
    setRx(mergeRx(visit.data.prescription));
    setVisitDate(visit.data.visit_date);
    setLoaded(true);
  }, [visit.data, loaded]);

  const patient = visit.data?.patients as unknown as Patient | undefined;

  async function save(extra: { status?: string } = {}, quiet = false) {
    setSaving(true);
    const { error } = await supabase.from("visits").update({
      symptoms: symptoms.filter((s) => s.complaint.trim()) as never,
      examination: exam as never, prescription: rx as never, visit_date: visitDate, ...extra,
    }).eq("id", visitId);
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setDirty(false);
    if (!quiet) toast.success("Draft saved");
    qc.invalidateQueries({ queryKey: ["visit", visitId] });
    return true;
  }

  async function go(n: number) {
    if (n === 4 && rx.items.length === 0) return toast.error("Add at least one tissue salt first");
    if (n >= 2 && !symptoms.some((s) => s.complaint.trim())) return toast.error("Record at least one symptom");
    if (dirty) await save({}, true);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function makePdf(kind: "case_paper" | "prescription") {
    if (!patient || !clinic) return;
    if (!(await save(kind === "prescription" ? { status: "completed" } : {}, true))) return;
    const { buildCasePaper, buildPrescription } = await import("@/lib/pdf");
    const cleanSymptoms = symptoms.filter((s) => s.complaint.trim());
    const doc = kind === "case_paper" ? buildCasePaper(clinic, patient, visitDate, cleanSymptoms, exam) : buildPrescription(clinic, patient, visitDate, cleanSymptoms, rx);
    const blob = doc.output("blob");
    const { data: u } = await supabase.auth.getUser();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = patient.name.replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
    const path = `${u.user!.id}/${visitId}/${kind}_${stamp}.pdf`;
    const up = await supabase.storage.from("case-documents").upload(path, blob, { contentType: "application/pdf", upsert: false });
    if (up.error) return toast.error(up.error.message);
    const ins = await supabase.from("visit_documents").insert({ visit_id: visitId, kind, storage_path: path });
    if (ins.error) return toast.error(ins.error.message);
    doc.save(`${safeName}_${kind === "case_paper" ? "CasePaper" : "Prescription"}_${visitDate}.pdf`);
    toast.success("PDF saved to visit history");
    qc.invalidateQueries({ queryKey: ["visit", visitId] });
  }

  if (visit.isLoading || !loaded) return <p className="text-muted-foreground">Loading…</p>;
  if (!patient) return <p>Visit not found.</p>;

  const docs = [...(visit.data?.visit_documents ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const update = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true); };
  const setE = update(setExam);
  const setS = update(setSymptoms);
  const setR = update(setRx);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/patients/$patientId" params={{ patientId: patient.id }} className="text-sm text-primary">← {patient.name}</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-primary-deep">Case paper</h1>
            <StatusBadge status={visit.data!.status} />
          </div>
        </div>
        <Button variant="outline" disabled={saving} onClick={() => save()}><Save />{saving ? "Saving…" : dirty ? "Save draft" : "Saved"}</Button>
      </div>

      <ol className="grid grid-cols-5 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => go(i)} className="group w-full text-left">
              <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
              <div className="mt-2 flex items-center gap-2">
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs", i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary-soft text-primary-deep ring-2 ring-primary" : "bg-muted text-muted-foreground")}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("hidden text-xs font-medium md:block", i === step ? "text-primary-deep" : "text-muted-foreground")}>{s}</span>
              </div>
            </button>
          </li>
        ))}
      </ol>
      <p className="text-sm font-semibold text-primary-deep md:hidden">Step {step + 1}: {STEPS[step]}</p>

      {step === 0 && (
        <>
          <Section title="Patient" desc="Edit the profile from the patient page." action={<Field label="Visit date"><Input type="date" value={visitDate} onChange={(e) => { setVisitDate(e.target.value); setDirty(true); }} /></Field>}>
            <dl className="grid gap-3 text-sm sm:grid-cols-4">
              {[["Name", patient.name], ["Age / Gender", `${patient.age ?? "—"} / ${patient.gender ?? "—"}`], ["Mobile", patient.mobile], ["BMI", bmi(patient.height_cm, patient.weight_kg)]].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs font-semibold uppercase text-muted-foreground">{k}</dt><dd className="font-medium">{(v as string) || "—"}</dd></div>
              ))}
            </dl>
          </Section>
          <Section title="Presenting symptoms" desc="Record each complaint separately." action={<Button size="sm" variant="soft" onClick={() => setS([...symptoms, emptySymptom()])}><Plus />Add symptom</Button>}>
            <div className="space-y-4">
              {symptoms.map((s, i) => {
                const up = (k: keyof Symptom, v: string) => setS(symptoms.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                return (
                  <div key={i} className="rounded-lg border bg-muted/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-primary">SYMPTOM {String(i + 1).padStart(2, "0")}</span>
                      {symptoms.length > 1 && <Button size="icon" variant="ghost" onClick={() => setS(symptoms.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button>}
                    </div>
                    <div className="grid gap-3 md:grid-cols-6">
                      <Field label="Complaint *" className="md:col-span-3"><Input value={s.complaint} onChange={(e) => up("complaint", e.target.value)} maxLength={200} /></Field>
                      <Field label="Location" className="md:col-span-3"><Input value={s.location} onChange={(e) => up("location", e.target.value)} /></Field>
                      <Field label="Duration" className="md:col-span-2"><Input value={s.duration} onChange={(e) => up("duration", e.target.value)} placeholder="e.g. 2 weeks" /></Field>
                      <Field label="Severity" className="md:col-span-1"><NativeSelect value={s.severity} onChange={(v) => up("severity", v)} options={["Mild", "Moderate", "Severe"]} /></Field>
                      <Field label="Better by" className="md:col-span-3 lg:col-span-1"><Input value={s.better} onChange={(e) => up("better", e.target.value)} /></Field>
                      <Field label="Worse by" className="md:col-span-3 lg:col-span-2"><Input value={s.worse} onChange={(e) => up("worse", e.target.value)} /></Field>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {step === 1 && <ExamForm e={exam} set={setE} />}

      {step === 2 && (
        <PdfStep title="Case paper" desc="Generates a PDF with patient details, symptoms and examination. Each download is stored as a new version." onMake={() => makePdf("case_paper")} docs={docs.filter((d) => d.kind === "case_paper")} />
      )}

      {step === 3 && <RxForm rx={rx} set={setR} />}

      {step === 4 && (
        <>
          <div className="surface-card overflow-x-auto p-5">
            <h2 className="mb-3 font-bold text-primary-deep">Prescription summary</h2>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Salt</th><th>Potency</th><th>Dose</th><th>Frequency</th><th>Timing</th><th>Duration</th></tr></thead>
              <tbody className="divide-y">{rx.items.map((r, i) => <tr key={i}><td className="py-2 font-medium">{r.salt}</td><td>{r.potency}</td><td>{r.dosage}</td><td>{r.frequency}</td><td>{r.timing}</td><td>{r.duration}</td></tr>)}</tbody>
            </table>
          </div>
          <PdfStep title="Shareable prescription" desc="Creates the patient-facing prescription and marks this visit as completed." onMake={() => makePdf("prescription")} docs={docs.filter((d) => d.kind === "prescription")} />
        </>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}><ChevronLeft />Back</Button>
        {step < 4 && <Button onClick={() => go(step + 1)}>Next: {STEPS[step + 1]}<ChevronRight /></Button>}
      </div>
    </div>
  );
}

function PdfStep({ title, desc, onMake, docs }: { title: string; desc: string; onMake: () => Promise<void>; docs: { id: string; storage_path: string; created_at: string }[] }) {
  const [busy, setBusy] = useState(false);
  return (
    <Section title={title} desc={desc}>
      <Button variant="hero" size="lg" disabled={busy} onClick={async () => { setBusy(true); await onMake(); setBusy(false); }}>
        <FileDown />{busy ? "Generating…" : `Generate & download ${title.toLowerCase()}`}
      </Button>
      {docs.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Previous versions</p>
          <ul className="space-y-1.5">
            {docs.map((d, i) => (
              <li key={d.id}>
                <button className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-primary-soft" onClick={() => openDocument(d.storage_path).catch(() => toast.error("Could not open file"))}>
                  <span>Version {docs.length - i} · {new Date(d.created_at).toLocaleString("en-IN")}</span>
                  <FileDown className="h-4 w-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

function ExamForm({ e, set }: { e: Examination; set: (e: Examination) => void }) {
  const v = (k: keyof Examination["vitals"]) => ({ value: e.vitals[k], onChange: (x: React.ChangeEvent<HTMLInputElement>) => set({ ...e, vitals: { ...e.vitals, [k]: x.target.value } }) });
  const g = (k: keyof Examination["general"]) => ({ value: e.general[k], onChange: (x: React.ChangeEvent<HTMLInputElement>) => set({ ...e, general: { ...e.general, [k]: x.target.value } }) });
  const t = (k: "allergies" | "medical_history" | "surgical_history" | "current_medications" | "chronic_other" | "family_notes" | "notes") => ({ value: e[k], onChange: (x: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => set({ ...e, [k]: x.target.value }) });
  const toggleChronic = (c: string) => set({ ...e, chronic: e.chronic.includes(c) ? e.chronic.filter((x) => x !== c) : [...e.chronic, c] });
  const fam = (c: string) => e.family.find((f) => f.condition === c);
  const toggleFam = (c: string) => set({ ...e, family: fam(c) ? e.family.filter((f) => f.condition !== c) : [...e.family, { condition: c, relation: "" }] });
  const setRel = (c: string, r: string) => set({ ...e, family: e.family.map((f) => (f.condition === c ? { ...f, relation: r } : f)) });
  const l = (k: keyof Examination["lifestyle"], val: string) => set({ ...e, lifestyle: { ...e.lifestyle, [k]: val } });

  return (
    <div className="space-y-5">
      <Section title="Vitals">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Field label="BP (mmHg)"><Input {...v("bp")} placeholder="120/80" /></Field>
          <Field label="Pulse (/min)"><Input {...v("pulse")} /></Field>
          <Field label="Temp (°F)"><Input {...v("temperature")} /></Field>
          <Field label="SpO₂ (%)"><Input {...v("spo2")} /></Field>
          <Field label="Resp. rate"><Input {...v("resp")} /></Field>
        </div>
      </Section>
      <Section title="General examination" desc="Physical generals and constitution.">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Appetite"><Input {...g("appetite")} /></Field>
          <Field label="Thirst"><Input {...g("thirst")} /></Field>
          <Field label="Sleep"><Input {...g("sleep")} /></Field>
          <Field label="Bowel"><Input {...g("bowel")} /></Field>
          <Field label="Urine"><Input {...g("urine")} /></Field>
          <Field label="Perspiration"><Input {...g("perspiration")} /></Field>
          <Field label="Thermal reaction"><NativeSelect value={e.general.thermal} onChange={(x) => set({ ...e, general: { ...e.general, thermal: x } })} options={["Chilly", "Hot", "Ambithermal"]} placeholder="Select" /></Field>
          <Field label="Tongue"><Input {...g("tongue")} /></Field>
          <Field label="Skin"><Input {...g("skin")} /></Field>
          <Field label="Mental state"><Input {...g("mental")} /></Field>
          <Field label="Cravings / aversions"><Input {...g("cravings")} /></Field>
          <Field label="Menstrual history"><Input {...g("menstrual")} placeholder="If applicable" /></Field>
        </div>
      </Section>
      <Section title="Allergies & medical history">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Allergies (drug / food / other)"><Textarea rows={2} {...t("allergies")} placeholder="None known" /></Field>
          <Field label="Current medications"><Textarea rows={2} {...t("current_medications")} /></Field>
          <Field label="Past medical history"><Textarea rows={2} {...t("medical_history")} /></Field>
          <Field label="Surgical history"><Textarea rows={2} {...t("surgical_history")} /></Field>
        </div>
      </Section>
      <Section title="Chronic diseases">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {CHRONIC_DISEASES.map((c) => (
            <label key={c} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm", e.chronic.includes(c) && "border-primary bg-primary-soft")}>
              <Checkbox checked={e.chronic.includes(c)} onCheckedChange={() => toggleChronic(c)} />{c}
            </label>
          ))}
        </div>
        <Field label="Other" className="mt-3"><Input {...t("chronic_other")} /></Field>
      </Section>
      <Section title="Family health history" desc="Tick conditions and note the relation.">
        <div className="grid gap-2 md:grid-cols-2">
          {FAMILY_CONDITIONS.map((c) => (
            <div key={c} className={cn("flex items-center gap-3 rounded-md border px-3 py-2", fam(c) && "border-primary bg-primary-soft")}>
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={!!fam(c)} onCheckedChange={() => toggleFam(c)} />{c}</label>
              {fam(c) && <Input className="h-8 w-40 bg-card" placeholder="Relation" value={fam(c)!.relation} onChange={(x) => setRel(c, x.target.value)} />}
            </div>
          ))}
        </div>
        <Field label="Notes" className="mt-3"><Textarea rows={2} {...t("family_notes")} /></Field>
      </Section>
      <Section title="Lifestyle & notes">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Diet"><NativeSelect value={e.lifestyle.diet} onChange={(x) => l("diet", x)} options={["Vegetarian", "Non-vegetarian", "Eggetarian", "Vegan"]} placeholder="Select" /></Field>
          <Field label="Smoking"><NativeSelect value={e.lifestyle.smoking} onChange={(x) => l("smoking", x)} options={["No", "Occasional", "Regular", "Quit"]} /></Field>
          <Field label="Alcohol"><NativeSelect value={e.lifestyle.alcohol} onChange={(x) => l("alcohol", x)} options={["No", "Occasional", "Regular", "Quit"]} /></Field>
          <Field label="Exercise"><Input value={e.lifestyle.exercise} onChange={(x) => l("exercise", x.target.value)} /></Field>
        </div>
        <Field label="Practitioner notes" className="mt-3"><Textarea rows={3} {...t("notes")} /></Field>
      </Section>
    </div>
  );
}

function RxForm({ rx, set }: { rx: Prescription; set: (r: Prescription) => void }) {
  const selected = rx.items.map((i) => i.salt);
  const toggle = (name: string) => set({ ...rx, items: selected.includes(name) ? rx.items.filter((i) => i.salt !== name) : [...rx.items, emptyRx(name)] });
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
        <p>Selections are made solely by the practitioner based on traditional biochemic practice. The system does not suggest or auto-select salts. {DISCLAIMER.split(".")[2]}.</p>
      </div>
      <Section title="Select tissue salts" desc="Tap to add or remove.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TISSUE_SALTS.map((s) => {
            const on = selected.includes(s.name);
            return (
              <button key={s.no} onClick={() => toggle(s.name)} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary hover:bg-primary-soft")}>
                <span className={cn("font-mono text-xs", on ? "text-primary-foreground" : "text-primary")}>{String(s.no).padStart(2, "0")}</span>
                <span className="flex-1 font-medium">{s.name}</span>
                {on && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </Section>
      {rx.items.map((it, i) => {
        const up = (k: keyof typeof it, val: string) => set({ ...rx, items: rx.items.map((x, j) => (j === i ? { ...x, [k]: val } : x)) });
        return (
          <Section key={it.salt} title={it.salt} action={<Button size="icon" variant="ghost" aria-label="Remove" onClick={() => toggle(it.salt)}><Trash2 /></Button>}>
            <div className="grid gap-3 md:grid-cols-5">
              <Field label="Strength / potency"><NativeSelect value={it.potency} onChange={(v) => up("potency", v)} options={POTENCIES} /></Field>
              <Field label="Dosage"><Input value={it.dosage} onChange={(e) => up("dosage", e.target.value)} /></Field>
              <Field label="Frequency"><NativeSelect value={it.frequency} onChange={(v) => up("frequency", v)} options={FREQUENCIES} /></Field>
              <Field label="Timing"><NativeSelect value={it.timing} onChange={(v) => up("timing", v)} options={TIMINGS} /></Field>
              <Field label="Duration"><Input value={it.duration} onChange={(e) => up("duration", e.target.value)} /></Field>
              <Field label="Instructions" className="md:col-span-5"><Input value={it.instructions} onChange={(e) => up("instructions", e.target.value)} placeholder="e.g. Dissolve on tongue, avoid strong coffee for 15 min" /></Field>
            </div>
          </Section>
        );
      })}
      <Section title="General advice">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="General instructions"><Textarea rows={2} value={rx.general} onChange={(e) => set({ ...rx, general: e.target.value })} /></Field>
          <Field label="Diet & lifestyle"><Textarea rows={2} value={rx.diet} onChange={(e) => set({ ...rx, diet: e.target.value })} /></Field>
          <Field label="Follow-up"><Input value={rx.follow_up} onChange={(e) => set({ ...rx, follow_up: e.target.value })} placeholder="e.g. After 15 days" /></Field>
        </div>
      </Section>
    </div>
  );
}
