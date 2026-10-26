// 自動リンクに使う用語の一覧を集める。
//
// 2か所から集める。
//   ・図鑑の項目（src/content/zukan）→ その項目のページへ
//   ・用語辞典（src/content/terms）  → 用語辞典のその見出しへ
// 同じ言葉が両方にあるときは、図鑑の項目を優先する（本体の説明があるほう）。

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(dir, ext) {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  const out = [];
  for (const f of readdirSync(full).filter((x) => x.endsWith(ext))) {
    const raw = readFileSync(join(full, f), 'utf8');
    // 冒頭の --- で囲まれた部分だけ取り出す（正規表現を使わない）
    const parts = raw.split('---');
    if (parts.length < 3) continue;
    let data;
    try { data = parseYaml(parts[1]); } catch { continue; }
    if (!data || data.draft) continue;
    out.push({ slug: f.slice(0, f.length - ext.length), data });
  }
  return out;
}

export function collectTerms(base = '/') {
  const entries = [];
  const seen = new Set();

  // 図鑑の項目が先。同じ言葉が用語辞典にもあれば、図鑑のほうを使う。
  for (const { slug, data } of read('src/content/zukan', '.mdx')) {
    const words = [data.name, data.reading, ...(data.aliases ?? [])].filter(Boolean);
    for (const w of words) seen.add(w);
    entries.push({ key: 'zukan:' + slug, href: base + 'zukan/' + slug + '/', terms: words });
  }

  for (const { slug, data } of read('src/content/terms', '.md')) {
    const words = [data.name, ...(data.aliases ?? [])].filter(Boolean).filter((w) => !seen.has(w));
    if (words.length === 0) continue;
    entries.push({ key: 'yougo:' + slug, href: base + 'yougo/#' + slug, terms: words });
  }

  return entries;
}
