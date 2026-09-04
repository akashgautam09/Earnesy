import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionWrapper from "@/components/SessionWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Get Me A Kofi - Fund Your Work With Kofi",
  description: "This website is a crowdfunding platform for creators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#171717] text-[#F5F1E8]`}>
        <SessionWrapper>
          <Navbar />
          <div className="min-h-screen bg-[#171717] text-[#F5F1E8]">{children}</div>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
