import { Languages } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const opts: { v: Lang; label: string }[] = [{ v: "en", label: "English" }, { v: "mr", label: "मराठी" }];
  return (
    <div role="group" aria-label={t("Language")} className="inline-flex items-center gap-1 rounded-full border bg-card p-1 text-xs font-medium">
      <Languages className="ml-1 h-3.5 w-3.5 text-primary" />
      {opts.map((o) => (
        <button key={o.v} type="button" aria-pressed={lang === o.v} onClick={() => setLang(o.v)}
          className={cn("rounded-full px-2.5 py-1 transition", lang === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary-deep")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
