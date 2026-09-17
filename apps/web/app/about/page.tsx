import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Formatbase", description: "Learn why Formatbase builds fast, private developer tools." };

export default function Page() {
  return <main className="simple-page container"><div className="eyebrow">ABOUT FORMATBASE</div><h1>Small tools.<br /><em>Better work.</em></h1><p>Formatbase makes focused tools for developers working with structured data. Formatting, validation, and conversion should feel fast, clear, and private enough for everyday work.</p><p>Every tool is designed around the same promise: the useful work happens in your browser, errors should be understandable, and the interface should stay calm while you inspect real data.</p><h2>What we build</h2><p>The first launch covers JSON, SQL, YAML, XML, CSV, and format converters. The tool pages include examples, common mistakes, and direct links to related tools so you can move through a workflow without searching again.</p><h2>What we avoid</h2><p>Formatbase does not require an account, does not upload tool input for processing, and does not add duplicate doorway pages for search traffic. Each page is meant to be useful on its own.</p></main>;
}
