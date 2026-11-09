import { getCurrentUser } from '@/lib/auth/server'
import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Coffee,
  UsersRound,
  Compass,
  CheckCircle2,
  Lock,
  MessageSquare,
  Zap,
  ShieldCheck,
  Heart,
  Crown,
  Send,
} from 'lucide-react'
import ClaimUsernameBar from '@/components/ClaimUsernameBar'
import FaqAccordion from '@/components/FaqAccordion'
import mongoose from 'mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) return
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

async function getFeaturedCreators() {
  try {
    await ensureDb()
    if (mongoose.connection.readyState !== 1) return []

    const users = await User.find({
      username: { $exists: true, $ne: '' },
    })
      .select('name username title bio category profileUrl coverUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    if (!users || users.length === 0) return []

    const usernames = users.map((u) => u.username.toLowerCase())
    const payments = await Payment.aggregate([
      { $match: { to_user: { $in: usernames }, done: true } },
      { $group: { _id: '$to_user', count: { $sum: 1 } } },
    ])

    const countsMap = new Map(payments.map((p) => [p._id, p.count]))

    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name || u.username,
      username: u.username,
      title: u.title || '',
      category: u.category || '',
      bio: u.bio || '',
      profileUrl: u.profileUrl || '',
      coverUrl: u.coverUrl || '',
      supportersCount: countsMap.get(u.username.toLowerCase()) || 0,
    }))
  } catch (error) {
    console.error('Featured creators fetch fallback:', error)
    return []
  }
}

