export default function AppStatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(25,25,25,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
        <Icon size={18} strokeWidth={1.8} className="text-[var(--primary)]" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p>}
    </div>
  )
}
