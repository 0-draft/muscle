import { getCollection, render, type CollectionEntry } from 'astro:content';
import { addCounts, emptyCounts, type Claim, type Counts } from './grades';
import type { Lang } from './i18n';

/** Entry ids look like `en/protein`; the slug is the part after the language. */
export const slugOf = (id: string) => id.split('/').slice(1).join('/');

export async function knowledgeFor(lang: Lang) {
  const entries = (await getCollection('knowledge', (e) => e.id.startsWith(`${lang}/`))).sort(
    (a, b) => a.data.order - b.data.order,
  );
  return Promise.all(
    entries.map(async (entry) => {
      const rendered = await render(entry);
      const counts = addCounts(emptyCounts(), rendered.remarkPluginFrontmatter.claimCounts as Counts);
      const claims = (rendered.remarkPluginFrontmatter.claims ?? []) as Claim[];
      return { entry, rendered, counts, claims, slug: slugOf(entry.id) };
    }),
  );
}

export async function programFor(lang: Lang): Promise<CollectionEntry<'program'>> {
  const entries = await getCollection('program', (e) => e.id.startsWith(`${lang}/`));
  const [current] = entries.sort((a, b) => +b.data.valid_from - +a.data.valid_from);
  return current;
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Distinct papers cited across a language's knowledge pages (PMIDs plus DOI-only references). */
export async function paperCount(lang: Lang) {
  const entries = await getCollection('knowledge', (e) => e.id.startsWith(`${lang}/`));
  const ids = new Set<string>();
  for (const e of entries) {
    for (const m of (e.body ?? '').matchAll(/\[PMID (\d+)\]/g)) ids.add(`pmid:${m[1]}`);
    for (const m of (e.body ?? '').matchAll(/\[doi:([^\]]+)\]/g)) ids.add(`doi:${m[1]}`);
  }
  return ids.size;
}
