import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, Section } from "@/components/clinic/Field";
import { useI18n } from "@/lib/i18n";
import { useClinic } from "@/components/clinic/hooks";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Clinic settings — Barakshar Clinic" }, { name: "description", content: "Clinic branding for PDFs." }] }),
  component: Settings,
});

const schema = z.object({
  clinic_name: z.string().trim().min(2).max(100),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30),
  registration_no: z.string().trim().max(50),
  address: z.string().trim().max(300),
});

function Settings() {
  const { data } = useClinic();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [f, setF] = useState({ clinic_name: "", full_name: "", phone: "", registration_no: "", address: "" });
  useEffect(() => {
    if (data) setF({ clinic_name: data.clinic_name ?? "", full_name: data.full_name ?? "", phone: data.phone ?? "", registration_no: data.registration_no ?? "", address: data.address ?? "" });
  }, [data]);
  async function save() {
    const r = schema.safeParse(f);
    if (!r.success) return void toast.error(r.error.issues[0]?.message);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").upsert({ id: u.user.id, ...r.data });
    if (error) return void toast.error(error.message);
    toast.success(t("Clinic details saved"));
    qc.invalidateQueries({ queryKey: ["clinic"] });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-deep">{t("Clinic branding")}</h1>
      <Section title="Shown on every PDF" desc="Header of case papers and prescriptions.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Clinic name"><Input value={f.clinic_name} onChange={set("clinic_name")} /></Field>
          <Field label="Practitioner name"><Input value={f.full_name} onChange={set("full_name")} /></Field>
          <Field label="Contact number"><Input value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Registration no."><Input value={f.registration_no} onChange={set("registration_no")} /></Field>
          <Field label="Address" className="md:col-span-2"><Textarea rows={2} value={f.address} onChange={set("address")} /></Field>
        </div>
        <div className="mt-5 flex justify-end"><Button onClick={save}>{t("Save")}</Button></div>
      </Section>
    </div>
  );
}
