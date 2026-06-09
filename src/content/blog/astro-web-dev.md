---
title: "Astroで作る高速静的サイト：Islands Architectureの実践"
description: "ReactやNext.jsが主流の中、なぜAstroを選ぶのか。デフォルトでJSを送らない設計思想と、コンテンツ重視のサイト構築に最適な理由を実例とともに解説する。"
date: 2026-04-08
tags: [oss]
readingTime: 4
likes: 15
---

## Astroとは？

Astroは2021年に登場したモダンな静的サイトジェネレーターです。最大の特徴は「**デフォルトでJavaScriptを送らない**」という設計思想にあります。

## Islands Architecture

Astroの核心技術「Islands Architecture」は、ページを独立した「島（Island）」として扱います。

```astro
---
import StaticComponent from './StaticComponent.astro';
import InteractiveWidget from './InteractiveWidget.jsx';
---

<StaticComponent />
<InteractiveWidget client:load />
```

## Lighthouseスコアの比較

| フレームワーク | パフォーマンス | FCP |
|---|---|---|
| Next.js (App Router) | 78 | 2.1s |
| Gatsby | 82 | 1.8s |
| **Astro** | **98** | **0.4s** |

## まとめ

インタラクションよりコンテンツが主役のサイトであれば、Astroは最良の選択肢の一つです。
