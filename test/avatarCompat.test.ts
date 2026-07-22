import { describe, expect, it } from 'vitest';
import {
  extractAvatarNamesFromDescriptionText,
  extractAvatarNamesFromVariationNames,
} from '../src/lib/avatarCompat';

describe('extractAvatarNamesFromDescriptionText', () => {
  it('「名前+商品リンク」ペアから抽出する(ホワイトリストに載っている名前のみ)', () => {
    const text = [
      '仙猫',
      'https://sashimaru.booth.pm/items/5187788',
      'マヌカ',
      'https://jingo1016.booth.pm/items/5058077',
      '森羅',
      '',
      'ルルネ',
      'https://paryi.booth.pm/items/5957830',
    ].join('\n');

    expect(extractAvatarNamesFromDescriptionText(text)).toEqual(['仙猫', 'マヌカ', 'ルルネ']);
  });

  it('リンクが無ければ空配列を返す', () => {
    expect(extractAvatarNamesFromDescriptionText('薄手のスウェットです。')).toEqual([]);
  });

  it('ホワイトリストに無い語(説明文の地の文含む)は名前として拾わない', () => {
    const text = [
      'マヌカ',
      'https://jingo1016.booth.pm/items/5058077',
      'アバターの詳細は以下URLです」',
      'https://example.booth.pm/items/1234567',
    ].join('\n');

    expect(extractAvatarNamesFromDescriptionText(text)).toEqual(['マヌカ']);
  });
});

describe('extractAvatarNamesFromVariationNames', () => {
  it('「〜対応」「＝〜＝」の装飾を剥がしてホワイトリストと照合する', () => {
    expect(extractAvatarNamesFromVariationNames(['マヌカ対応', '＝Shinano＝'])).toEqual([
      'マヌカ',
      'Shinano',
    ]);
  });

  it('ホワイトリストに無い語(フルパック等の汎用バリエーション名含む)は除外する', () => {
    expect(
      extractAvatarNamesFromVariationNames([
        '-Fullpack-',
        '－Fullset－（支援版）',
        '防止テープル(1軒)',
        'しなの対応',
      ]),
    ).toEqual(['しなの']);
  });

  it('空配列を渡せば空配列を返す', () => {
    expect(extractAvatarNamesFromVariationNames([])).toEqual([]);
  });

  it('「〜用」の装飾も剥がす', () => {
    expect(extractAvatarNamesFromVariationNames(['カリン用', 'ラシューシャ用'])).toEqual([
      'カリン',
      'ラシューシャ',
    ]);
  });

  it('愛称接尾辞(ちゃん等)を正規化してホワイトリストと照合する', () => {
    expect(extractAvatarNamesFromVariationNames(['マヌカちゃん対応', '輝夜ちゃん対応'])).toEqual([
      'マヌカちゃん',
      '輝夜ちゃん',
    ]);
  });

  it('「日本語名用 - ローマ字名 -」形式(実セッションで確認済み: booth.pm/ja/items/6151859)を分解して照合する', () => {
    expect(
      extractAvatarNamesFromVariationNames([
        'マヌカ用 - Manuka -',
        'セレスティア用 - Selestia -',
        '狛乃- Komano -',
        '+Head- +Head -',
      ]),
    ).toEqual(['マヌカ', 'セレスティア', '狛乃']);
  });

  it('括弧で複数名併記されたバリエーション名(実セッションで確認済み: booth.pm/ja/items/6151859)も部分一致で拾う', () => {
    expect(extractAvatarNamesFromVariationNames(['シフォン(ライム)用- Chiffon (Lime) -'])).toEqual([
      'シフォン(ライム)',
    ]);
  });
});
