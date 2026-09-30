export default function AppPageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </div>
      {action}
    </header>
  )
}
