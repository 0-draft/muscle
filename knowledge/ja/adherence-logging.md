---
title: 記録を続ける仕組み
summary: 記録するだけでなく、目標と照らしたフィードバックがあると効く。1回30秒以内、きっかけに紐づけ、抜けても責めない。
area: adherence
order: 30
last_reviewed: 2026-09-23
---

## 結論

トレーニングの習慣はもうある。作るべきなのは「記録する習慣」の方で、それをトレーニングに乗せる。

- 記録は **1回30秒以内** で終わる量にする。書くのは種目・重量・回数・RIRだけ
- 「最後のセットが終わったら、ジムを出る前に記録する」のように、**きっかけ** に紐づける
- **週1回のフィードバック**（AIによる集計と、目標との比較）が効く部分
- 体重は毎日量るが、見るのは **7日平均** だけ
- 1日抜けても習慣は崩れない。**2回連続で抜けない** ことだけ気にする
- 慣れるまで2〜3か月かかる。その間は仕組みで支える

## 記録とフィードバック

> [!A] 進捗を記録すると目標を達成しやすくなる。紙やファイルに **物理的に書き残す** と効果が大きく、**人に見せる** とさらに大きくなる。

- 138研究・約2万人のメタ分析で、進捗の記録は目標達成を効果量0.40で改善した（Harkin 2016）
- 122の介入研究のメタ回帰で、自己記録に目標設定やフィードバックを組み合わせると、効果量が0.26から0.42に上がった（Michie 2009）

gitにコミットされたログは「物理的な記録」で、週次レビューは「フィードバックと目標の見直し」にあたる。リポジトリやサイトを公開すれば「人に見せる」にもなる。

## きっかけに紐づける

> [!A] 「もしXになったら、Yをする」という具体的な計画（実行意図）は、目標達成を中〜大きく改善する。運動に限ると効果は小さめ。

- 94研究のメタ分析で効果量0.65（Gollwitzer & Sheeran 2006）
- 身体活動に限ったメタ分析では、介入直後0.31、追跡時0.24（Bélanger-Gravel 2013）

このリポジトリで決めているきっかけ：

- 最後のセットが終わったら、ジムを出る前にスマホでその日のセットを記録する
- 朝起きてトイレに行ったら、体重計に乗って記録する

## 習慣になるまでの期間

> [!B] 習慣化までの期間は中央値で約2か月。ただし個人差が非常に大きく、4日から335日まで幅がある。

- 系統的レビューで、習慣化までの中央値は59〜66日、平均は106〜154日、個人差は4〜335日（Singh 2024）
- 新しくジムに入会した111人の研究では、週4回以上を6週間続けたことが習慣化の目安だった（Kaushal & Rhodes 2015）
- 単純な行動ほど早く習慣になる（Gardner 2012）。記録を最小限にする理由はこれ

> [!C] 1日抜けても、習慣の形成にはほとんど影響しない。

Lally 2010 の追跡研究で観察された（Gardner 2012 のまとめも参照）。だから、抜けを責めるストリーク表示は置かない。

## 続けられる動機

> [!B] 長く続くのは、楽しさや内発的な動機があるとき。「やらされている」動機では続かない。

- 筋トレの継続には、楽しさ、自己効力感、自己調整行動が関わる（Rhodes 2017）
- 運動中の気分が良いほど、将来の活動量が増える（Rhodes & Kates 2015）
- 長期の継続を予測したのは内発的動機（Teixeira 2012）
- 自律的な動機は健康行動の改善と関連したが、統制的な動機は関連しなかった（Ntoumanis 2021）

だから週次レビューは「データはこうなっている」と情報として伝える書き方にする。PRや伸びたところは必ず拾う。

## アプリや記録ツールは飽きられる

> [!B] 記録ツールの利用は時間とともに減っていく。100日後に74%、320日後には16%まで落ちた。やめる主な理由は技術的なトラブル。

- 活動量計ユーザー711人の追跡（Hermsen 2017）
- アプリを使った介入の脱落率は、介入研究で43%、観察研究で49%（Meyerowitz-Katz 2020）

gitとプレーンテキストなら、バッテリー切れも、サブスクの解約も、アプリのサービス終了もない。

## 体重は毎日量って、平均を見る

> [!C] 毎日体重を量る人は、減量で結果が出やすい。心理的な悪影響も見られない。

- スマート体重計とメールでのフィードバックを使ったRCTで、毎日量る群は6.55%減、対照群は0.35%減（Steinberg 2013）
- 毎日量る人は、量る頻度が低い人より多く減量した（Steinberg 2015）
- レビューで、定期的な計量はうつや不安などの悪影響とは関連しなかった（Zheng 2015）

どれも減量中の人が対象で、筋トレでの増量・減量に当てはめるのは推論。

> [!D] 1日ごとの体重は、水分・グリコーゲン・塩分・腸の内容物で上下する。判断に使うのは7日平均と、その週ごとの変化だけにする。

## 目標設定

> [!A] 目標を立てると行動は変わる。目標が難しいとき、公開したときに効果が大きい。

- 目標設定の独自の効果は効果量0.34（Epton 2017）
- 身体活動の目標設定介入は効果量0.55（McEwan 2016）

目標は2層にする。

