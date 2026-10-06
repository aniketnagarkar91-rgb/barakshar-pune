import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function Field({ label, children, className, error, hint }: { label: string; children: ReactNode; className?: string | undefined; error?: string | undefined; hint?: string | undefined }) {
  const { t } = useI18n();
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(label)}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{t(error)}</p> : hint ? <p className="text-xs text-muted-foreground">{t(hint)}</p> : null}
    </div>
  );
}

export function Section({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="surface-card p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary-deep">{t(title)}</h2>
          {desc && <p className="mt-0.5 text-sm text-muted-foreground">{t(desc)}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NativeSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  const { t } = useI18n();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {placeholder !== undefined && <option value="">{t(placeholder)}</option>}
      {options.map((o) => <option key={o} value={o}>{t(o)}</option>)}
    </select>
  );
}
