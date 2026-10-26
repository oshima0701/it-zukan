// 本文に出てきた用語を、図鑑内の該当ページへ自動でつなぐ。
//
// 手でリンクを書く形にすると、新しい項目を足すたびに既存の全ページを
// 直すことになり、「.mdx を1つ足すだけで増やせる」が崩れる。だから自動にする。
//
// つなぐときの決まり:
//   ・1ページにつき、同じ用語は最初の1回だけ（本文がリンクだらけにならないように）
//   ・自分自身のページへはつながない
//   ・コード・既存のリンク・見出しの中は触らない
//   ・まだ書いていない項目（draft）へはつながない
//   ・長い名前から先に当てる（「Claude Code」を「Claude」より先に）

const SKIP_TAGS = new Set(['a', 'code', 'pre', 'kbd', 'samp', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style']);

const BACKSLASH = String.fromCharCode(92);
const escapeRe = (s) => s.replace(/[-.*+?^${}()|[\]]/g, (c) => BACKSLASH + c);

// 英数字の用語は、前後が英数字でないときだけ当てる（Git が Github に当たらないように）
const isAsciiWord = (s) => /^[\x20-\x7e]+$/.test(s);
const asciiEdge = /[0-9A-Za-z_-]/;

export default function rehypeZukanLinks({ entries = [], base = '/' } = {}) {
  const terms = [];
  for (const e of entries) {
    const key = e.key ?? ('zukan:' + e.slug);
    const href = e.href ?? `${base}zukan/${e.slug}/`;
    for (const t of e.terms) if (t && t.length >= 2) terms.push({ term: t, key, href });
  }
  terms.sort((a, b) => b.term.length - a.term.length);
  if (terms.length === 0) return () => {};

  const pattern = new RegExp(terms.map((t) => escapeRe(t.term)).join('|'), 'g');
  const targetOf = new Map(terms.map((t) => [t.term, t]));

  return (tree, file) => {
    const path = String(file?.history?.[0] ?? file?.path ?? '');
    const selfSlug = path.split(BACKSLASH).join('/').split('/').pop()?.replace(/\.mdx?$/, '') ?? '';
    const linked = new Set();

    const walk = (node, parentTag) => {
      if (!node || !node.children) return;
      const next = [];
      for (const child of node.children) {
        if (child.type === 'element') {
          const tag = child.tagName;
          if (!SKIP_TAGS.has(tag)) walk(child, tag);
          next.push(child);
          continue;
        }
        if (child.type !== 'text' || SKIP_TAGS.has(parentTag)) { next.push(child); continue; }

        const text = child.value;
        pattern.lastIndex = 0;
        let last = 0;
        let out = null;
        let m;
        while ((m = pattern.exec(text)) !== null) {
          const term = m[0];
          const target = targetOf.get(term);
          if (!target) continue;
          if (target.key === 'zukan:' + selfSlug || linked.has(target.key)) continue;

          if (isAsciiWord(term)) {
            const before = text[m.index - 1];
            const after = text[m.index + term.length];
            if ((before && asciiEdge.test(before)) || (after && asciiEdge.test(after))) continue;
          }

          out ??= [];
          if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
          out.push({
            type: 'element',
            tagName: 'a',
            properties: { href: target.href, className: ['zukan-link'] },
            children: [{ type: 'text', value: term }],
          });
          linked.add(target.key);
          last = m.index + term.length;
        }

        if (out) {
          if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
          next.push(...out);
        } else {
          next.push(child);
        }
      }
      node.children = next;
    };

    walk(tree, null);
  };
}
