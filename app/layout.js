import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionWrapper from "@/components/SessionWrapper";

const montserrat = Montserrat({
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
      <body className={`${montserrat.className} bg-[var(--background)] text-[var(--foreground)]`}>
        <SessionWrapper>
          <Navbar />
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</div>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
