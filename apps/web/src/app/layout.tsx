import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NavLink } from "@/components/ui/NavLink";
import "./globals.css";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Inkforge", template: "%s — Inkforge" },
  description: "AI article generation — notes, topics, and code into human-readable MDX.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg-base text-fg font-sans antialiased flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-bg-base/80 backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 h-full flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-mono font-bold text-fg text-lg">⚒</span>
              <span className="font-mono font-bold text-fg group-hover:text-accent transition-colors">
                ink<span className="text-accent">forge</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              <NavLink href="/generate">Generate</NavLink>
              <NavLink href="/articles">Articles</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
