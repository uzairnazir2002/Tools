"use client";

import Link from "next/link";
import type { Tool } from "@codeformattools/tool-registry";
import { track } from "@codeformattools/analytics";

export function RelatedTools({ current, related }: { current: Tool["id"]; related: Tool[] }) {
  return <aside className="related"><div className="eyebrow">KEEP WORKING</div><h3>Related tools</h3>{related.map(item => <Link href={`/${item.slug}`} key={item.id} onClick={() => track({ name: "related_tool_click", from: current, to: item.id })}>{item.name}<span>↗</span></Link>)}<div className="related-note">Built for developers who care about their data.</div></aside>;
}
