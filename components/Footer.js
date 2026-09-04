import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-[#F5F1E8]/10 bg-[#171717]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-[#F5F1E8]/10 pb-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[#F4C542]">Get Me A Kofi</p>
            <h3 className="max-w-md text-2xl font-medium text-[#F5F1E8] sm:text-3xl">
              Support the work you believe in.
            </h3>
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[#F5F1E8]/56">Product</p>
            <ul className="space-y-2 text-sm text-[#F5F1E8]/72">
              <li><Link href="/about" className="hover:text-[#F4C542]">About</Link></li>
              <li><Link href="/" className="hover:text-[#F4C542]">Home</Link></li>
              <li><Link href="/login" className="hover:text-[#F4C542]">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[#F5F1E8]/56">Contact</p>
            <ul className="space-y-2 text-sm text-[#F5F1E8]/72">
              <li>hello@getmeakofi.com</li>
              <li>+91 98765 43210</li>
              <li className="text-[#F4C542]">Support</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-[#F5F1E8]/56 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Get Me A Kofi. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;