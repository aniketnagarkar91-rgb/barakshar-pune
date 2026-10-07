import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "./Field";
import { bmi } from "@/lib/clinic";
import { useI18n } from "@/lib/i18n";

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  age: z.coerce.number().int().min(0, "Invalid age").max(130, "Invalid age"),
  gender: z.string().min(1, "Select gender"),
  height_cm: z.union([z.literal(""), z.coerce.number().min(30).max(260)]).optional(),
  weight_kg: z.union([z.literal(""), z.coerce.number().min(1).max(400)]).optional(),
  mobile: z.string().trim().regex(/^[+\d][\d\s-]{6,15}$/, "Enter a valid mobile number"),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  address: z.string().trim().max(500),
});

export type PatientInput = { name: string; age: string; gender: string; height_cm: string; weight_kg: string; mobile: string; email: string; address: string };
export const emptyPatient = (): PatientInput => ({ name: "", age: "", gender: "", height_cm: "", weight_kg: "", mobile: "", email: "", address: "" });

export function toPatientRow(v: PatientInput) {
  const r = patientSchema.parse(v);
  return {
    name: r.name, age: r.age, gender: r.gender,
    height_cm: r.height_cm === "" || r.height_cm === undefined ? null : r.height_cm,
    weight_kg: r.weight_kg === "" || r.weight_kg === undefined ? null : r.weight_kg,
    mobile: r.mobile, email: r.email || null, address: r.address || null,
  };
}

export function validatePatient(v: PatientInput) {
  const r = patientSchema.safeParse(v);
  if (r.success) return {};
  const errs: Record<string, string> = {};
  r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
  return errs;
}

export function PatientForm({ value, onChange, errors = {} }: { value: PatientInput; onChange: (v: PatientInput) => void; errors?: Partial<Record<keyof PatientInput, string>> }) {
  const set = (k: keyof PatientInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value });
  const { t } = useI18n();
  const b = bmi(Number(value.height_cm), Number(value.weight_kg));
  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Field label="Full name *" className="md:col-span-3" error={errors.name}><Input value={value.name} onChange={set("name")} /></Field>
      <Field label="Age *" className="md:col-span-1" error={errors.age}><Input inputMode="numeric" value={value.age} onChange={set("age")} /></Field>
      <Field label="Gender *" className="md:col-span-2" error={errors.gender}>
        <NativeSelect value={value.gender} onChange={(g) => onChange({ ...value, gender: g })} options={["Male", "Female", "Other"]} placeholder="Select" />
      </Field>
      <Field label="Height (cm)" className="md:col-span-2" error={errors.height_cm}><Input inputMode="decimal" value={value.height_cm} onChange={set("height_cm")} /></Field>
      <Field label="Weight (kg)" className="md:col-span-2" error={errors.weight_kg}><Input inputMode="decimal" value={value.weight_kg} onChange={set("weight_kg")} /></Field>
      <Field label="BMI" className="md:col-span-2"><div className="flex h-10 items-center rounded-md bg-primary-soft px-3 font-mono text-sm text-primary-deep">{b ?? "—"}</div></Field>
      <Field label="Mobile *" className="md:col-span-3" error={errors.mobile}><Input inputMode="tel" value={value.mobile} onChange={set("mobile")} /></Field>
      <Field label="Email" className="md:col-span-3" error={errors.email}><Input type="email" value={value.email} onChange={set("email")} /></Field>
      <Field label="Address" className="md:col-span-6" error={errors.address}><Textarea rows={2} value={value.address} onChange={set("address")} /></Field>
    </div>
  );
}

export function usePatientState(init?: PatientInput) {
  return useState<PatientInput>(init ?? emptyPatient());
}
