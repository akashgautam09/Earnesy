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
  title: "Earnesy - Fund Your Work With Earnesy",
  description: "This website is a crowdfunding platform for creators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fffdf8] text-[#1f2937]`}>
        <SessionWrapper>
          <Navbar />
          <div className="min-h-screen bg-[#fffdf8] text-[#1f2937]">{children}</div>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
