"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/about#contact' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 shadow-[0_4px_18px_rgba(0,0,0,0.04)] backdrop-blur-sm">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[0.08em] text-[var(--foreground)] transition-opacity duration-200 hover:opacity-70 sm:text-2xl">
            Earnesy
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`relative py-2 text-sm font-medium uppercase tracking-[0.12em] transition-colors duration-[180ms] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--primary)] after:transition-transform after:duration-[180ms] hover:text-[var(--primary)] hover:after:scale-x-100 ${pathname === link.href ? 'text-[var(--primary)] after:scale-x-100' : 'text-[var(--muted-foreground)]'}`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-colors duration-[180ms] hover:bg-[var(--muted)] active:scale-95 md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {!session ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/login" className="px-3 py-2 text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:text-[var(--primary)]">
                  Login
                </Link>
                <Link href="/login" className="premium-button rounded-lg uppercase tracking-[0.12em]">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors duration-180 hover:bg-[var(--muted)] active:scale-95"
                >
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                  <span>▾</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                    <div className="mb-2 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2">
                      <img src={session.user.image || '/tea.gif'} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{session.user.name}</div>
                        <div className="truncate text-xs text-slate-600">{session.user.email}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={async () => {
                          const response = await fetch('/api/profile', { method: 'GET' });
                          if (response.ok) {
                            const data = await response.json();
                            router.replace(`/${data.user?.username}`);
                            setIsDropdownOpen(false);
                          }
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                      >
                        Your Page
                      </button>

                      <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:bg-[var(--accent)] hover:text-[var(--primary)]">
                        Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-5 md:hidden">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                >
                  {link.label}
                </Link>
              ))}

              {!session ? (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)] transition-colors duration-[180ms] hover:bg-[var(--accent)] hover:text-[var(--primary)]">
                    Login
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="premium-button mt-2 w-full rounded-lg uppercase tracking-[0.12em]">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      const response = await fetch('/api/profile', { method: 'GET' });
                      if (response.ok) {
                        const data = await response.json();
                        router.replace(`/${data.user?.username}`);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm uppercase tracking-[0.12em] text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                  >
                    Your Page
                  </button>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm uppercase tracking-[0.12em] text-slate-700 hover:bg-amber-50 hover:text-amber-700">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm uppercase tracking-[0.12em] text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;