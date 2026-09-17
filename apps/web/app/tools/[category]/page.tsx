import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory, getCategoryTools } from "@formatbase/tool-registry";

type Props = { params: Promise<{ category: string }> };
export function generateStaticParams() { return categories.map(category => ({ category: category.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  return { title: `${category.name} | Formatbase`, description: category.description, alternates: { canonical: `/tools/${category.id}` } };
}
export default async function CategoryPage({ params }: Props) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const items = getCategoryTools(category.id);
  return <main className="container category-page"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><strong>{category.name}</strong></div><div className="eyebrow">BROWSE BY FORMAT</div><h1>{category.name}<span className="title-accent">.</span></h1><p>{category.description}</p><div className="tool-grid">{items.map(tool => <Link className="tool-card" href={`/${tool.slug}`} key={tool.id}><div className="card-top"><span className="card-icon">{`{ }`}</span><span className="card-arrow">↗</span></div><div className="card-eyebrow">{tool.eyebrow}</div><h2>{tool.name}</h2><p>{tool.description}</p><span className="card-link">Open tool →</span></Link>)}</div></main>;
}
