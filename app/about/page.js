import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, CreditCard, LayoutTemplate, ShieldCheck } from 'lucide-react'

const principles = [
  {
    icon: LayoutTemplate,
    title: 'A clear public page',
    description: 'Creators get one focused place for their story, work, and support options.',
  },
  {
    icon: CreditCard,
    title: 'Direct payments',
    description: 'Supporters can contribute through a simple checkout without a complicated funnel.',
  },
  {
    icon: ShieldCheck,
    title: 'Built around trust',
    description: 'Creator ownership, payment records, and account security stay explicit at every step.',
  },
]

const steps = [
  ['01', 'Set up your profile', 'Add your name, username, images, and payment details from the dashboard.'],
  ['02', 'Share your page', 'Use your public link wherever your audience already follows your work.'],
  ['03', 'Keep creating', 'Receive support directly and use the momentum to keep your next idea moving.'],
]

export default function AboutPage() {
  return (
    <main className="bg-[var(--background)] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">About Earnesy</p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
              The direct support layer for independent work.
            </h1>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
              Earnesy gives creators a focused public page and a straightforward way for people to fund the work they value.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                Create your page <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]">
                See how it works
              </a>
            </div>
          </div>
        </header>

        <section className="grid border-b border-[var(--border)] py-8 sm:grid-cols-3 sm:divide-x sm:divide-[var(--border)]">
          <div className="pb-5 sm:px-6 sm:py-1 first:sm:pl-0 last:sm:pr-0"><p className="text-2xl font-semibold text-[var(--foreground)]">01</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Public creator page</p></div>
          <div className="border-t border-[var(--border)] py-5 sm:border-t-0 sm:px-6 sm:py-1"><p className="text-2xl font-semibold text-[var(--foreground)]">Direct</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Support from your audience</p></div>
          <div className="border-t border-[var(--border)] pt-5 sm:border-t-0 sm:px-6 sm:py-1"><p className="text-2xl font-semibold text-[var(--foreground)]">Secure</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Payments through Razorpay</p></div>
        </section>

        <section className="grid gap-10 border-b border-[var(--border)] py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Why it exists</p>
            <h2 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">Good work should not need a complicated business model.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--muted-foreground)]">
              Many independent creators build before they have a sponsor, grant, or large audience. Earnesy keeps the support path short: one profile, one link, and a payment flow that gets out of the way.
            </p>
          </div>
          <figure className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
            <Image src="/EC.jpg" alt="Creator and supporter collaboration" width={1200} height={720} className="h-64 w-full object-cover sm:h-80" />
            <figcaption className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">A simpler way to make independent work sustainable.</figcaption>
          </figure>
        </section>

        <section className="border-b border-[var(--border)] py-12 lg:py-16">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">The product</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">Everything stays focused on the relationship.</h2>
          </div>
          <div className="mt-8 grid divide-y divide-[var(--border)] border-y border-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {principles.map(({ icon: Icon, title, description }) => (
              <article key={title} className="px-0 py-5 md:px-6 md:py-6 first:md:pl-0 last:md:pr-0">
                <Icon size={20} strokeWidth={1.8} className="text-[var(--primary)]" />
                <h3 className="mt-5 text-base font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="grid gap-10 border-b border-[var(--border)] py-12 lg:grid-cols-[0.75fr_1.25fr] lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">How it works</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">A small workflow with a clear outcome.</h2>
          </div>
          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {steps.map(([number, title, description]) => (
              <div key={number} className="grid gap-3 py-5 sm:grid-cols-[3rem_0.7fr_1fr] sm:items-start sm:gap-5">
                <span className="text-xs font-semibold tracking-[0.16em] text-[var(--primary)]">{number}</span>
                <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="flex flex-col justify-between gap-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Questions?</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Talk to the Earnesy team.</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">We are building for creators and supporters who prefer a direct path.</p>
          </div>
          <a href="mailto:akashgautam.tech@gmail.com" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
            Get in touch <ArrowRight size={16} />
          </a>
        </section>
      </div>
    </main>
  )
}
