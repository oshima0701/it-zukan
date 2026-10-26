// ビルド後の後始末。dist の中の .html を「ダブルクリックで開ける」形に直す。
//
// サーバー越しなら /zukan/git/ で開けるが、ファイルを直接開く（file://）ときは
//   ・先頭が / のリンクはドライブの根に飛んでしまう → 相対パスに直す
//   ・フォルダで終わるリンクは中身が出ない → index.html まで書く
// この2つを直すと、どこに置いても、ネットに繋がっていなくても開ける。
// CSSは astro.config.mjs の inlineStylesheets で既にHTMLに埋め込まれている。

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of htmlFiles(dist)) {
  // 404 は「無い住所」に対してどの深さからでも返されるので、相対パスにできない。
  // ここだけは公開先の住所をそのまま残す。
  if (relative(dist, file) === '404.html') continue;

  const depth = relative(dist, dirname(file)).split(sep).filter(Boolean).length;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  let html = readFileSync(file, 'utf8');
  const before = html;

  // 先頭が / のリンクを相対パスに（// で始まる外部URLは触らない）
  html = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_m, attr, path) => `${attr}="${prefix}${path}"`);

  // フォルダで終わるリンクは index.html まで書く。
  // 外部サイト（https:// など）とページ内リンク（#）には触らない。
  html = html.replace(/href="([^"]*?)\/"/g, (m, path) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('#') || path.startsWith('//')) return m;
    return `href="${path}/index.html"`;
  });
  html = html.replace(/href="((?:\.\.\/)+)"/g, (_m, up) => `href="${up}index.html"`);
  html = html.replace(/href="\.\/"/g, 'href="./index.html"');

  if (html !== before) { writeFileSync(file, html); changed++; }
}

console.log(`ダブルクリックで開ける形に直しました: ${changed} ページ（dist/index.html から開けます）`);
