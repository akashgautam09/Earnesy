import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-[#f7f3ea]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-slate-200 pb-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-amber-700">Earnesy</p>
            <h3 className="max-w-md text-2xl font-medium text-slate-900 sm:text-3xl">
              Support the work you believe in.
            </h3>
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-slate-600">Product</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><Link href="/about" className="hover:text-amber-700">About</Link></li>
              <li><Link href="/" className="hover:text-amber-700">Home</Link></li>
              <li><Link href="/login" className="hover:text-amber-700">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-slate-600">Contact</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>hello@getmeakofi.com</li>
              <li>+91 98765 43210</li>
              <li className="text-amber-700">Support</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Earnesy. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-amber-700">Privacy</Link>
            <Link href="/terms" className="hover:text-amber-700">Terms</Link>
            <span className="hover:text-amber-700 cursor-default">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;