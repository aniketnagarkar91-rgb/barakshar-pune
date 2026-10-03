import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, Users, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/clinic/Logo";
import { TISSUE_SALTS, DISCLAIMER } from "@/lib/clinic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barakshar Clinic — Biochemic Patient Records" },
      { name: "description", content: "Register patients, record examinations and issue 12 tissue salt prescriptions as shareable PDFs." },
      { property: "og:title", content: "Barakshar Clinic — Biochemic Patient Records" },
      { property: "og:description", content: "Secure case papers and tissue salt prescriptions for biochemic practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Button asChild variant="outline"><Link to="/auth">Practitioner sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-primary-deep shadow-[var(--shadow-card)]">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Private, per-practitioner records
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-primary-deep md:text-6xl">
              Biochemic case papers, done in five calm steps.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Register the patient, examine, download the case paper, set the tissue-salt dosage and share the prescription — with every visit kept.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero"><Link to="/auth">Open the clinic</Link></Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm">
              {[{ i: Users, t: "Patient profiles" }, { i: FileText, t: "Versioned PDFs" }, { i: Pill, t: "12 tissue salts" }].map(({ i: I, t }) => (
                <div key={t} className="surface-card p-3"><I className="mb-2 h-5 w-5 text-primary" /><span className="font-medium">{t}</span></div>
              ))}
            </div>
          </div>
          <div className="surface-card grid-lines p-5">
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-primary">The 12 tissue salts</p>
            <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {TISSUE_SALTS.map((s) => (
                <li key={s.no} className="flex items-center gap-3 rounded-lg bg-card px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-primary">{String(s.no).padStart(2, "0")}</span>
                  <span className="font-medium">{s.name}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-16 max-w-3xl text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
      </main>
    </div>
  );
}
