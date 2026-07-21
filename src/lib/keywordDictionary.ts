// itemType判定のフォールバック用キーワード辞書。
// カテゴリ情報から判定できない場合のみ、ここに列挙した語がタグ・説明文に
// 含まれるかで判定する(単純な大小文字区別なし部分一致)。
// コミュニティ資産として育てる想定のため、この辞書はPRで追加・修正しやすいよう
// 判定ロジック(classify.ts)から分離している。

export const AVATAR_KEYWORDS: readonly string[] = [
  'アバター',
  'オリジナル3Dモデル',
  'オリジナルアバター',
  'avatar',
];

export const NON_AVATAR_KEYWORDS: readonly string[] = [
  '衣装',
  '髪型',
  'ヘア',
  'アクセサリ',
  'テクスチャ',
  'シェーダー',
  'ギミック',
  '差分',
];
