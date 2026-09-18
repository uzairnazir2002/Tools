import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool, tools } from "@codeformattools/tool-registry";
import { toolMetadata, toolSchemas } from "@codeformattools/seo";
import { AdSlotPlaceholder } from "@/components/ad-slot-placeholder";
import { RelatedTools } from "@/components/related-tools";
import { ToolShell } from "@/components/tool-shell";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return tools.map(tool => ({ slug: tool.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getTool((await params).slug);
  return tool ? toolMetadata(tool) : {};
}

export default async function ToolPage({ params }: Props) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const related = tool.relatedTools.map(id => getTool(id)).filter(item => item !== undefined);
  return <main>
    {toolSchemas(tool).map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />)}
    <section className="tool-intro container">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={`/tools/${tool.category}`}>{tool.category.toUpperCase()} tools</Link><span>/</span><strong>{tool.name}</strong></div>
      <div className="eyebrow"><span className="live-dot" /> {tool.eyebrow}</div>
      <h1>{tool.name}<span className="title-accent">.</span></h1>
      <p>{tool.description}</p>
      <div className="trust-line"><span>100% browser based</span><span>No sign up</span><span>No data sent</span></div>
    </section>
    <ToolShell tool={tool} />
    <AdSlotPlaceholder placement="after-tool" enabled={false} />
    <section className={`content-section container${related.length ? "" : " single"}`}>
      <div className="content-main">
        <div className="eyebrow">THE DETAILS</div>
        <h2>About this tool</h2><p>{tool.about}</p>
        <h3>How to use it</h3><ol>{tool.howItWorks.map(item => <li key={item}>{item}</li>)}</ol>
        <h3>Example {tool.input.language.toUpperCase()}</h3><p>Try this sample in the workspace:</p><pre className="example-code"><code>{tool.example}</code></pre>
        <h3>Common {tool.input.language.toUpperCase()} issues</h3>
        <div className="error-grid">{tool.commonErrors.map(item => <div key={item.title}><strong>{item.title}</strong><p>{item.description}</p></div>)}</div>
        <h3>Frequently asked questions</h3>
        <div className="faq-list">{tool.faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </div>
      {related.length > 0 && <RelatedTools current={tool.id} related={related} />}
    </section>
  </main>;
}
