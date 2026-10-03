import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/clinic/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Barakshar Clinic" },
      { name: "description", content: "Practitioner sign in for Barakshar Clinic patient records." },
      { property: "og:title", content: "Sign in — Barakshar Clinic" },
      { property: "og:description", content: "Practitioner sign in for patient records." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  name: z.string().trim().max(100).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: r.data.email, password: r.data.password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: r.data.name } },
      });
      if (error) toast.error(error.message); else setSent(true);
    }
    setBusy(false);
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <div className="surface-card w-full max-w-md p-7">
        <Logo />
        {sent ? (
          <div className="mt-8">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to {form.email}. Open it to activate your account.</p>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create practitioner account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Patient records are visible only to your account.</p>
            <Button variant="outline" className="mt-6 w-full" onClick={google} type="button">Continue with Google</Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "up" && (
                <div className="space-y-1.5"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Aniket Nagarkar" /></div>
              )}
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <Button className="w-full" disabled={busy} type="submit">{mode === "in" ? "Sign in" : "Create account"}</Button>
            </form>
            <button className="mt-5 w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
