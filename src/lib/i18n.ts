export type Lang = 'en' | 'ja';
export const LANGS: Lang[] = ['en', 'ja'];

const base = () => import.meta.env.BASE_URL.replace(/\/$/, '');

/** Site-relative href for a path in the given language. English lives at the root. */
export const href = (lang: Lang, path = '') => {
  const p = path.replace(/^\//, '');
  return `${base()}/${lang === 'ja' ? 'ja/' : ''}${p}`;
};

/** Map the current pathname to its counterpart in the other language. */
export const switchPath = (pathname: string, to: Lang) => {
  const rest = pathname.slice(base().length).replace(/^\/(ja\/?)?/, '');
  return href(to, rest);
};

export const t = {
  en: {
    siteName: 'Hypertrophy Evidence Notes',
    description: 'Research notes on muscle growth, nutrition, recovery and habit, with every claim graded by the strength of its evidence.',
    skip: 'Skip to content',
    nav: { knowledge: 'Knowledge', program: 'Program', grades: 'Evidence grades' },
    langName: '日本語',
    heroTitle: ['Program your training', 'by the weight of the evidence.'],
    heroLede: 'Notes on hypertrophy, nutrition, recovery and habit, researched from the literature by AI agents and checked against PubMed. Each claim carries a bumper plate sized by how strong its evidence is. Red is the heaviest.',
    barCaption: (n: number, c: string, kg: number) => `Evidence on the bar: ${n} graded claims (${c}), ${kg} kg in plate terms`,
    areas: { training: 'Training', nutrition: 'Nutrition', recovery: 'Recovery', adherence: 'Habit' },
    reviewed: 'reviewed',
    lastReviewed: 'Last reviewed',
    back: 'All topics',
    toc: 'Contents',
    breakdown: 'Evidence breakdown',
    validFrom: 'In effect from',
    footer: 'Personal research notes, not medical advice. Every claim links to its original source.',
    source: 'Source',
    gradesTitle: 'How to read the evidence grades',
    gradesLede: 'Every claim carries a plate from A to D. The heavier the plate, the less likely the conclusion is to be overturned.',
    gradesRulesTitle: 'Grading rules',
    gradesRules: [
      'Every source needs a PMID or DOI, and is checked against PubMed or the publisher before it goes in.',
      'The grade follows study design and whether results agree, not how many studies exist.',
      'If the only evidence is from untrained people, the grade drops one step when applied to trained lifters.',
      'Numbers are study averages. Individual responses vary a lot, so treat them as starting points to test against your own log.',
    ],
  },
  ja: {
    siteName: '筋肥大の根拠ノート',
    description: '筋肥大・栄養・回復・継続について、論文ベースで調べたメモ。主張ごとに根拠の強さを示す。',
    skip: '本文へ移動',
    nav: { knowledge: '知見', program: 'メニュー', grades: '根拠レベル' },
    langName: 'English',
    heroTitle: ['論文の重さで、', 'トレーニングを組む。'],
    heroLede: '筋肥大・栄養・回復・継続について、AIエージェントに論文を調べさせ、PubMedで出典を確認して整理したメモ。主張ごとに、根拠の強さをバンパープレートの重さで示している。赤が一番重い。',
    barCaption: (n: number, c: string, kg: number) => `いま積んである根拠: ${n} 件の主張（${c}）、プレート換算 ${kg} kg`,
    areas: { training: 'トレーニング', nutrition: '栄養', recovery: '回復', adherence: '継続' },
    reviewed: '確認',
    lastReviewed: '最終確認',
    back: '知見の一覧へ戻る',
    toc: '目次',
    breakdown: '根拠の内訳',
    validFrom: 'から適用',
    footer: '個人の調査メモで、医療アドバイスではない。出典は各ページの参考文献から原典を確認できる。',
    source: 'ソース',
    gradesTitle: '根拠レベルの読み方',
    gradesLede: '各ページの主張には、裏付けの強さに応じてA〜Dのプレートを付けている。重いプレートほど、結論がひっくり返りにくい。',
    gradesRulesTitle: '付け方のルール',
    gradesRules: [
      '出典にはPMIDかDOIを必ず付け、PubMedか出版社のページで実在を確認してから載せる。',
      'レベルは研究デザインと結論の一致で決める。研究の数では決めない。',
      '初心者を対象にした研究しかない場合、トレーニング経験者に当てはめるときは1段階下げる。',
      '数字は研究の平均値。個人差が大きいので、自分のログで確かめる前提で使う。',
    ],
  },
} as const;
