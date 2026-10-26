import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeZukanLinks from './scripts/rehype-zukan-links.mjs';
import { collectTerms } from './scripts/zukan-terms.mjs';

// 公開先が決まるまでは仮の値。GitHub Pages のサブパスになったら
// SITE_URL と BASE_PATH を渡すだけで、内部リンクとサイトマップが追従する。
const SITE = process.env.SITE_URL ?? 'https://example.invalid';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  markdown: {
    // 本文の用語を図鑑内の該当ページへ自動でつなぐ（手書きのリンクは不要）
    rehypePlugins: [[rehypeZukanLinks, { entries: collectTerms(), base: BASE }]],
  },
  build: {
    // CSSをHTMLに埋め込む。1枚のファイルだけ渡しても見た目が崩れない。
    inlineStylesheets: 'always',
  },
});
