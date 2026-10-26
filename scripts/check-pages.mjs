// ページ構成の検査。npm run check / npm run build から呼ばれる。
//
// 文章の約束ではなく機械で止めるためのもの。書いておくだけの決まりは破られる。
// 止めること:
//   1. ブロックの印が足りない／順番が違う
//   2. <Cite n={N}> と frontmatter の sources の番号が食い違う
//   3. <Photo id="..."> が画像の登録簿にない
//   4. 図解が1枚もない／指した図解のファイルが無い
//   5. 色や大きさを変える強調が本文にある
//   6. 図鑑番号（no）の重複
//   7. 同じ人が2ページ以上に出るのに wikidata が無い（相関図で別人になる）

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// 既定は src/content/zukan。おとり試験のときだけ引数でフォルダを差し替える。
const zukanDir = process.argv[2] ? process.argv[2] : join(root, 'src/content/zukan');
const figuresDir = join(root, 'src/components/figures');
const imagesFile = join(root, 'src/data/images.ts');

// ブロックの印。順番どおりに並んでいなければならない。
const BLOCKS = [
  { key: 'birth', label: '誕生物語', required: true },
  { key: 'naming', label: '名前の由来', required: true },
  { key: 'analogy', label: 'たとえ話', required: true },
  { key: 'figure', label: '図解', required: true },
  { key: 'photo', label: '写真', required: false },
  { key: 'skills', label: '得意技', required: true },
  { key: 'you', label: 'あなたとの関係', required: true },
  { key: 'internet', label: 'ネットでの扱われ方', required: false },
  { key: 'incident', label: 'やらかし事件簿', required: false },
  { key: 'misunderstanding', label: 'よくある誤解', required: false },
  { key: 'firststep', label: '最初の一歩', required: true },
  { key: 'materials', label: '無料教材', required: true },
];

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

// 画像の登録簿の id を読む（TypeScript をそのまま解析せず、キーだけ拾う）
let imageIds = new Set();
if (existsSync(imagesFile)) {
  const src = readFileSync(imagesFile, 'utf8');
  const body = src.slice(src.indexOf('IMAGES: Record<string, ImageEntry> = {'));
  for (const m of body.matchAll(/^\s{2}([A-Za-z0-9_-]+)\s*:\s*\{/gm)) imageIds.add(m[1]);
}

const figureNames = existsSync(figuresDir)
  ? new Set(readdirSync(figuresDir).filter((f) => f.endsWith('.astro')).map((f) => f.replace(/\.astro$/, '')))
  : new Set();

const files = existsSync(zukanDir)
  ? readdirSync(zukanDir).filter((f) => f.endsWith('.mdx'))
  : [];

if (files.length === 0) {
  console.log('検査: src/content/zukan に .mdx がありません。');
  process.exit(0);
}

const seenNo = new Map();
const creatorPages = new Map(); // 人名 -> { pages: [], wikidata: Set }

for (const file of files) {
  const raw = readFileSync(join(zukanDir, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) { fail(file, 'frontmatter（冒頭の --- で囲んだ部分）がありません'); continue; }

  let data;
  try { data = parseYaml(m[1]); }
  catch (e) { fail(file, `frontmatter が YAML として読めません: ${e.message}`); continue; }
  const body = m[2];

  // --- 6. 図鑑番号の重複
  if (data?.no != null) {
    if (seenNo.has(data.no)) fail(file, `図鑑番号 ${data.no} が ${seenNo.get(data.no)} と重複しています`);
    else seenNo.set(data.no, file);
  }

  // --- 1. ブロックの印
  const found = [...body.matchAll(/\{\/\*\s*block:\s*([a-z-]+)\s*\*\/\}/g)].map((x) => x[1]);
  const known = new Set(BLOCKS.map((b) => b.key));
  for (const k of found) if (!known.has(k)) fail(file, `知らないブロックの印です: ${k}`);

  for (const b of BLOCKS) {
    if (b.required && !found.includes(b.key)) fail(file, `ブロック「${b.label}」(${b.key}) がありません`);
  }
  const dupes = found.filter((k, i) => found.indexOf(k) !== i);
  if (dupes.length) fail(file, `ブロックの印が重複しています: ${[...new Set(dupes)].join(', ')}`);

  const expectedOrder = BLOCKS.map((b) => b.key).filter((k) => found.includes(k));
  const actualOrder = found.filter((k) => known.has(k));
  if (expectedOrder.join('>') !== actualOrder.join('>')) {
    fail(file, `ブロックの順番が決まりと違います。\n    あるべき順: ${expectedOrder.join(' > ')}\n    いまの順　: ${actualOrder.join(' > ')}`);
  }

  // --- 2. 出典の番号
  const cited = new Set([...body.matchAll(/<Cite\s+n=\{(\d+)\}/g)].map((x) => Number(x[1])));
  const declared = new Set((data?.sources ?? []).map((s) => s.id));
  for (const n of cited) if (!declared.has(n)) fail(file, `本文が出典 [${n}] を指していますが、sources にありません`);
  for (const n of declared) if (!cited.has(n)) fail(file, `出典 [${n}] が sources にありますが、本文から参照されていません`);

  // --- 3. 写真
  for (const x of body.matchAll(/<Photo\s+id="([^"]+)"/g)) {
    if (!imageIds.has(x[1])) fail(file, `写真 "${x[1]}" が画像の登録簿（src/data/images.ts）にありません`);
  }

  // --- 4. 図解
  const figs = [...body.matchAll(/<Figure\s+name="([^"]+)"/g)].map((x) => x[1]);
  if (figs.length === 0) fail(file, '図解が1枚もありません（最低1枚）');
  for (const name of figs) {
    if (!figureNames.has(name)) fail(file, `図解 "${name}" のファイルがありません（src/components/figures/${name}.astro）`);
  }
  for (const f of body.matchAll(/<Figure(?![^>]*\scaption=)/g)) {
    void f; fail(file, '図解に caption（説明文）がありません');
  }

  // --- 5. 強調
  // 色や大きさを変える強調は「今日のひとこと」(takeaway) の自動描画だけ。
  // 本文側に強調用の部品は置かないので、使われていれば止める。
  for (const bad of ['<Highlight', '<Em', '<Mark', '<mark']) {
    if (body.includes(bad)) fail(file, `本文に強調（${bad}）が使われています。強調は「今日のひとこと」1か所だけです`);
  }

  // --- 7. 人物の同一視
  for (const c of data?.creators ?? []) {
    if (!c?.name) continue;
    const rec = creatorPages.get(c.name) ?? { pages: [], wikidata: new Set() };
    rec.pages.push(file);
    if (c.wikidata) rec.wikidata.add(c.wikidata);
    creatorPages.set(c.name, rec);
  }
}

for (const [name, rec] of creatorPages) {
  if (rec.pages.length >= 2 && rec.wikidata.size === 0) {
    warn(rec.pages.join(', '), `「${name}」が2ページ以上に出ますが wikidata がありません。人物相関図で別人になります`);
  }
}

if (warnings.length) {
  console.log(`\n気をつける点 ${warnings.length} 件:`);
  for (const w of warnings) console.log(`  - ${w}`);
}

if (errors.length) {
  console.error(`\n検査で止めました。${errors.length} 件:`);
  for (const e of errors) console.error(`  × ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`検査を通りました。${files.length} ページ。`);
