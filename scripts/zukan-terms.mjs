// 自動リンクに使う用語の一覧を、図鑑の .mdx から集める。
// 名前・読み方・別名を拾い、まだ書いていないもの（draft）は外す。

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content/zukan');

export function collectTerms() {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    let data;
    try { data = parseYaml(m[1]); } catch { continue; }
    if (!data || data.draft) continue;
    const terms = [data.name, data.reading, ...(data.aliases ?? [])].filter(Boolean);
    out.push({ slug: f.replace(/\.mdx$/, ''), terms });
  }
  return out;
}
