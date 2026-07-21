import { describe, expect, it } from 'vitest';
import { selectPickupItems } from '../src/lib/pickup';
import { makeItem } from './fixtures';

const NOW = new Date('2026-07-21T12:00:00.000Z');

describe('selectPickupItems', () => {
  it('returns the same result for repeated calls on the same day', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ itemId: `item-${i}`, registeredAt: new Date(2026, 0, i + 1).toISOString() }),
    );
    const first = selectPickupItems(items, { now: NOW });
    const second = selectPickupItems(items, { now: NOW });
    expect(first.map((i) => i.itemId)).toEqual(second.map((i) => i.itemId));
  });

  it('excludes items in cooldown unless the pool would become too small', () => {
    const recentlyPicked = makeItem({
      itemId: 'recent',
      lastPickedAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const eligible = Array.from({ length: 5 }, (_, i) => makeItem({ itemId: `eligible-${i}` }));

    const result = selectPickupItems([recentlyPicked, ...eligible], { now: NOW, cooldownDays: 7, count: 3 });
    expect(result.map((i) => i.itemId)).not.toContain('recent');
  });

  it('relaxes cooldown when the pool is too small otherwise', () => {
    const recentlyPicked = makeItem({
      itemId: 'recent',
      lastPickedAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = selectPickupItems([recentlyPicked], { now: NOW, cooldownDays: 7, count: 3 });
    expect(result.map((i) => i.itemId)).toContain('recent');
  });

  it('forceReshuffle changes the output', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ itemId: `item-${i}`, registeredAt: new Date(2026, 0, i + 1).toISOString() }),
    );
    const base = selectPickupItems(items, { now: NOW });
    const reshuffled = selectPickupItems(items, { now: NOW, forceReshuffle: 1 });
    expect(reshuffled.map((i) => i.itemId)).not.toEqual(base.map((i) => i.itemId));
  });

  it('biases selection toward older-registered items across many seeds', () => {
    const oldItem = makeItem({ itemId: 'old', registeredAt: new Date(2015, 0, 1).toISOString() });
    const newItem = makeItem({ itemId: 'new', registeredAt: new Date(2026, 7, 20).toISOString() });

    let oldPicked = 0;
    let newPicked = 0;
    for (let seed = 0; seed < 200; seed++) {
      const result = selectPickupItems([oldItem, newItem], { now: NOW, count: 1, forceReshuffle: seed });
      if (result[0]?.itemId === 'old') oldPicked++;
      if (result[0]?.itemId === 'new') newPicked++;
    }
    expect(oldPicked).toBeGreaterThan(newPicked);
  });

  it('returns an empty array for an empty input', () => {
    expect(selectPickupItems([], { now: NOW })).toEqual([]);
  });
});
