import { describe, expect, it } from 'vitest';
import { CATEGORY_TO_ITEM_TYPE, inferItemType, resolveItemType } from '../src/lib/classify';

describe('inferItemType', () => {
  it('uses category mapping when available', () => {
    CATEGORY_TO_ITEM_TYPE['test-avatar-category'] = 'avatar';
    try {
      expect(inferItemType({ category: 'test-avatar-category', tags: [] })).toBe('avatar');
    } finally {
      delete CATEGORY_TO_ITEM_TYPE['test-avatar-category'];
    }
  });

  it('falls back to avatar keyword match', () => {
    expect(inferItemType({ category: null, tags: ['オリジナルアバター'] })).toBe('avatar');
  });

  it('falls back to non-avatar keyword match', () => {
    expect(inferItemType({ category: null, tags: ['衣装', 'VRChat'] })).toBe('non-avatar');
  });

  it('matches keywords in description text', () => {
    expect(inferItemType({ category: null, tags: [], description: 'これは髪型の3Dモデルです' })).toBe(
      'non-avatar',
    );
  });

  it('returns unknown when nothing matches', () => {
    expect(inferItemType({ category: null, tags: ['VRChat'] })).toBe('unknown');
  });
});

describe('resolveItemType', () => {
  it('prefers itemTypeOverride over itemType', () => {
    expect(resolveItemType({ itemType: 'unknown', itemTypeOverride: 'avatar' })).toBe('avatar');
  });

  it('falls back to itemType when no override', () => {
    expect(resolveItemType({ itemType: 'non-avatar', itemTypeOverride: null })).toBe('non-avatar');
  });
});
