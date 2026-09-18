import type { Metadata } from "next";
import { contactEmail, siteConfig } from "@codeformattools/seo";

export const metadata: Metadata = { title: "Contact | Code Format Tools", description: "Contact Code Format Tools about privacy, terms, corrections, and operations." };

export default function Page() {
  const email = contactEmail();
  return <main className="simple-page container"><div className="eyebrow">CONTACT</div><h1>Contact Code Format Tools<span className="title-accent">.</span></h1><p>Use this page for privacy questions, terms questions, correction requests, takedown requests, security concerns, or operational issues with the tools.</p>{email ? <p>Email <a href={`mailto:${email}`}>{email}</a>. Please do not include sensitive tool input unless it is necessary for the request.</p> : <p>A production contact email has not been configured yet. Set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> before launch for <strong>{siteConfig.domain}</strong>. This local fallback is intentional so development builds do not invent a support address.</p>}<h2>What to include</h2><p>Include the page URL, a short description of the issue, and the browser or device if the problem is about layout or behavior. For privacy requests, include enough detail to identify the request without sending private tool input.</p></main>;
}
