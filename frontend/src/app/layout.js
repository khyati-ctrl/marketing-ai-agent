import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CampaignProvider } from "@/context/CampaignContext";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Marketing AI Agent",
  description: "Enterprise multi-agent workspace",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CampaignProvider>
          <div className="flex h-screen">
             <Sidebar /> {/* Sidebar stays here for EVERY page */}
             <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </CampaignProvider>
      </body>
    </html>
  );
}