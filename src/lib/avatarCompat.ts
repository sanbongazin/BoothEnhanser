// 商品詳細ページから「対応アバター」候補を抽出するモジュール。
//
// 実セッションで確認済み(2026-07-22): BOOTHの商品詳細ページ(例: https://booth.pm/ja/items/7837186)は
// サーバーサイドレンダリングされており、fetch()+DOMParserだけでJS実行なしに
// バリエーション名(`.variation-item .variation-name`)と説明文(`.js-market-item-detail-description`)
// を取得できる。
//
// 精度の異なる2つの抽出方法を優先度順に使う:
// 1. 説明文中の「アバター名の行 → (空行を挟むこともある) → そのアバターの商品ページへのリンク行」
//    というペア(出品者が対応アバター一覧を手動でリンク付き掲載しているケース)。これは他のBOOTH
//    商品への実リンクを伴うため、バリエーション名からの推測より信頼度が高い。
// 2. 上記が無い商品(バリエーションのみで対応アバターを表現しているケース)向けのフォールバックとして、
//    バリエーション名から装飾(「〜対応」「＝〜＝」「－〜－」等)を剥がしたもの。
//
// どちらの経路で拾った候補も、最終的にknownAvatars.tsのホワイトリストに載っている名前だけを
// 残す。汎用語のブロックリストだけでは「防止テープル」のような無関係な語を防ぎきれず
// (店舗ごとの命名が自由すぎていたちごっこになる)、ホワイトリスト方式の方が誤検出を
// 確実に抑えられるため。副作用として、ホワイトリストに無いアバターへの対応は検出されない。
//
// DOM(Document)への依存はextractAvatarCompatTagsだけに閉じ込め、実際の抽出ロジックは
// プレーンな文字列を受け取る純粋関数にしている(DOM無しのNode環境でもテストできるようにするため)。

import { isKnownAvatarName } from './knownAvatars';

const BOOTH_ITEM_URL_PATTERN = /^https?:\/\/[^\s/]+\.?booth\.pm\/(?:[a-z]{2}\/)?items\/\d+/i;

// 実セッションで確認済み(2026-07-22): バリエーション名は「マヌカ用 - Manuka -」のように
// 日本語名とローマ字名を「-」区切りで1つの文字列にまとめている店舗もある。単純に
// 装飾を剥がしただけでは全体が丸ごとホワイトリストに一致しないため、区切り文字で
// トークンに分割してから1つずつ照合する。
const TOKEN_SEPARATOR_PATTERN = /[＝=－\-_]+/;

/** 「名前対応」「名前用」のような接尾辞を剥がして名前本体を取り出す。 */
function stripTrailingSuffix(raw: string): string {
  return raw.trim().replace(/(対応|用)$/, '').trim();
}

/**
 * 説明文中の「名前行 → booth.pmの商品リンク行」のペアからアバター名を抽出する。
 * リンク行の直前1〜2行以内(空行を1つ許容)にある、それ自身はURLでない行を名前候補とし、
 * ホワイトリスト(knownAvatars.ts)に載っているものだけを残す。
 */
export function extractAvatarNamesFromDescriptionText(descriptionText: string): string[] {
  const lines = descriptionText.split('\n').map((line) => line.trim());
  const names: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!BOOTH_ITEM_URL_PATTERN.test(lines[i] ?? '')) continue;

    for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
      const candidate = lines[j];
      if (!candidate) continue;
      if (BOOTH_ITEM_URL_PATTERN.test(candidate)) break;
      if (isKnownAvatarName(candidate)) names.push(candidate);
      break;
    }
  }

  return names;
}

/**
 * バリエーション名の一覧から装飾を剥がし、ホワイトリスト(knownAvatars.ts)に載っている
 * ものだけをアバター名候補として抽出する。1つのバリエーション名を「-」等の区切り文字で
 * トークンに分割し(日本語名+ローマ字名の併記に対応するため)、最初にホワイトリストへ
 * 一致したトークンを採用する。
 */
export function extractAvatarNamesFromVariationNames(variationNames: readonly string[]): string[] {
  const names: string[] = [];

  for (const raw of variationNames) {
    const tokens = raw
      .split(TOKEN_SEPARATOR_PATTERN)
      .map((token) => stripTrailingSuffix(token))
      .filter(Boolean);
    const matched = tokens.find((token) => isKnownAvatarName(token));
    if (matched) names.push(matched);
  }

  return names;
}

/**
 * 商品詳細ページのDocumentから対応アバター名候補を抽出する。
 * 説明文のリンク一覧を優先し、無ければバリエーション名にフォールバックする。
 */
export function extractAvatarCompatTags(doc: Document): string[] {
  const descriptionText =
    doc.querySelector<HTMLElement>('.js-market-item-detail-description')?.textContent ?? '';
  const fromDescription = extractAvatarNamesFromDescriptionText(descriptionText);
  if (fromDescription.length > 0) return [...new Set(fromDescription)];

  const variationNames = Array.from(
    doc.querySelectorAll<HTMLElement>('.variation-item .variation-name'),
  ).map((el) => el.textContent ?? '');
  return [...new Set(extractAvatarNamesFromVariationNames(variationNames))];
}
