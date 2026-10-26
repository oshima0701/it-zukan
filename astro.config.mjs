import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// 公開先が決まるまでは仮の値。GitHub Pages のサブパスになったら
// SITE_URL と BASE_PATH を渡すだけで、内部リンクとサイトマップが追従する。
const SITE = process.env.SITE_URL ?? 'https://example.invalid';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  build: {
    // CSSをHTMLに埋め込む。1枚のファイルだけ渡しても見た目が崩れない。
    inlineStylesheets: 'always',
  },
});
