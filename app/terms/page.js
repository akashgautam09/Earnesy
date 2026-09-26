import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Earnesy",
  description: "Terms and conditions for using Earnesy platform and creator services.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "September 20, 2026";

  return (
    <main className="legal-page relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_25%)]" />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="border-b border-[#F5F1E8]/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#F4C542] mb-4">
            Legal & Compliance
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8] sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-[#F5F1E8]/60">
            Last Updated: {lastUpdated} &bull; Effective Immediately
          </p>
        </div>

        {/* Content */}
        <div className="mt-8 space-y-8 text-[#F5F1E8]/80 leading-relaxed text-sm sm:text-base">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p>
              Please read these Terms of Service (&quot;Terms&quot;) carefully before using the <strong>Earnesy</strong> platform operated by Earnesy (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;). By accessing our website, creating an account, or sending payments to creators, you agree to be bound by these Terms.
            </p>
          </section>

          {/* 1. Account Creation and Authentication */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              1. Account Registration and Third-Party Logins
            </h2>
            <p>
              To access creator features, you can sign in using authorized OAuth third-party providers (Google, GitHub, or Facebook). You agree to provide accurate information and maintain the security of your account credentials. You are responsible for all activities that occur under your account.
            </p>
          </section>

          {/* 2. Platform Nature & Creator Conduct */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              2. Platform Purpose and Acceptable Use
            </h2>
            <p>
              Earnesy is a creator support platform designed to enable fans and communities to support creative projects, software development, art, and content creation. You agree NOT to use the platform for:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-[#F5F1E8]/70">
              <li>Illegal, fraudulent, harassing, abusive, or defamatory content.</li>
              <li>Money laundering, pyramid schemes, or unauthorized lottery/gambling operations.</li>
              <li>Impersonating another person, brand, or creator.</li>
              <li>Violating intellectual property or copyright laws.</li>
              <li>Distributing malicious code, spyware, or viruses.</li>
            </ul>
          </section>

          {/* 3. Payments & Donations */}
          <section className="rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl mb-3">
              3. Payments, Contributions & Fees
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[#F5F1E8]/70">
              <li><strong>Voluntary Support:</strong> Contributions made through Earnesy are voluntary donations to support creators and do not represent investments, equity, or physical products unless explicitly guaranteed by the creator.</li>
              <li><strong>Payment Processing:</strong> Transactions are routed through third-party payment gateways (such as Razorpay). By initiating a transaction, you agree to comply with the terms of the respective payment gateway.</li>
              <li><strong>Refunds:</strong> Because contributions are delivered directly to the creator&apos;s linked payment account, refund requests must be directed to the recipient creator, subject to payment processor refund guidelines.</li>
            </ul>
          </section>

          {/* 4. Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              4. Intellectual Property Rights
            </h2>
            <p>
              Creators retain all intellectual property ownership of any content, artwork, avatars, banners, and descriptions uploaded to their profile pages. By uploading assets, creators grant Earnesy a non-exclusive, worldwide license to host, display, and format that content for the purpose of operating the platform.
            </p>
          </section>

          {/* 5. Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              5. Disclaimer and Limitation of Liability
            </h2>
            <p className="text-sm text-[#F5F1E8]/70">
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. In no event shall Earnesy, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use the service.
            </p>
          </section>

          {/* 6. Termination */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              6. Termination & Account Suspension
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraud, or abuse our APIs or services, with or without prior notice.
            </p>
          </section>

          {/* 7. Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              7. Updates to These Terms
            </h2>
            <p>
              We may modify these Terms periodically. Continued use of Earnesy following any changes constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* 8. Contact */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl mb-2">
              8. Contact Us
            </h2>
            <p className="text-sm text-[#F5F1E8]/70">
              For any questions regarding these Terms, please reach out to <a href="mailto:hello@getmeakofi.com" className="text-[#F4C542] underline">hello@getmeakofi.com</a>.
            </p>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-sm">
          <Link href="/privacy" className="text-[#F4C542] hover:underline">
            &larr; View Privacy Policy
          </Link>
          <Link href="/" className="text-[#F5F1E8]/70 hover:text-white">
            Return to Home &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