- 過程の目標：全セッションを記録する、週6回以上体重を量る
- 結果の目標：12週間で主要種目の推定1RMを+5kg、体重を週+0.25%

## 何を記録するか

> [!B] RIRの自己申告は平均で約1回ずれる。限界に近いほど正確で、高回数のセットでは不正確になる。

メタ分析（Halperin 2022）。経験者はRPEと挙上速度の相関が高い（Zourdos 2016）。RIRは、全セットで書くのが面倒なら最終セットだけで十分。

## 参考文献

1. Harkin B et al. 2016. Does monitoring goal progress promote goal attainment? *Psychol Bull*. [PMID 26479070](https://pubmed.ncbi.nlm.nih.gov/26479070/)
2. Michie S et al. 2009. Effective techniques in healthy eating and physical activity interventions: a meta-regression. *Health Psychol*. [PMID 19916637](https://pubmed.ncbi.nlm.nih.gov/19916637/)
3. Gollwitzer PM, Sheeran P. 2006. Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes. *Adv Exp Soc Psychol* 38:69–119. [doi:10.1016/S0065-2601(06)38002-1](https://doi.org/10.1016/S0065-2601(06)38002-1)
4. Bélanger-Gravel A et al. 2013. A meta-analytic review of the effect of implementation intentions on physical activity. *Health Psychol Rev* 7:23–54. [doi:10.1080/17437199.2011.560095](https://doi.org/10.1080/17437199.2011.560095)
5. Singh B et al. 2024. Time to Form a Habit: A Systematic Review and Meta-Analysis of Health Behaviour Habit Formation. *Healthcare (Basel)*. [PMID 39685110](https://pubmed.ncbi.nlm.nih.gov/39685110/)
6. Kaushal N, Rhodes RE. 2015. Exercise habit formation in new gym members: a longitudinal study. *J Behav Med*. [PMID 25851609](https://pubmed.ncbi.nlm.nih.gov/25851609/)
7. Gardner B, Lally P, Wardle J. 2012. Making health habitual: the psychology of 'habit-formation' and general practice. *Br J Gen Pract*. [PMID 23211256](https://pubmed.ncbi.nlm.nih.gov/23211256/)
8. Lally P et al. 2010. How are habits formed: Modelling habit formation in the real world. *Eur J Soc Psychol* 40:998–1009. [doi:10.1002/ejsp.674](https://doi.org/10.1002/ejsp.674)
9. Rhodes RE et al. 2017. Factors associated with participation in resistance training: a systematic review. *Br J Sports Med*. [PMID 28404558](https://pubmed.ncbi.nlm.nih.gov/28404558/)
10. Rhodes RE, Kates A. 2015. Can the Affective Response to Exercise Predict Future Motives and Physical Activity Behavior? *Ann Behav Med*. [PMID 25921307](https://pubmed.ncbi.nlm.nih.gov/25921307/)
11. Teixeira PJ et al. 2012. Exercise, physical activity, and self-determination theory: a systematic review. *Int J Behav Nutr Phys Act*. [PMID 22726453](https://pubmed.ncbi.nlm.nih.gov/22726453/)
12. Ntoumanis N et al. 2021. A meta-analysis of self-determination theory-informed intervention studies in the health domain. *Health Psychol Rev*. [PMID 31983293](https://pubmed.ncbi.nlm.nih.gov/31983293/)
13. Hermsen S et al. 2017. Determinants for Sustained Use of an Activity Tracker. *JMIR Mhealth Uhealth*. [PMID 29084709](https://pubmed.ncbi.nlm.nih.gov/29084709/)
14. Meyerowitz-Katz G et al. 2020. Rates of Attrition and Dropout in App-Based Interventions for Chronic Disease. *J Med Internet Res*. [PMID 32990635](https://pubmed.ncbi.nlm.nih.gov/32990635/)
15. Steinberg DM et al. 2013. The efficacy of a daily self-weighing weight loss intervention using smart scales and e-mail. *Obesity*. [PMID 23512320](https://pubmed.ncbi.nlm.nih.gov/23512320/)
16. Steinberg DM et al. 2015. Weighing every day matters: daily weighing improves weight loss and adoption of weight control behaviors. *J Acad Nutr Diet*. [PMID 25683820](https://pubmed.ncbi.nlm.nih.gov/25683820/)
17. Zheng Y et al. 2015. Self-weighing in weight management: a systematic literature review. *Obesity*. [PMID 25521523](https://pubmed.ncbi.nlm.nih.gov/25521523/)
18. Epton T et al. 2017. Unique effects of setting goals on behavior change: Systematic review and meta-analysis. *J Consult Clin Psychol*. [PMID 29189034](https://pubmed.ncbi.nlm.nih.gov/29189034/)
19. McEwan D et al. 2016. The effectiveness of multi-component goal setting interventions for changing physical activity behaviour. *Health Psychol Rev*. [PMID 26445201](https://pubmed.ncbi.nlm.nih.gov/26445201/)
20. Halperin I et al. 2022. Accuracy in Predicting Repetitions to Task Failure in Resistance Exercise. *Sports Med*. [PMID 34542869](https://pubmed.ncbi.nlm.nih.gov/34542869/)
21. Zourdos MC et al. 2016. Novel Resistance Training-Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. *J Strength Cond Res*. [PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/)
