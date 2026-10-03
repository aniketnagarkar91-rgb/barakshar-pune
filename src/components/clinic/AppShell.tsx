import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, UserPlus, Settings, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useClinic } from "./hooks";
import { DISCLAIMER } from "@/lib/clinic";

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: clinic } = useClinic();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const nav = [
    { to: "/dashboard", label: "Patients", icon: LayoutDashboard },
    { to: "/patients/new", label: "New patient", icon: UserPlus },
    { to: "/settings", label: "Clinic", icon: Settings },
  ] as const;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard"><Logo name={clinic?.clinic_name || "Barakshar Clinic"} /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary-deep" activeProps={{ className: "bg-primary-soft text-primary-deep" }}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut />Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-24 text-[11px] leading-relaxed text-muted-foreground md:pb-8">{DISCLAIMER}</footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
