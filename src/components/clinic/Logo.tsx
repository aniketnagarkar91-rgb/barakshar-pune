import { useI18n } from "@/lib/i18n";

export function Logo({ name = "Barakshar Clinic" }: { name?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-bold text-primary-deep">{name}</p>
        <p className="text-[11px] text-muted-foreground">{t("Biochemic · 12 Tissue Salts")}</p>
      </div>
    </div>
  );
}
