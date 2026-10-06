import { useI18n } from "@/lib/i18n";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return status === "completed"
    ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">{t("Completed")}</span>
    : <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">{t("Draft")}</span>;
}
