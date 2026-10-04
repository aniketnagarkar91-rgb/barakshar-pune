export function StatusBadge({ status }: { status: string }) {
  return status === "completed"
    ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">Completed</span>
    : <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">Draft</span>;
}
