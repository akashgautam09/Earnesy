import Image from "next/image";
import Link from "next/link";

const supportCards = [
	{
		title: "Direct support",
		description:
			"Fans can send one-time contributions straight to a creator without complicated steps, helping ideas move from draft to reality faster.",
		image: "/coin.gif",
	},
	{
		title: "Creator-first pages",
		description:
			"Every creator gets a personal public page with their profile, cover image, and payment options, making the experience feel polished and personal.",
		image: "/profile.jpg",
	},
	{
		title: "Community energy",
		description:
			"Supporters are not just donors. They become part of the creator's journey, with visible appreciation and a stronger sense of belonging.",
		image: "/group.gif",
	},
];

const benefits = [
	"Simple creator onboarding and profile setup",
	"Fast Razorpay-powered donations",
	"Public creator pages that build trust",
	"Supporter lists that encourage momentum",
	"Responsive design that works beautifully on mobile",
	"A polished experience designed for modern creator funding",
];

const steps = [
	{
		title: "Create your page",
		description:
			"Set up your creator profile, add a cover image, and customize the public page that supporters will see.",
	},
	{
		title: "Share your link",
		description:
			"Post your page anywhere your audience already hangs out: social media, newsletters, portfolios, or communities.",
	},
	{
		title: "Receive support",
		description:
			"Fans enter a name and donation amount, then pay securely through the integrated checkout flow.",
	},
];

export default function AboutPage() {
	return (
		<main className="relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_28%)]" />

			<section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
				<div className="space-y-8">
					<div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
						<Image src="/tea.gif" alt="Tea cup icon" width={24} height={24} unoptimized />
						Built for independent creators, communities, and supporters
					</div>

					<div className="space-y-5">
						<h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
							A modern platform for creators to receive direct support.
						</h1>
						<p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
							Get Me A Kofi gives creators a public page where fans can support
							their work in seconds. It combines a clean creator profile,
							secure payments, and a focused experience that makes funding feel
							simple, trustworthy, and human.
						</p>
					</div>

					<div className="flex flex-col gap-4 sm:flex-row">
						<Link
							href="/login"
							className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition-transform hover:-translate-y-0.5"
						>
							Start supporting creators
						</Link>
						<Link
							href="/"
							className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
						>
							Explore the platform
						</Link>
					</div>
				</div>

				<div className="relative">
					<div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-3xl" />
					<div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
						<div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
							<Image
								src="/EC.jpg"
								alt="Creator and supporter collaboration"
								width={1200}
								height={720}
								className="h-72 w-full object-cover object-center opacity-90"
							/>
						</div>
						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-sm text-white/55">Funding style</p>
								<p className="mt-1 text-lg font-semibold text-white">One-time support</p>
								<p className="mt-2 text-sm leading-6 text-white/70">
									Fans can contribute quickly without creating a complicated membership flow.
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-sm text-white/55">Best for</p>
								<p className="mt-1 text-lg font-semibold text-white">Artists, makers, and builders</p>
								<p className="mt-2 text-sm leading-6 text-white/70">
									Anyone sharing creative work, learning in public, or building in the open.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto mt-20 max-w-7xl">
				<div className="grid gap-6 lg:grid-cols-3">
					{supportCards.map((card) => (
						<article
							key={card.title}
							className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
						>
							  <Image src={card.image} alt={card.title} width={64} height={64} unoptimized className="h-16 w-16 rounded-2xl object-cover" />
							<h2 className="mt-5 text-xl font-semibold text-white">{card.title}</h2>
							<p className="mt-3 text-sm leading-7 text-white/70">{card.description}</p>
						</article>
					))}
				</div>
			</section>

			<section className="mx-auto mt-20 grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
				<div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7 shadow-xl shadow-black/20 backdrop-blur-md">
					<div className="flex items-center gap-3">
						<Image src="/coins.gif" alt="Coins icon" width={48} height={48} unoptimized className="h-12 w-12 rounded-xl" />
						<div>
							<p className="text-sm uppercase tracking-[0.25em] text-white/45">Why it matters</p>
							<h2 className="text-2xl font-semibold text-white">Funding should feel human.</h2>
						</div>
					</div>

					<p className="mt-5 text-sm leading-7 text-white/72 sm:text-base">
						Many creators do great work long before they have a sponsor, a grant, or a full audience.
						This platform exists to make early support accessible. It gives creators a simple public
						page, a direct payment route, and a better way to receive encouragement from the people
						who enjoy their work.
					</p>

					<ul className="mt-6 space-y-3">
						{benefits.map((benefit) => (
							<li key={benefit} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-white/78">
								<span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="grid gap-6">
					<div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-7 shadow-xl shadow-black/20 backdrop-blur-md">
						<p className="text-sm uppercase tracking-[0.25em] text-white/45">How funding works</p>
						<div className="mt-6 space-y-4">
							{steps.map((step, index) => (
								<div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-black">
										0{index + 1}
									</div>
									<div>
										<h3 className="text-base font-semibold text-white">{step.title}</h3>
										<p className="mt-2 text-sm leading-6 text-white/70">{step.description}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="grid gap-6 sm:grid-cols-2">
						<div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
							  <Image src="/man.gif" alt="Supportive fan" width={56} height={56} unoptimized className="h-14 w-14 rounded-2xl" />
							<h3 className="mt-4 text-lg font-semibold text-white">For supporters</h3>
							<p className="mt-2 text-sm leading-6 text-white/70">
								Back the people you care about in seconds and leave a visible sign of appreciation.
							</p>
						</div>
						<div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
							  <Image src="/avatar.gif" alt="Creator avatar" width={56} height={56} unoptimized className="h-14 w-14 rounded-2xl" />
							<h3 className="mt-4 text-lg font-semibold text-white">For creators</h3>
							<p className="mt-2 text-sm leading-6 text-white/70">
								Build a trustworthy public page, receive support, and keep your creative work moving.
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}

