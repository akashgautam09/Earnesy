'use client'

import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'Do I need a registered business or GST to start earning on Earnesy?',
    a: 'No! You can register as an individual creator. All you need is an individual Razorpay account linked to your bank or UPI ID. There are no business registration or GST requirements to start accepting support.',
  },
  {
    q: 'How do payouts work, and does Earnesy take a commission fee?',
    a: 'Earnesy charges 0% platform commission on your earnings. When a supporter buys a coffee or joins a tier, the payment is processed directly into your own connected Razorpay merchant account and auto-settled straight to your bank account (standard T+2 days). Earnesy never holds your funds.',
  },
  {
    q: 'How does the automated Discord VIP bot work?',
    a: 'You simply invite the Earnesy Discord bot to your community server and enter your Discord Server ID and Role ID in your creator dashboard. When a supporter subscribes to a tier that includes Discord perks, our bot instantly grants them the VIP role and access to your private channels.',
  },
  {
    q: 'Can supporters pay easily without a complicated setup?',
    a: 'Yes! Supporters can tip you in less than 15 seconds using Google Pay, PhonePe, Paytm, BHIM UPI, NetBanking, or Credit/Debit Cards. It is as quick and frictionless as buying a real coffee.',
  },
  {
    q: 'Can I publish exclusive content only for paying members?',
    a: 'Yes. Every time you publish a post or tutorial, you can set its visibility to either "Public" or "Members Only". Non-members will see a locked preview and a prompt to join your tier to read the full content.',
  },
  {
    q: 'Can I use Earnesy both as a creator and as a supporter?',
    a: 'Absolutely! Every Earnesy account can support other creators, join tiers, leave comments with verified badges, and track active memberships at /my-memberships — while also having the option to set up their own creator page anytime.',
  },
]

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(null)

  const toggle = (idx) => {
    setOpenIdx((current) => (current === idx ? null : idx))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIdx === idx
        return (
          <div
            key={idx}
            className={`rounded-2xl border transition-all ${
              isOpen
                ? 'border-[var(--primary)]/40 bg-white shadow-sm'
                : 'border-slate-200 bg-white/80 hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 text-left gap-4"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                {item.q}
              </span>
              <span
                className={`p-1.5 rounded-full transition-transform duration-200 shrink-0 ${
                  isOpen
                    ? 'rotate-180 bg-rose-50 text-[var(--primary)]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ChevronDown size={16} />
              </span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
