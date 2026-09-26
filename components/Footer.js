import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-[var(--border)] bg-[var(--muted)]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-[var(--border)] pb-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary)]">Earnesy</p>
            <h3 className="max-w-md text-2xl font-semibold leading-tight text-[var(--foreground)] sm:text-3xl">
              Support the work you believe in.
            </h3>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Product</p>
            <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <li><Link href="/about" className="transition-colors duration-[180ms] hover:text-[var(--primary)]">About</Link></li>
              <li><Link href="/" className="transition-colors duration-[180ms] hover:text-[var(--primary)]">Home</Link></li>
              <li><Link href="/login" className="transition-colors duration-[180ms] hover:text-[var(--primary)]">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Contact</p>
            <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <li>hello@getmeakofi.com</li>
              <li>+91 98765 43210</li>
              <li className="text-[var(--primary)]">Support</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Earnesy. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors duration-[180ms] hover:text-[var(--primary)]">Privacy</Link>
            <Link href="/terms" className="transition-colors duration-[180ms] hover:text-[var(--primary)]">Terms</Link>
            <span className="cursor-default transition-colors duration-[180ms] hover:text-[var(--primary)]">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;