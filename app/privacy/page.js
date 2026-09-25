import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Earnesy",
  description: "Privacy Policy and Google API Services User Data Policy disclosure for Earnesy.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 20, 2026";

  return (
    <main className="relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_25%)]" />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="border-b border-[#F5F1E8]/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#F4C542] mb-4">
            Legal & Compliance
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F1E8] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[#F5F1E8]/60">
            Last Updated: {lastUpdated} &bull; Effective Immediately
          </p>
        </div>

        {/* Intro */}
        <div className="prose prose-invert mt-8 max-w-none space-y-10 text-[#F5F1E8]/80 leading-relaxed text-sm sm:text-base">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p>
              Welcome to <strong>Earnesy</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data of creators, donors, and visitors. This Privacy Policy explains what information we collect, how it is used and protected, and your rights regarding your personal information when using our crowdfunding platform and services at <strong>getmeakofi.com</strong>.
            </p>
          </section>

          {/* 1. Google API Disclosure (Crucial for Google OAuth Verification) */}
          <section className="rounded-2xl border border-[#F4C542]/30 bg-[#F4C542]/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#F4C542] sm:text-2xl mb-4">
              1. Google API Services User Data Policy & Limited Use Disclosure
            </h2>
            <p className="text-[#F5F1E8]/90 mb-4">
              Earnesy uses Google OAuth to facilitate quick, secure authentication for user sign-in and account creation.
            </p>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-[#F5F1E8] font-mono leading-relaxed mb-4">
              Earnesy&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#F4C542] hover:text-[#F4C542]/80"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-[#F5F1E8]/80">
              <li>We only request access to basic identity scopes: <code>openid</code>, <code>.../auth/userinfo.email</code>, and <code>.../auth/userinfo.profile</code>.</li>
              <li>We do <strong>NOT</strong> request access to sensitive or restricted Google user data (such as Gmail, Google Drive, Google Calendar, or contacts).</li>
              <li>We do <strong>NOT</strong> sell Google user data to third parties, data brokers, or advertising networks.</li>
              <li>Google user data is used solely to authenticate your identity, create your user session, and display your public profile name and avatar on Earnesy.</li>
              <li>We do not transfer or disclose Google user data to third parties unless necessary to provide our core platform functionality, comply with applicable laws, or as part of an asset transfer.</li>
              <li>Humans are not permitted to read your personal Google data unless you provide explicit affirmative consent or it is required to investigate security issues or adhere to law.</li>
            </ul>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              2. Information We Collect
            </h2>
            <p>We collect information in the following ways:</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white mb-2">A. Information from Social Logins</h3>
                <p className="text-sm text-[#F5F1E8]/70">
                  When you sign in using Google, GitHub, or Facebook, we collect:
                </p>
                <ul className="mt-2 text-xs space-y-1 text-[#F5F1E8]/60 list-disc list-inside">
                  <li>Your full name and public display name</li>
                  <li>Your verified email address</li>
                  <li>Your public avatar / profile picture URL</li>
                  <li>Provider account identifier (for authentication pairing)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white mb-2">B. Creator Profile Data</h3>
                <p className="text-sm text-[#F5F1E8]/70">
                  If you set up a creator page on Earnesy, you may provide:
                </p>
                <ul className="mt-2 text-xs space-y-1 text-[#F5F1E8]/60 list-disc list-inside">
                  <li>Unique username and bio description</li>
                  <li>Custom profile picture and cover banner (stored via Cloudinary)</li>
                  <li>Encrypted payment gateway keys (e.g. Razorpay Key ID and Secret)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white mb-2">C. Supporter & Transaction Data</h3>
                <p className="text-sm text-[#F5F1E8]/70">
                  When supporters send contributions:
                </p>
                <ul className="mt-2 text-xs space-y-1 text-[#F5F1E8]/60 list-disc list-inside">
                  <li>Supporter name and optional public message</li>
                  <li>Contribution amount and payment currency</li>
                  <li>Razorpay Order ID and Payment ID confirmation</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white mb-2">D. Technical & Log Data</h3>
                <p className="text-sm text-[#F5F1E8]/70">
                  Automatic technical data collected during use:
                </p>
                <ul className="mt-2 text-xs space-y-1 text-[#F5F1E8]/60 list-disc list-inside">
                  <li>IP address and general geographic location</li>
                  <li>Browser type, device operating system, and session timestamps</li>
                  <li>Authentication session cookies managed via NextAuth</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#F5F1E8]/80 text-sm sm:text-base">
              <li><strong>Authentication & Security:</strong> To verify your identity, maintain authenticated sessions, and protect against unauthorized access.</li>
              <li><strong>Public Creator Pages:</strong> To host and render your custom creator page, display supporter appreciation messages, and showcase leaderboards.</li>
              <li><strong>Processing Transactions:</strong> To verify payments made via Razorpay and attribute contributions to the intended creator.</li>
              <li><strong>Communication:</strong> To send account notifications, transaction confirmations, and respond to support requests.</li>
              <li><strong>Service Improvement:</strong> To monitor system performance, fix bugs, and optimize user experience.</li>
            </ul>
          </section>

          {/* 4. Payment Security & Encryption */}
          <section className="rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl mb-3">
              4. Payment Credentials & Security Architecture
            </h2>
            <p className="text-sm text-[#F5F1E8]/80 mb-3">
              We take data security with utmost seriousness:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[#F5F1E8]/70">
              <li><strong>No Raw Card Storage:</strong> We do <em>not</em> collect, store, or process credit/debit card numbers or bank credentials directly. All payments are securely processed by authorized payment aggregators (e.g. Razorpay).</li>
              <li><strong>AES-256 Encryption:</strong> Creator API credentials (such as Razorpay Key Secret) stored in our database are encrypted using authenticated <strong>AES-256-GCM</strong> encryption with unique initialization vectors.</li>
              <li><strong>HTTPS / TLS:</strong> All network traffic between your client browser, our servers, and third-party APIs is strictly transmitted over encrypted HTTPS/TLS protocols.</li>
            </ul>
          </section>

          {/* 5. Third-Party Service Providers */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              5. Third-Party Service Providers
            </h2>
            <p>We work with trusted third-party providers to operate our platform:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#F5F1E8]">
                    <th className="py-2 pr-4 font-semibold">Service Provider</th>
                    <th className="py-2 pr-4 font-semibold">Purpose</th>
                    <th className="py-2 font-semibold">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F5F1E8]/70 text-xs sm:text-sm">
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">Google Identity</td>
                    <td className="py-2.5 pr-4">OAuth Authentication & Sign-in</td>
                    <td className="py-2.5">
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">Google Privacy</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">Meta / Facebook</td>
                    <td className="py-2.5 pr-4">OAuth Authentication & Sign-in</td>
                    <td className="py-2.5">
                      <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">Meta Privacy</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">GitHub OAuth</td>
                    <td className="py-2.5 pr-4">Developer Sign-in & Authentication</td>
                    <td className="py-2.5">
                      <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">GitHub Privacy</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">MongoDB Atlas</td>
                    <td className="py-2.5 pr-4">Encrypted Cloud Database Storage</td>
                    <td className="py-2.5">
                      <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">MongoDB Privacy</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">Razorpay</td>
                    <td className="py-2.5 pr-4">Payment Processing & Checkout</td>
                    <td className="py-2.5">
                      <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">Razorpay Privacy</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white">Cloudinary</td>
                    <td className="py-2.5 pr-4">Media Hosting (Profile/Cover Images)</td>
                    <td className="py-2.5">
                      <a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer" className="text-[#F4C542] hover:underline">Cloudinary Privacy</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Data Retention and Deletion */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              6. Data Retention and Account Deletion
            </h2>
            <p>
              We retain your personal data only for as long as your account remains active or as needed to provide you with the services.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-white mb-1">How to Request Account & Data Deletion</h3>
              <p className="text-sm text-[#F5F1E8]/70">
                You have the full right to delete your account, remove your public creator page, and erase your personal information. To request permanent deletion of your profile and data:
              </p>
              <ul className="mt-2 text-xs space-y-1 text-[#F5F1E8]/60 list-disc list-inside">
                <li>Send an email to <strong className="text-white">hello@getmeakofi.com</strong> with the subject <em>&quot;Data Deletion Request&quot;</em> from the email address registered with your account.</li>
                <li>Upon verification, we will permanently purge your personal profile, credentials, and uploaded assets from our database within 30 days.</li>
              </ul>
            </div>
          </section>

          {/* 7. Cookies and Tracking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              7. Cookies and Tracking Technologies
            </h2>
            <p className="text-sm sm:text-base">
              We use strictly necessary cookies to keep you signed in securely across requests. These session tokens are cryptographically signed using our secret key (NextAuth). We do not use third-party tracking cookies for targeted behavioral advertisements.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-sm sm:text-base">
              Earnesy is not intended for individuals under the age of 13 (or under 16 in certain jurisdictions). We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* 9. Contact Us */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#F5F1E8] sm:text-2xl mb-3">
              9. Contact Information & Data Protection Officer
            </h2>
            <p className="text-sm text-[#F5F1E8]/80 mb-4">
              If you have any questions, inquiries, or concerns regarding this Privacy Policy or our data handling practices, please contact us:
            </p>
            <div className="space-y-1 text-sm text-[#F5F1E8]/70">
              <p><strong>Platform:</strong> Earnesy</p>
              <p><strong>Support & Privacy Email:</strong> <a href="mailto:hello@getmeakofi.com" className="text-[#F4C542] underline">hello@getmeakofi.com</a></p>
              <p><strong>Website:</strong> <Link href="/" className="text-[#F4C542] underline">getmeakofi.com</Link></p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-sm">
          <Link href="/" className="text-[#F4C542] hover:underline">
            &larr; Return to Home
          </Link>
          <Link href="/terms" className="text-[#F5F1E8]/70 hover:text-white">
            Read Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
