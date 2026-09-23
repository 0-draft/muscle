import type { Lang } from './i18n';
import { LABELS } from './remark-claims.mjs';

export type Grade = 'A' | 'B' | 'C' | 'D';
export type Counts = Record<Grade, number>;
export type Claim = { id: string; grade: Grade; text: string };

// IWF bumper plates: red 25, blue 20, yellow 15, white 5. White instead of green 10 for D,
// because red and green collapse into one colour under deuteranopia.
export const GRADES: { id: Grade; kg: number; label: Record<Lang, string>; meaning: Record<Lang, string> }[] = [
  { id: 'A', kg: 25, label: { en: LABELS.en.A, ja: LABELS.ja.A }, meaning: { en: 'Several meta-analyses or systematic reviews agree', ja: '複数のメタ分析・系統的レビューで結論が一致' } },
  { id: 'B', kg: 20, label: { en: LABELS.en.B, ja: LABELS.ja.B }, meaning: { en: 'One meta-analysis, or several RCTs', ja: 'メタ分析1本、または複数のRCTで支持' } },
  { id: 'C', kg: 15, label: { en: LABELS.en.C, ja: LABELS.ja.C }, meaning: { en: 'A few RCTs or observational studies only', ja: '少数のRCTや観察研究のみ' } },
  { id: 'D', kg: 5, label: { en: LABELS.en.D, ja: LABELS.ja.D }, meaning: { en: 'Expert opinion or reasoning from mechanisms', ja: '専門家の意見・メカニズムからの推測' } },
];

export const PLATE_H: Record<Grade, number> = { A: 1, B: 0.86, C: 0.72, D: 0.56 };

export const emptyCounts = (): Counts => ({ A: 0, B: 0, C: 0, D: 0 });

export const addCounts = (a: Counts, b: Partial<Counts> = {}): Counts => ({
  A: a.A + (b.A ?? 0),
  B: a.B + (b.B ?? 0),
  C: a.C + (b.C ?? 0),
  D: a.D + (b.D ?? 0),
});

export const totalKg = (c: Counts) => GRADES.reduce((s, g) => s + c[g.id] * g.kg, 0);

export const countsLabel = (c: Counts) => GRADES.map((g) => `${g.id} ${c[g.id]}`).join(', ');

export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
