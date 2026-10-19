/**
 * Persistensi In-Memory Database ke IndexedDB
 * Referensi: MILESTONE.md §5
 *
 * Menyimpan snapshot database mock di browser agar data demo tidak hilang
 * saat halaman direfresh, serta menyediakan mekanisme reset dan ekspor/impor.
 */

import { openDB, type IDBPDatabase } from 'idb';
import { db } from './db.js';

const DB_NAME = 'hanjo_mock_db';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

class MockPersistence {
	private idbPromise: Promise<IDBPDatabase | null> | null = null;

	private async getDb(): Promise<IDBPDatabase | null> {
		if (typeof window === 'undefined' || !window.indexedDB) {
			return null; // Lingkungan SSR atau lingkungan tanpa IndexedDB
		}

		if (!this.idbPromise) {
			this.idbPromise = openDB(DB_NAME, DB_VERSION, {
				upgrade(db) {
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME);
					}
				}
			}).catch((err) => {
				console.warn('[MockPersistence] Gagal membuka IndexedDB:', err);
				return null;
			});
		}

		return this.idbPromise;
	}

	/**
	 * Menyimpan seluruh koleksi database saat ini ke IndexedDB
	 */
	async save(): Promise<void> {
		const idb = await this.getDb();
		if (!idb) return;

		const dump = db.exportJson();
		const tx = idb.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		for (const [name, items] of Object.entries(dump)) {
			await store.put(items, name);
		}
		await tx.done;
	}

	/**
	 * Memuat data koleksi dari IndexedDB ke dalam in-memory DB
	 * Mengembalikan true jika ada data yang dimuat, false jika masih kosong.
	 */
	async load(): Promise<boolean> {
		const idb = await this.getDb();
		if (!idb) return false;

		const tx = idb.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const keys = await store.getAllKeys();

		if (keys.length === 0) return false;

		const dump: Record<string, any[]> = {};
		for (const key of keys) {
			const items = await store.get(key);
			dump[String(key)] = items || [];
		}

		db.importJson(dump);
		return true;
	}

	/**
	 * Membersihkan data di IndexedDB dan reset in-memory database
	 */
	async clear(): Promise<void> {
		db.reset();
		const idb = await this.getDb();
		if (!idb) return;

		const tx = idb.transaction(STORE_NAME, 'readwrite');
		await tx.objectStore(STORE_NAME).clear();
		await tx.done;
	}
}

export const persistence = new MockPersistence();
