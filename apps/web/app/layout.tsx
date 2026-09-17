import type { Metadata } from "next";
import Link from "next/link";
import { siteOrigin } from "@formatbase/seo";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: "Formatbase — Private developer tools", template: "%s" },
  description: "Fast, private developer tools for formatting and validating structured data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>
    <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('formatbase.theme')||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t}catch(e){}" }} />
    <header className="site-header"><div className="container header-inner">
      <Link className="brand" href="/" aria-label="Formatbase home"><span className="brand-mark">{`{ }`}</span><span>formatbase<span className="brand-dot">.</span></span></Link>
      <nav className="top-nav" aria-label="Primary navigation"><Link href="/#tools">All tools</Link><Link href="/about">About</Link><Link href="/privacy">Privacy ↗</Link><ThemeToggle /></nav>
    </div></header>
    {children}
    <footer className="site-footer"><div className="container footer-inner"><div><Link className="brand footer-brand" href="/"><span className="brand-mark">{`{ }`}</span><span>formatbase<span className="brand-dot">.</span></span></Link><p>Useful tools. Your data stays yours.</p></div><div className="footer-links"><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div></div></footer>
  </body></html>;
}
