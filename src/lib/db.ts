import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ItemRecord, UserProfileRecord } from './types';

interface BoothEnhanserDB extends DBSchema {
  items: {
    key: string;
    value: ItemRecord;
    indexes: { 'by-itemType': string; 'by-registeredAt': string };
  };
  userProfile: {
    key: string;
    value: UserProfileRecord;
  };
}

const DB_NAME = 'booth-enhanser';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BoothEnhanserDB>> | null = null;

function openDb(): Promise<IDBPDatabase<BoothEnhanserDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BoothEnhanserDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const items = db.createObjectStore('items', { keyPath: 'itemId' });
          items.createIndex('by-itemType', 'itemType');
          items.createIndex('by-registeredAt', 'registeredAt');
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function defaultUserProfile(): UserProfileRecord {
  return {
    id: 'main',
    tagWeights: {},
    lastPurchaseIdProcessed: '',
    lastFavoriteIdProcessed: '',
    profileVersion: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function getItem(itemId: string): Promise<ItemRecord | undefined> {
  const db = await openDb();
  return db.get('items', itemId);
}

export async function getAllItems(): Promise<ItemRecord[]> {
  const db = await openDb();
  return db.getAll('items');
}

/**
 * 既存レコードとマージしてupsertする。再スキャンでitemTypeOverride・yomiOverride・
 * affinityScore・lastPickedAtなどの手動/学習データを消さないため、スクレイピング由来の
 * フィールドだけを上書きする。
 */
export async function putItem(item: ItemRecord): Promise<void> {
  const db = await openDb();
  const existing = await db.get('items', item.itemId);
  const merged: ItemRecord = existing ? { ...existing, ...item } : item;
  await db.put('items', merged);
}

export async function putItems(items: ItemRecord[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('items', 'readwrite');
  await Promise.all(
    items.map(async (item) => {
      const existing = await tx.store.get(item.itemId);
      const merged: ItemRecord = existing ? { ...existing, ...item } : item;
      await tx.store.put(merged);
    }),
  );
  await tx.done;
}

export async function deleteItem(itemId: string): Promise<void> {
  const db = await openDb();
  await db.delete('items', itemId);
}

/** 現在の好きリストに存在しなくなったアイテムをキャッシュから削除する。 */
export async function pruneRemovedFavorites(currentItemIds: readonly string[]): Promise<void> {
  const db = await openDb();
  const currentSet = new Set(currentItemIds);
  const all = await db.getAll('items');
  const tx = db.transaction('items', 'readwrite');
  await Promise.all(
    all
      .filter((item) => !currentSet.has(item.itemId))
      .map((item) => tx.store.delete(item.itemId)),
  );
  await tx.done;
}

export async function getUserProfile(): Promise<UserProfileRecord> {
  const db = await openDb();
  const existing = await db.get('userProfile', 'main');
  if (existing) return existing;
  const created = defaultUserProfile();
  await db.put('userProfile', created);
  return created;
}

export async function putUserProfile(profile: UserProfileRecord): Promise<void> {
  const db = await openDb();
  await db.put('userProfile', profile);
}
