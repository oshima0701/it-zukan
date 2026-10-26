// 出典と本文のリンクが生きているかを確かめる。
// 出典が死んでいたら出典として成立しないので、機械で見る。
//
// ネットに繋がっていないときは何も確かめられないので、その場合は素通りする。
// 普段のビルドには入れず、`npm run links` で明示的に流す。

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirs = ['src/content/zukan', 'src/content/events', 'src/content/notes'];

const urls = new Map(); // url -> [どのファイルで使われているか]

for (const d of dirs) {
  const full = join(root, d);
  if (!existsSync(full)) continue;
  for (const f of readdirSync(full).filter((x) => /\.mdx?$/.test(x))) {
    const raw = readFileSync(join(full, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) continue;
    let data = {};
    try { data = parseYaml(m[1]) ?? {}; } catch { continue; }

    const found = [];
    for (const s of data.sources ?? []) if (s?.url) found.push(s.url);
    if (data.officialUrl) found.push(data.officialUrl);
    for (const x of m[2].matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) found.push(x[1]);
    for (const x of m[2].matchAll(/href="(https?:\/\/[^"]+)"/g)) found.push(x[1]);

    for (const u of found) {
      if (!urls.has(u)) urls.set(u, []);
      urls.get(u).push(f);
    }
  }
}

if (urls.size === 0) { console.log('確かめるリンクがありません。'); process.exit(0); }

const check = async (url) => {
  const opts = {
    redirect: 'follow',
    headers: { 'user-agent': 'Mozilla/5.0 (link check for a personal site)' },
    signal: AbortSignal.timeout(20000),
  };
  try {
    let r = await fetch(url, { ...opts, method: 'HEAD' });
    // HEAD を断るサーバーがあるので、その場合は GET で確かめ直す
    if (r.status === 405 || r.status === 403 || r.status === 501) {
      r = await fetch(url, { ...opts, method: 'GET' });
    }
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, status: e.name === 'TimeoutError' ? '時間切れ' : e.message };
  }
};

const list = [...urls.keys()];
console.log(`${list.length} 本のリンクを確かめます…`);

const bad = [];
const size = 6;
for (let i = 0; i < list.length; i += size) {
  const batch = list.slice(i, i + size);
  const results = await Promise.all(batch.map(check));
  results.forEach((r, j) => {
    const u = batch[j];
    if (!r.ok) bad.push({ url: u, status: r.status, files: [...new Set(urls.get(u))] });
  });
  process.stdout.write(`  ${Math.min(i + size, list.length)} / ${list.length}\r`);
}
console.log('');

if (bad.length) {
  console.error(`\nつながらなかったリンク ${bad.length} 本:`);
  for (const b of bad) console.error(`  × [${b.status}] ${b.url}\n      使っている場所: ${b.files.join(', ')}`);
  console.error('\nネットに繋がっていない場合もここに出ます。接続を確かめてから見てください。');
  process.exit(1);
}
console.log(`リンクはすべて生きています。${list.length} 本。`);
