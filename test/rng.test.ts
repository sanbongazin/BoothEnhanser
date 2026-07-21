import { describe, expect, it } from 'vitest';
import { fisherYatesShuffle, mulberry32, seedFromDateString } from '../src/lib/rng';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('produces values within [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seedFromDateString', () => {
  it('is deterministic for the same string', () => {
    expect(seedFromDateString('2026-07-21')).toBe(seedFromDateString('2026-07-21'));
  });

  it('differs for different dates', () => {
    expect(seedFromDateString('2026-07-21')).not.toBe(seedFromDateString('2026-07-22'));
  });
});

describe('fisherYatesShuffle', () => {
  it('returns a permutation of the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = fisherYatesShuffle(input, mulberry32(1));
    expect(shuffled.length).toBe(input.length);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    fisherYatesShuffle(input, mulberry32(1));
    expect(input).toEqual(copy);
  });

  it('is deterministic for a given rng', () => {
    const input = [1, 2, 3, 4, 5];
    const a = fisherYatesShuffle(input, mulberry32(99));
    const b = fisherYatesShuffle(input, mulberry32(99));
    expect(a).toEqual(b);
  });
});
