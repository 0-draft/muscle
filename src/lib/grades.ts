import type { Lang } from './i18n';
import { LABELS, WHITE_LIGHTS } from './remark-claims.mjs';

export type Grade = 'A' | 'B' | 'C' | 'D';
export type Counts = Record<Grade, number>;
export type Claim = { id: string; grade: Grade; text: string };

// Grades are referee verdicts: A three white lights … D none. Plate colours are kept for load.
export const GRADES: { id: Grade; white: number; label: Record<Lang, string>; meaning: Record<Lang, string> }[] = [
  { id: 'A', white: WHITE_LIGHTS.A, label: { en: LABELS.en.A, ja: LABELS.ja.A }, meaning: { en: 'Several meta-analyses or systematic reviews agree', ja: '複数のメタ分析・系統的レビューで結論が一致' } },
  { id: 'B', white: WHITE_LIGHTS.B, label: { en: LABELS.en.B, ja: LABELS.ja.B }, meaning: { en: 'One meta-analysis, or several RCTs', ja: 'メタ分析1本、または複数のRCTで支持' } },
  { id: 'C', white: WHITE_LIGHTS.C, label: { en: LABELS.en.C, ja: LABELS.ja.C }, meaning: { en: 'A few RCTs or observational studies only', ja: '少数のRCTや観察研究のみ' } },
  { id: 'D', white: WHITE_LIGHTS.D, label: { en: LABELS.en.D, ja: LABELS.ja.D }, meaning: { en: 'Expert opinion or reasoning from mechanisms', ja: '専門家の意見・メカニズムからの推測' } },
];

export const emptyCounts = (): Counts => ({ A: 0, B: 0, C: 0, D: 0 });

export const addCounts = (a: Counts, b: Partial<Counts> = {}): Counts => ({
  A: a.A + (b.A ?? 0),
  B: a.B + (b.B ?? 0),
  C: a.C + (b.C ?? 0),
  D: a.D + (b.D ?? 0),
});

export const countsLabel = (c: Counts) => GRADES.map((g) => `${g.id} ${c[g.id]}`).join(', ');

export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
