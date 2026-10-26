// 写真の登録簿。ページからは id で参照する（<Photo id="..." />）。
// 1枚につきここに1行だけ書く。同じ写真を複数ページで使ってもクレジットは1か所。
// クレジットページ（/credit/）はこの登録簿から作る。
//
// 利用条件が明記された画像だけを入れる。author・license・source は必須。

export type ImageEntry = {
  file: string;        // public/images/ の中のファイル名
  caption: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;      // 入手元のページ
  width: number;
  height: number;
};

export const IMAGES: Record<string, ImageEntry> = {
  // 例（まだ画像を入れていないので空。段3で実物を入れる）
};
