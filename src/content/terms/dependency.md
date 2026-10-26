---
name: 依存関係
reading: いぞんかんけい
oneLine: あるものが動くために、ほかに必要なもののつながり。
category: dev
aliases: [依存, dependency]
related: [library, build]
sources:
  - id: 1
    title: Dependency hell - Wikipedia
    url: https://en.wikipedia.org/wiki/Dependency_hell
    accessed: 2026-10-26
updated: 2026-10-26
---

AがBを使い、BがCを使う。この連なりが依存関係です。

ひとつ取り込むと、その先にぶら下がっているものまで一緒に入ってきます。だから部品の数は思った以上に増えます。

どこか1つが壊れたり、公開を取り下げられたりすると、その上に乗っているもの全部が動かなくなります。実際にそういう事故が起きています。
