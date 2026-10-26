---
name: ブランチ
reading: ぶらんち
oneLine: 本線を触らずに作業するための、枝分かれした道。
category: git
aliases: [branch]
related: [merge, conflict]
sources:
  - id: 1
    title: Git - git-branch Documentation
    url: https://git-scm.com/docs/git-branch
    accessed: 2026-10-26
updated: 2026-10-26
---

いまうまく動いているものを壊さずに、新しいことを試したい。そのために履歴を枝分かれさせます。枝の上でいくら壊しても、本線は無事です。

試した結果がよければ、本線に合流させます（[マージ](#merge)）。だめなら枝ごと捨てれば、何も残りません。

英語の branch は「枝」です。本線のほうは main と呼ばれることが多く、以前は master という名前が使われていました。
