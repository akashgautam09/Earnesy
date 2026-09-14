import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);
  let startHref = '/login';

  if (session?.user?.email) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const user = await User.findById(session.user.id).select('username').lean();
    if (user?.username) {
      startHref = `/${user.username}`;
    }
  }

  return (
    <>
      {/* Hero Section */}
      <div className='min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 sm:py-20 gap-8 text-center' >
        <div className='max-w-2xl space-y-4'>
          <div className='inline-flex items-center justify-center gap-2'>
            <img src="/tea.gif" width={40} height={40} alt="Tea" className="sm:w-12 sm:h-12" />
            <span className='text-sm sm:text-base font-medium text-white bg-[#F4C542]/10 px-3 py-1 rounded-full'>Support Your Creators</span>
          </div>
          
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-[#F5F1E8] leading-tight tracking-tight'>
            Fuel Your <span className='text-[#F5F1E8]'>Creative Journey</span>
          </h1>
          
          <p className='text-base sm:text-lg text-[#F5F1E8]/72 leading-relaxed max-w-xl mx-auto'>
            Direct support from your fans. No algorithms. No gatekeeping. Just you and the people who love your work.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4'>
          <Link href={startHref} className='group'>
            <button className='px-8 sm:px-10 py-3 sm:py-4 bg-white hover:bg-[#F5F1E8] text-[#171717] font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center sm:justify-start'>
              Start Creating
              <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
            </button>
          </Link>
          <Link href="/about" className='group'>
            <button className='px-8 sm:px-10 py-3 sm:py-4 bg-transparent hover:bg-[#F5F1E8]/5 text-[#F5F1E8] font-semibold rounded-xl border border-[#F5F1E8]/20 transition-all duration-200 active:scale-95 w-full sm:w-auto'>
              Learn More
            </button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[#F4C542] font-semibold text-sm uppercase tracking-wider mb-3">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F5F1E8] leading-tight">Simple. Direct. Powerful.</h2>
            <p className="text-[#F5F1E8]/68 text-base sm:text-lg mt-4 max-w-2xl mx-auto">Everything creators need to turn passion into sustainable income</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Instant Support',
                desc: 'Your fans support you directly in seconds, no friction.',
                icon: '🎁'
              },
              {
                title: 'Keep Control',
                desc: 'Your page, your rules. No algorithms deciding who sees your work.',
                icon: '🎯'
              },
              {
                title: 'Build Community',
                desc: 'Connect with supporters who believe in your mission.',
                icon: '👥'
              }
            ].map((feature, idx) => (
              <div key={idx} className='group bg-[#1F1F1F] border border-[#F5F1E8]/10 rounded-xl p-6 sm:p-8 transition-all duration-200 hover:border-[#F5F1E8]/20'>
                <p className='text-3xl sm:text-4xl mb-4'>{feature.icon}</p>
                <h3 className='text-lg sm:text-xl font-semibold text-[#F5F1E8] mb-2'>{feature.title}</h3>
                <p className='text-[#F5F1E8]/68 text-sm sm:text-base leading-relaxed'>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
