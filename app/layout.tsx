import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { CompareDrawer } from "@/components/compare/CompareDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CollegeHub | College Discovery Platform",
  description: "Discover, compare, review, and save Indian colleges."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          {children}
          <Footer />
          <CompareDrawer />
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
