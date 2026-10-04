import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserPlus, ChevronRight, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Patients — Barakshar Clinic" }, { name: "description", content: "Search patients and recent visits." }] }),
  component: Dashboard,
});

function Dashboard() {
  const [q, setQ] = useState("");
  const patients = useQuery({
    queryKey: ["patients", q],
    queryFn: async () => {
      let qb = supabase.from("patients").select("id,name,age,gender,mobile,created_at").order("updated_at", { ascending: false }).limit(50);
      const t = q.trim().replace(/[%,()]/g, "");
      if (t) qb = qb.or(`name.ilike.%${t}%,mobile.ilike.%${t}%,email.ilike.%${t}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data;
    },
  });
  const recent = useQuery({
    queryKey: ["recent-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("visits").select("id,visit_date,status,patients(name)").order("updated_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-deep">Patients</h1>
          <p className="text-sm text-muted-foreground">Search by name, mobile or email.</p>
        </div>
        <Button asChild variant="hero"><Link to="/patients/new"><UserPlus />New patient</Link></Button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 bg-card pl-10 text-base" placeholder="Search patients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface-card divide-y overflow-hidden">
          {patients.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading…</p>}
          {patients.data?.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium">No patients found</p>
              <p className="mt-1 text-sm text-muted-foreground">Register your first patient to begin.</p>
            </div>
          )}
          {patients.data?.map((p) => (
            <Link key={p.id} to="/patients/$patientId" params={{ patientId: p.id }} className="flex items-center gap-4 px-5 py-4 hover:bg-primary-soft/60">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display font-bold text-primary-deep">{p.name.charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{[p.age && `${p.age} yrs`, p.gender, p.mobile].filter(Boolean).join(" · ")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <aside className="surface-card h-fit p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-primary-deep"><ClipboardList className="h-4 w-4" />Recent visits</h2>
          <ul className="space-y-2">
            {recent.data?.length === 0 && <li className="text-sm text-muted-foreground">No visits yet.</li>}
            {recent.data?.map((v) => (
              <li key={v.id}>
                <Link to="/visits/$visitId" params={{ visitId: v.id }} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-primary-soft">
                  <span className="truncate">{(v.patients as { name: string } | null)?.name}</span>
                  <StatusBadge status={v.status} />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
