/** mulberry32: 小さく高速な決定論的PRNG。同じseedから常に同じ乱数列を生成する。 */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 日付文字列(例: 'YYYY-MM-DD')から決定論的な整数seedを作る(簡易ハッシュ)。 */
export function seedFromDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Fisher-Yatesシャッフル。元配列は変更せず新しい配列を返す。 */
export function fisherYatesShuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
