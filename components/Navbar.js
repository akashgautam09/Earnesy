"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

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
      <nav className="sticky top-0 z-50 border-b border-[#F5F1E8]/10 bg-[#171717]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-[0.08em] text-[#F5F1E8] transition-opacity hover:opacity-80 sm:text-lg">
            GET ME A KOFI
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/72 transition-colors hover:text-[#F4C542]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#F5F1E8]/10 text-[#F5F1E8] md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {!session ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/login" className="px-3 py-2 text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 transition-colors hover:text-[#F4C542]">
                  Login
                </Link>
                <Link href="/login" className="premium-button rounded-md px-4 py-2 text-sm uppercase tracking-[0.12em]">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-md border border-[#F5F1E8]/12 bg-[#1F1F1F] px-3 py-2 text-sm text-[#F5F1E8]"
                >
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                  <span className="text-[#F4C542]">▾</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-md border border-[#F5F1E8]/12 bg-[#1D1D1D] p-2 shadow-lg">
                    <div className="mb-2 flex items-center gap-3 rounded-md border border-[#F5F1E8]/10 bg-[#171717] p-2">
                      <img src={session.user.image || '/tea.gif'} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#F5F1E8]">{session.user.name}</div>
                        <div className="truncate text-xs text-[#F5F1E8]/56">{session.user.email}</div>
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
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#F5F1E8]/78 hover:bg-[#171717] hover:text-[#F4C542]"
                      >
                        Your Page
                      </button>

                      <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm text-[#F5F1E8]/78 hover:bg-[#171717] hover:text-[#F4C542]">
                        Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut();
                        }}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#F5F1E8]/78 hover:bg-[#171717] hover:text-[#F4C542]"
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
          <div className="border-t border-[#F5F1E8]/10 bg-[#171717] px-4 py-4 md:hidden">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 hover:bg-[#1F1F1F] hover:text-[#F4C542]"
                >
                  {link.label}
                </Link>
              ))}

              {!session ? (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 hover:bg-[#1F1F1F] hover:text-[#F4C542]">
                    Login
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="premium-button mt-2 w-full rounded-md px-4 py-2 text-sm uppercase tracking-[0.12em]">
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
                    className="block w-full rounded-md px-3 py-2 text-left text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 hover:bg-[#1F1F1F] hover:text-[#F4C542]"
                  >
                    Your Page
                  </button>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 hover:bg-[#1F1F1F] hover:text-[#F4C542]">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm uppercase tracking-[0.12em] text-[#F5F1E8]/78 hover:bg-[#1F1F1F] hover:text-[#F4C542]"
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