export default async function Home() {
  const [currentUser, featuredCreators] = await Promise.all([
    getCurrentUser().catch(() => null),
    getFeaturedCreators(),
  ])

  let startHref = '/login'
  if (currentUser?.username) {
    startHref = `/${currentUser.username}`
  }

  return (
    <main className="bg-[#f4ecef5c] min-h-screen text-[var(--foreground)]">
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Creators primary, Supporters secondary) */}
      {/* ========================================================= */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-16 sm:pt-24 sm:pb-24 text-center">
        <div className="max-w-3xl space-y-5">
          {/* Tag Pill */}
          <div className="inline-flex items-center justify-center gap-2 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-full shadow-xs">
            <img src="/tea.gif" width={22} height={22} alt="Tea" className="inline-block" />
            <span className="text-xs sm:text-sm font-bold text-amber-900 tracking-tight">
              Where Creators Build Sustainable Work & Fans Connect
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
            Turn Your Creative Passion Into <span className="text-[var(--primary)]">Direct Income</span>
          </h1>

          {/* Subtitle speaking to both */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Accept direct tips, launch monthly memberships, and automate Discord VIP roles with 0% platform take. Fans unlock exclusive content and join private creator communities.
          </p>

          {/* Interactive Claim Username Box */}
          <div className="pt-3">
            <ClaimUsernameBar currentUsername={currentUser?.username} />
          </div>

          {/* Secondary Discovery Pill */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[var(--primary)] px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 hover:bg-white shadow-xs transition"
            >
              <Compass size={15} className="text-[var(--primary)]" />
              <span>Explore & Support Creators</span>
            </Link>

            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100/70 transition"
            >
              <span>Learn how it works</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PLATFORM TRUST & METRICS STRIP */}
      {/* ========================================================= */}
      <section className="border-y border-slate-200/80 bg-white/80 py-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-black text-slate-900">100% Direct</p>
            <p className="text-xs text-slate-500 font-medium">Payouts via UPI & Cards</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-black text-[var(--primary)]">Monthly Tiers</p>
            <p className="text-xs text-slate-500 font-medium">Predictable recurring income</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-black text-indigo-600">Discord Sync</p>
            <p className="text-xs text-slate-500 font-medium">Automated VIP backer roles</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-black text-slate-900">0 Algorithms</p>
            <p className="text-xs text-slate-500 font-medium">You own 100% of your audience</p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. P2: VISUAL FEATURE SHOWCASE CARDS (Product Deep-Dive) */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              <Zap size={13} />
              <span>Built for Creators & Their Supporters</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Everything You Need to Monetize & Grow
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A streamlined toolkit crafted to make supporting as effortless as buying a cup of coffee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Feature 1: Direct Coffees & Instant Tips */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Coffee size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Instant One-Time Tips & Coffees
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Creators:</strong> Receive direct deposits straight to your account with zero platform delay. Keep 100% of what supporters tip.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Supporters:</strong> Support your favorite creator in under 15 seconds via Google Pay, PhonePe, Paytm, or Cards with heartfelt cheer messages.
                  </p>
                </div>
              </div>

              {/* Visual Mockup 1 */}
              <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Coffee size={14} className="text-amber-500" />
                    <span>Support Akash with a coffee</span>
                  </span>
                  <span className="text-[var(--primary)] font-extrabold">₹150</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700">₹50</div>
                  <div className="flex-1 py-1.5 text-center text-xs font-bold rounded-lg bg-[var(--primary)] text-white shadow-xs">₹150 ☕</div>
                  <div className="flex-1 py-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700">₹500</div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-slate-200 text-[11px] text-slate-600 italic">
                  &ldquo;Love your coding tutorials! Keep building awesome stuff 🔥 - Rahul&rdquo;
                </div>
              </div>
            </div>

            {/* Feature 2: Monthly Membership Tiers */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Crown size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Monthly Membership Tiers & Locked Content
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Creators:</strong> Establish predictable recurring monthly income by offering customized tiers with exclusive perks and members-only posts.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Supporters:</strong> Get backstage access, early drafts, project source code, and exclusive member updates.
                  </p>
                </div>
              </div>

              {/* Visual Mockup 2 */}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-purple-50/60 to-slate-50 border border-purple-100 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Crown size={14} className="text-purple-600" />
                    <span>💎 VIP Backer Tier</span>
                  </span>
                  <span className="text-xs font-black text-slate-900">₹299<span className="text-[10px] text-slate-500 font-normal">/mo</span></span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Unlock exclusive behind-the-scenes posts & source files</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>VIP Member badge on all post discussions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Auto-assigned Discord VIP role in creator server</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Automated Discord VIP Roles */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#5865F2] border border-indigo-100">
                  <Zap size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Automated Discord VIP Roles
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Creators:</strong> Link your server once. When fans join a tier, the Earnesy bot assigns backer roles in your server with zero manual admin work.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Supporters:</strong> Gain instant VIP role colors, private channel access, and community recognition the moment payment completes.
                  </p>
                </div>
              </div>

              {/* Visual Mockup 3 */}
              <div className="mt-8 rounded-2xl bg-[#2b2d31] text-white p-4 space-y-2 text-xs font-sans">
                <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2">
                  <div className="h-6 w-6 rounded-full bg-[#5865F2] flex items-center justify-center text-[10px] font-bold">
                    E
                  </div>
                  <span className="font-bold text-[#f2f3f5]">Earnesy Bot</span>
                  <span className="rounded bg-[#5865F2] px-1 py-0.2 text-[9px] font-bold uppercase">BOT</span>
                  <span className="text-[10px] text-slate-400">Today at 2:30 PM</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  🎉 Welcome <span className="text-[#5865F2] font-semibold">@Alex</span>! Your support has been verified. You now have the <span className="bg-[#5865F2]/30 text-indigo-300 px-1.5 py-0.5 rounded font-bold">💎 VIP Backer</span> role and access to <span className="text-slate-200 font-medium">#vip-lounge</span>.
                </p>
              </div>
            </div>

            {/* Feature 4: Verified Community Discussions */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[var(--primary)] border border-rose-100">
                  <MessageSquare size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Verified Community Discussions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Creators:</strong> Converse directly with your backers under your updates without algorithmic censorship or noisy spam.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">For Supporters:</strong> Stand out in comment threads with official <span className="text-amber-800 font-bold">👑 Creator</span>, <span className="text-purple-800 font-bold">💎 VIP Member</span>, and <span className="text-orange-800 font-bold">☕ Supporter</span> badges.
                  </p>
                </div>
              </div>

              {/* Visual Mockup 4 */}
              <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">A</div>
                  <span className="text-xs font-bold text-slate-900">Akash</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">👑 Creator</span>
                  <span className="text-[10px] text-slate-400 ml-auto">2h ago</span>
                </div>
                <p className="text-[11px] text-slate-700 pl-8">
                  &ldquo;Exclusive preview for members is live above. Thank you all for the love!&rdquo;
                </p>
                <div className="ml-6 pl-3 border-l-2 border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-purple-700 text-white font-bold text-[9px] flex items-center justify-center">S</div>
                    <span className="text-[11px] font-bold text-slate-900">Siddharth</span>
                    <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800">💎 VIP</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-7">&ldquo;Awesome breakdown! The code samples saved my project.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. DUAL VALUE PROPOSITIONS (Creators vs Supporters) */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 px-4 bg-white/70 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              A Platform Built For Both Sides of the Creative Economy
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
              Whether you are sharing your work or enjoying someone else&apos;s, Earnesy makes the connection seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: For Creators */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-7 sm:p-9 space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  👑 For Creators
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Build Sustainable Creative Independence
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You bring the talent and content. Earnesy provides the monetization rails and automated fan management.
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span><strong>Claim your custom URL:</strong> A clean personal page you can put in your Instagram, YouTube, or GitHub bio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span><strong>Zero platform middleman:</strong> Direct UPI & card payments straight to your connected account.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span><strong>Automated community perks:</strong> Discord roles automatically granted and revoked with membership status.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span><strong>Selective visibility:</strong> Publish public posts or lock premium updates for active members.</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href={startHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:opacity-90 transition active:scale-95"
                >
                  <span>Start Creating Free</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right: For Fans & Supporters */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 space-y-6 shadow-xs">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  ☕ For Fans & Supporters
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Directly Support the People Who Inspire You
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Support your favorite artists, developers, and educators without complicated subscriptions or ads.
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Fast & seamless checkout:</strong> Tip with Google Pay, PhonePe, UPI, or Card in 15 seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Exclusive backstage perks:</strong> Unlock members-only tutorial series, early code drafts, and assets.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>VIP Discord recognition:</strong> Automatic private channel access and colored server roles.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Unified membership hub:</strong> Manage all your active creator memberships in one simple tab.</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
                >
                  <Compass size={15} />
                  <span>Discover Creators to Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FEATURED CREATORS SHOWCASE GRID */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
                <Sparkles size={14} />
                <span>Featured Creators</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Meet Creators Building on Earnesy
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
                Explore independent coders, artists, educators, and makers receiving direct support from their audience.
              </p>
            </div>

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary)] hover:underline self-start sm:self-auto shrink-0"
            >
              <span>Browse All Directory</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {featuredCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {featuredCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-[var(--primary)]/40 hover:shadow-md"
                >
                  <div>
                    {/* Cover banner */}
                    <div className="relative h-24 w-full bg-gradient-to-r from-pink-100 via-rose-50 to-amber-100 overflow-hidden">
                      {creator.coverUrl && (
                        <img
                          src={creator.coverUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Profile Avatar & Info */}
                    <div className="px-5 pb-4">
                      <div className="-mt-9 mb-3 flex items-end justify-between">
                        {creator.profileUrl ? (
                          <img
                            src={creator.profileUrl}
                            alt={creator.name}
                            className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-sm bg-white"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-lg font-bold text-white shadow-sm">
                            {creator.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                        )}

                        {creator.category && (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] border border-rose-100">
                            {creator.category}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                          {creator.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500">
                          @{creator.username}
                        </p>

                        {creator.bio ? (
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                            {creator.bio}
                          </p>
                        ) : creator.title ? (
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                            {creator.title}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400 italic">
                            Creating and sharing work with their community.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Supporter count & Link */}
                  <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/50">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <Coffee size={14} className="text-amber-500" />
                      <span>{creator.supportersCount} {creator.supportersCount === 1 ? 'supporter' : 'supporters'}</span>
                    </span>

                    <Link
                      href={`/${encodeURIComponent(creator.username)}`}
                      className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
                    >
                      <span>Visit Page</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 bg-white space-y-3">
              <Sparkles size={28} className="mx-auto text-[var(--primary)]" />
              <p className="font-bold text-slate-800 text-base">Be Among the First Creators on Earnesy</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Claim your link today, customize your profile, and start accepting direct coffees and memberships in minutes.
              </p>
              <div className="pt-2">
                <Link
                  href={startHref}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition"
                >
                  <span>Start Your Creator Page</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HOW IT WORKS IN 3 SIMPLE STEPS */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 px-4 bg-white/60 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              ⚡ Effortless Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Start Earning in 3 Simple Steps
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              From zero to receiving direct support and monthly memberships in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-3 relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black text-rose-100 absolute top-4 right-5 select-none">
                01
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[var(--primary)] font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Claim Your Page & Link UPI</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Choose your custom handle, add your bio, and input your Razorpay credentials in your dashboard. Zero setup fee, zero paperwork.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-3 relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black text-amber-100 absolute top-4 right-5 select-none">
                02
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Share With Your Community</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Add your personal Earnesy link to your YouTube video descriptions, Instagram bio, Twitter, GitHub, or live stream overlays.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-3 relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black text-purple-100 absolute top-4 right-5 select-none">
                03
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Get Direct Payouts & Perks</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Funds settle straight to your bank with 0% platform take. Fans get instant Discord VIP roles, backer badges, and exclusive content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (Interactive Accordion) */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
              Answers to common questions from creators setting up their pages and supporters backing their work.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. CALL TO ACTION BANNER (Bottom) */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-transparent to-white">
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 text-white p-8 sm:p-14 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--primary)]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-rose-300 border border-white/10">
              <Sparkles size={14} />
              <span>Ready to Get Started?</span>
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Build Your Creator Future on Earnesy
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Whether you are an artist ready to receive tips or a supporter looking to join exclusive creator clubs, Earnesy is your creative home.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={startHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
              >
                <span>Claim Your Page in 60s</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold transition active:scale-95"
              >
                <Compass size={16} />
                <span>Explore Creators</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
