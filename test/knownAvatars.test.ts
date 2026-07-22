import { describe, expect, it } from 'vitest';
import { isKnownAvatarName } from '../src/lib/knownAvatars';

describe('isKnownAvatarName', () => {
  it('ホワイトリストに載っている名前はtrue', () => {
    expect(isKnownAvatarName('マヌカ')).toBe(true);
    expect(isKnownAvatarName('Shinano')).toBe(true);
  });

  it('愛称接尾辞(ちゃん/さん/様/くん)を剥がして照合する', () => {
    expect(isKnownAvatarName('マヌカちゃん')).toBe(true);
    expect(isKnownAvatarName('輝夜ちゃん')).toBe(true);
  });

  it('大文字小文字を区別しない', () => {
    expect(isKnownAvatarName('manuka')).toBe(true);
    expect(isKnownAvatarName('MANUKA')).toBe(true);
  });

  it('ホワイトリストに無い名前はfalse', () => {
    expect(isKnownAvatarName('防止テープル')).toBe(false);
    expect(isKnownAvatarName('フルパック')).toBe(false);
  });

  it('部分一致: 「シフォン(ライム)」のように複数名併記の中に含まれていてもtrue', () => {
    expect(isKnownAvatarName('シフォン(ライム)')).toBe(true);
    expect(isKnownAvatarName('Chiffon (Lime)')).toBe(true);
  });
});
