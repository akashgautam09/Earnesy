import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fffdf8] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.14),rgba(255,255,255,0))]`}>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center space-y-8">
            {/* 404 Heading */}
            <div className="space-y-4">
              <h1 className="text-8xl sm:text-9xl md:text-9xl font-bold text-slate-900">
                404
              </h1>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                Oops! Page Not Found
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2 max-w-lg mx-auto">
              <p className="text-base sm:text-lg text-slate-700">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
              <p className="text-sm sm:text-base text-slate-600">
                Let&apos;s get you back to creating amazing content!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-amber-400 text-slate-900 font-bold rounded-xl transition-all active:scale-95 text-lg">
                  🏠 Go Home
                </button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-transparent hover:bg-amber-50 text-slate-800 font-bold rounded-xl border-2 border-slate-300 transition-all active:scale-95 text-lg">
                  📖 Learn More
                </button>
              </Link>
            </div>

            {/* Footer Note */}
            <p className="text-xs sm:text-sm text-slate-600 pt-8">
              Error Code: 404 | <Link href="/" className="text-orange-400 hover:text-orange-300">Return Home</Link>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}