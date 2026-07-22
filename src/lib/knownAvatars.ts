// VRChatの著名アバター名のホワイトリスト。
//
// avatarCompat.tsの抽出結果(商品説明文/バリエーション名からのベストエフォート抽出)は、
// 「販売終了」「防止テープル」のような無関係な語を拾ってしまうことがあり、汎用語の
// ブロックリストだけでは対応しきれない(店舗ごとの命名が自由すぎて、いたちごっこになる)。
// そのため「既知のアバター名にマッチしたものだけを残す」ホワイトリスト方式に切り替える。
// 副作用として、ここに載っていない(まだ知られていない/マイナーな)アバターへの対応は
// 検出できなくなる。精度を優先するトレードオフとして許容する。
//
// 実セッションで確認済み(2026-07-22): 以下は実際にBOOTHの商品バリエーション名・説明文
// (対応アバター一覧)に登場した名前(表記ゆれ・ローマ字表記込み)。キーワード辞書
// (keywordDictionary.ts)と同様、コミュニティ資産として育てる想定でPRで追加・修正しやすい
// よう判定ロジック(avatarCompat.ts)から分離している。まだ知らないアバターがあれば
// ここに追記するだけで対応できる。
export const KNOWN_AVATAR_NAMES: readonly string[] = [
  '仙猫',
  '射狼',
  'マヌカ',
  'Manuka',
  'ラシューシャ',
  'Lasyusha',
  '真央',
  'Mao',
  'キプフェル',
  'Kipfel',
  '森羅',
  'Shinra',
  'ルルネ',
  'rurune',
  'ミルティナ',
  'Milltina',
  'ミルフィ',
  'しなの',
  'Shinano',
  'Haze',
  '海咲',
  'ルミナ',
  'Lumina',
  'Misaki',
  'セレナ',
  'Selena',
  '斑霞',
  'Hanka',
  '彼方',
  'Kanata',
  'テッキー',
  'Techie',
  'Adenophora',
  'Velno',
  '愛莉',
  '萌',
  'Moe',
  'エク',
  'Eku',
  '桔梗',
  'ライム',
  'Lime',
  'シフォン',
  'Chiffon',
  'しょこら',
  'ショコラ',
  'Sio',
  'しお',
  '凪',
  'Nagi',
  'ナルナ',
  'クマリ',
  'Kumaly',
  'マリシア',
  'Marycia',
  '輝夜',
  'Kaguya',
  '瑞希',
  'カリン',
  '結衣',
  // 実セッションで確認済み(2026-07-22): https://booth.pm/ja/items/6151859 のバリエーション名
  // (「マヌカ用 - Manuka -」形式)から確認。
  'Airi',
  'セレスティア',
  'Selestia',
  'ビナア',
  'Binah',
  '水瀬',
  'Minase',
  '狛乃',
  'Komano',
  '舞夜',
  'Maya'
];

// 「マヌカちゃん」「輝夜ちゃん」のような愛称接尾辞は、ホワイトリストへ表記ゆれごと
// 追加しなくても済むよう、比較前に正規化で剥がす。
const NAME_SUFFIXES_TO_STRIP: readonly string[] = ['ちゃん', 'さん', '様', 'くん'];

function normalizeAvatarNameForMatch(raw: string): string {
  let name = raw.trim();
  for (const suffix of NAME_SUFFIXES_TO_STRIP) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  }
  return name.toLowerCase();
}

const NORMALIZED_KNOWN_AVATAR_NAMES = KNOWN_AVATAR_NAMES.map(normalizeAvatarNameForMatch);

/**
 * 候補文字列が既知のアバター名を含んでいるか(表記ゆれ・愛称接尾辞を正規化した上で)判定する。
 * 完全一致ではなく部分一致にしているのは、「シフォン(ライム)用」のように1つのバリエーション名に
 * 複数のアバター名が併記されるケースがあり、完全一致だと丸ごと弾かれてしまうため。
 */
export function isKnownAvatarName(candidate: string): boolean {
  const normalized = normalizeAvatarNameForMatch(candidate);
  if (!normalized) return false;
  return NORMALIZED_KNOWN_AVATAR_NAMES.some((name) => normalized.includes(name));
}
