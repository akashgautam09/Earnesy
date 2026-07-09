import BtnRotatingBg from '@/components/Btnrotatingbg';
import { authoptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authoptions);
  let startHref = '/login';

  if (session?.user?.email) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const user = await User.findOne({ email: session.user.email }).select('username').lean();
    if (user?.username) {
      startHref = `/${user.username}`;
    }
  }

  return (
    <>
      <div className='flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center pl-2 gap-4 text-center text-white' >
        <div className='inline-flex h-7 items-center justify-center pl-2 animate-background-shine bg-[linear-gradient(110deg,#ff0080,#ff8c00,#40e0d0,#8a2be2,#ff0080)] bg-[length:250%_100%] bg-clip-text text-4xl text-transparent font-serif font-bold'>
          Get Me A Kofi !
          <span className='pb-4'><img className="invertImg" src="/tea.gif" width={71} alt="" /></span>
        </div>
        <p className='font-serif text-xl '>A crowdfunding platform for creators. Get funded today!</p>
        <div className='flex gap-4'>

          <Link href={startHref}>
            <BtnRotatingBg>
              Start Now
            </BtnRotatingBg>
          </Link>

          <Link href="/about">
            <BtnRotatingBg>
              Read More
            </BtnRotatingBg>
          </Link>
        </div>
      </div>
      <div className="bg-white h-1 opacity-10">
      </div>

      <div className="text-white container mx-auto md:pb-32 pb-20 pt-20 px-2 md:px-10">
        <p className="text-3xl font-bold md:text-3xl text-[1.6rem] text-center md:mb-14 mb-6">Your Fans can buy you a Chai</p>
        <div className="flex gap-5 justify-around">
          <div className="item md:space-y-3 space-y-2 flex flex-col items-center justify-center pl-2">
            <img className="rounded-full p-2 text-black" width={100} src="/man.gif" alt="" />
            <p className="font-bold md:text-center">Fans want to help</p>
            <p className="md:text-center text-sm">Your fans are available to support you</p>
          </div>
          <div className="item md:space-y-3 space-y-2 flex flex-col items-center justify-center pl-2">
            <img className="rounded-full p-2 text-black" width={105} src="/coin.gif" alt="" />
            <p className="font-bold md:text-center">Fans want to contribute</p>
            <p className="md:text-center text-sm">Your fans are willing to contribute financially</p>
          </div>
          <div className="item md:space-y-3 space-y-2 flex flex-col items-center justify-center pl-2">
            <img className="rounded-full p-2 text-black" width={105} src="/group.gif" alt="" />
            <p className="font-bold md:text-center">Fans want to collaborate</p>
            <p className="md:text-center text-sm">Your fans are ready to collaborate with you</p>
          </div>
        </div>
      </div>
      
    </>
  );
}
