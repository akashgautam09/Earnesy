import { Montserrat } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";

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
        <ClerkProvider>
          <AppShell>
            {children}
            <Footer />
          </AppShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
