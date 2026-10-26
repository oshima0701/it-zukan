// 画面に出る言葉と、内部の記号の対応。表示を変えたくなったらここだけ直す。

export const TYPES = {
  language: { label: '言語', badge: '言語タイプ', blurb: 'コンピュータに指示を書くためのことば' },
  tool: { label: 'ツール', badge: 'ツールタイプ', blurb: '書く・動かす・記録するための道具' },
  ai: { label: 'AI', badge: 'AIタイプ', blurb: '頼むと書いてくれる相棒と、その使い方' },
  place: { label: '場所', badge: '場所タイプ', blurb: 'プログラムが動いている先' },
  mechanism: { label: 'しくみ', badge: 'しくみタイプ', blurb: '裏側で決まっている約束ごと' },
  data: { label: 'データ', badge: 'データタイプ', blurb: '記録をためておくところ' },
} as const;

export type TypeKey = keyof typeof TYPES;
export const TYPE_ORDER: TypeKey[] = ['language', 'tool', 'ai', 'place', 'mechanism', 'data'];

// 何日たったら「情報が古い可能性があります」と添えるか。null は添えない。
export const STALE_AFTER_DAYS: Record<TypeKey, number | null> = {
  language: null,
  tool: null,
  ai: 180,
  place: null,
  mechanism: null,
  data: null,
};

export const STATUS_LABELS = {
  difficulty: '難易度',
  popularity: '人気',
  breadth: '活躍場所',
} as const;

export const SITE_TITLE = 'IT技術図鑑';
export const SITE_TAGLINE = '誕生年・生みの親・名前の由来から覚える';
export const FOOTER_NOTE = '個人の学習記録です。';
