// 出来上がったページの中のリンクを実際に辿って、行き先が存在するかを確かめる。
//
// URLを直接叩く確認では、リンクの書き間違いを見つけられない。
// 2026-10-26、/it-zukan/ を取り除かずに相対化したせいで
// すべての内部リンクが /it-zukan/it-zukan/... を指していたのを見逃した。
// その再発を止めるための検査。

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const BASE = (process.env.BASE_PATH ?? '/').replace(/^\/+/, '').replace(/\/+$/, '');

if (!existsSync(dist)) {
  console.error('dist がありません。先に npm run build を流してください。');
  process.exit(1);
}

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const bad = [];
let checked = 0;

for (const file of htmlFiles(dist)) {
  const isNotFoundPage = relative(dist, file) === '404.html';
  const html = readFileSync(file, 'utf8');

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue; // http: mailto: data: など
    if (raw.startsWith('//') || raw.startsWith('#')) continue;

    const [path] = raw.split('#');
    if (!path) continue;

    let target;
    if (path.startsWith('/')) {
      // 404 ページだけは公開先の住所をそのまま持つ
      let p = path.slice(1);
      if (BASE && (p === BASE || p.startsWith(BASE + '/'))) p = p.slice(BASE.length + 1);
      target = join(dist, p);
    } else {
      target = resolve(dirname(file), path);
    }

    if (target.endsWith(sep) || target.endsWith('/')) target = join(target, 'index.html');

    checked++;
    if (!existsSync(target)) {
      bad.push({
        page: relative(dist, file).split(sep).join('/'),
        link: raw,
        looked: relative(dist, target).split(sep).join('/'),
        note: isNotFoundPage ? '（404ページ）' : '',
      });
    }
  }
}

if (bad.length) {
  console.error(`\n行き先の無いリンク ${bad.length} 本:`);
  for (const b of bad.slice(0, 40)) {
    console.error(`  × ${b.page} ${b.note}\n      リンク: ${b.link}\n      探した先: ${b.looked}`);
  }
  if (bad.length > 40) console.error(`  …ほか ${bad.length - 40} 本`);
  process.exit(1);
}

console.log(`ページの中のリンクはすべて行き先があります。${checked} 本。`);
