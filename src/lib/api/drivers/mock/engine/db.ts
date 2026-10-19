/**
 * In-Memory Database dengan Indeks dan Transaksi Atomik
 * Referensi: MILESTONE.md §5, AC-00.6
 *
 * Mendukung:
 * - Koleksi generik
 * - Pengindeksan (id, outlet_id, business_date, dsb)
 * - Transaksi atomik `db.tx(async () => { ... })` dengan rollback jika gagal
 * - Versi dokumen otomatis untuk optimistik concurrency (If-Match)
 * - Snapshot state untuk backup / persistensi
 */

import { clock } from './clock.js';
import { ApiErrors } from '../../../contract/errors.js';

export interface BaseEntity {
	id: string;
	version: number;
	created_at: string;
	updated_at: string;
	outlet_id?: string;
	business_date?: string;
	[key: string]: unknown;
}

export type QueryFilter<T> = {
	[K in keyof T]?: T[K] | T[K][] | ((val: T[K], item: T) => boolean);
};

export class MockCollection<T extends BaseEntity> {
	readonly name: string;
	private items: Map<string, T> = new Map();
	private indices: Map<string, Map<unknown, Set<string>>> = new Map();

	constructor(name: string, indexedFields: string[] = ['id', 'outlet_id', 'business_date']) {
		this.name = name;
		for (const field of indexedFields) {
			this.indices.set(field, new Map());
		}
	}

	private addToIndices(item: T): void {
		for (const [field, indexMap] of this.indices.entries()) {
			const val = item[field];
			if (val !== undefined && val !== null) {
				if (!indexMap.has(val)) {
					indexMap.set(val, new Set());
				}
				indexMap.get(val)!.add(item.id);
			}
		}
	}

	private removeFromIndices(item: T): void {
		for (const [field, indexMap] of this.indices.entries()) {
			const val = item[field];
			if (val !== undefined && val !== null) {
				const set = indexMap.get(val);
				if (set) {
					set.delete(item.id);
					if (set.size === 0) {
						indexMap.delete(val);
					}
				}
			}
		}
	}

	find(filter?: QueryFilter<T>): T[] {
		const all = Array.from(this.items.values());
		if (!filter) return all.map((it) => structuredClone(it));

		const filtered = all.filter((item) => {
			for (const [key, expected] of Object.entries(filter)) {
				const actual = item[key as keyof T];
				if (typeof expected === 'function') {
					if (!(expected as Function)(actual, item)) return false;
				} else if (Array.isArray(expected)) {
					if (!expected.includes(actual)) return false;
				} else if (actual !== expected) {
					return false;
				}
			}
			return true;
		});

		return filtered.map((it) => structuredClone(it));
	}

	findById(id: string): T | null {
		const item = this.items.get(id);
		return item ? structuredClone(item) : null;
	}

	findOne(filter: QueryFilter<T>): T | null {
		const results = this.find(filter);
		return results.length > 0 ? results[0] : null;
	}

	insert(doc: Omit<T, 'version' | 'created_at' | 'updated_at'> & Partial<BaseEntity>): T {
		const now = clock.nowIso();
		const id = doc.id || (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random()}`);

		if (this.items.has(id)) {
			throw ApiErrors.conflict(`Dokumen dengan ID ${id} sudah ada dalam koleksi ${this.name}`);
		}

		const entity = {
			...doc,
			id,
			version: 1,
			created_at: doc.created_at || now,
			updated_at: doc.updated_at || now,
			business_date: doc.business_date || clock.businessDate()
		} as T;

		this.items.set(id, structuredClone(entity));
		this.addToIndices(entity);
		return structuredClone(entity);
	}

	update(id: string, updater: Partial<T> | ((existing: T) => Partial<T>), ifMatchVersion?: number): T {
		const existing = this.items.get(id);
		if (!existing) {
			throw ApiErrors.notFound(`Dokumen ${id} tidak ditemukan di ${this.name}`);
		}

		if (ifMatchVersion !== undefined && existing.version !== ifMatchVersion) {
			throw ApiErrors.conflict(
				`Versi dokumen tidak cocok. Versi di server: ${existing.version}, versi dikirim: ${ifMatchVersion}`,
				[{ field: 'version', code: 'version_mismatch', message: 'Dokumen telah diubah oleh pengguna lain' }]
			);
		}

		this.removeFromIndices(existing);

		const updates = typeof updater === 'function' ? updater(structuredClone(existing)) : updater;
		const updated: T = {
			...existing,
			...updates,
			id, // ID tidak boleh berubah
			version: existing.version + 1,
			updated_at: clock.nowIso()
		};

		this.items.set(id, structuredClone(updated));
		this.addToIndices(updated);
		return structuredClone(updated);
	}

	delete(id: string, ifMatchVersion?: number): boolean {
		const existing = this.items.get(id);
		if (!existing) return false;

		if (ifMatchVersion !== undefined && existing.version !== ifMatchVersion) {
			throw ApiErrors.conflict(`Versi dokumen tidak cocok saat penghapusan`);
		}

		this.removeFromIndices(existing);
		return this.items.delete(id);
	}

	count(filter?: QueryFilter<T>): number {
		if (!filter) return this.items.size;
		return this.find(filter).length;
	}

	clear(): void {
		this.items.clear();
		for (const indexMap of this.indices.values()) {
			indexMap.clear();
		}
	}

	// Dump internal state for transactions & persist
	_dump(): T[] {
		return Array.from(this.items.values()).map((it) => structuredClone(it));
	}

	// Restore state from snapshot
	_restore(data: T[]): void {
		this.clear();
		for (const item of data) {
			this.items.set(item.id, structuredClone(item));
			this.addToIndices(item);
		}
	}
}

class MockDatabase {
	private collections: Map<string, MockCollection<any>> = new Map();
	private inTransaction: boolean = false;

	/**
	 * Mengambil atau membuat koleksi
	 */
	collection<T extends BaseEntity>(name: string, indexedFields?: string[]): MockCollection<T> {
		if (!this.collections.has(name)) {
			this.collections.set(name, new MockCollection<T>(name, indexedFields));
		}
		return this.collections.get(name) as MockCollection<T>;
	}

	/**
	 * Menjalankan fungsi di dalam transaksi atomik.
	 * Jika fungsi melempar error, seluruh modifikasi data di semua koleksi
	 * dibatalkan (rollback) ke kondisi sebelum transaksi dimulai.
	 * Referensi: MILESTONE.md §5 & AC-00.6
	 */
	async tx<R>(fn: (db: MockDatabase) => Promise<R> | R): Promise<R> {
		if (this.inTransaction) {
			// Sudah di dalam transaksi (nested transaction), langsung jalankan
			return await fn(this);
		}

		// Buat snapshot dari semua koleksi
		const snapshot: Map<string, any[]> = new Map();
		for (const [name, col] of this.collections.entries()) {
			snapshot.set(name, col._dump());
		}

		this.inTransaction = true;
		try {
			const result = await fn(this);
			return result;
		} catch (error) {
			// ROLLBACK: Kembalikan semua koleksi ke snapshot semula
			for (const [name, data] of snapshot.entries()) {
				const col = this.collections.get(name);
				if (col) {
					col._restore(data);
				}
			}
			throw error;
		} finally {
			this.inTransaction = false;
		}
	}

	/**
	 * Export seluruh data database dalam bentuk objek JSON (untuk backup / persistensi)
	 */
	exportJson(): Record<string, any[]> {
		const dump: Record<string, any[]> = {};
		for (const [name, col] of this.collections.entries()) {
			dump[name] = col._dump();
		}
		return dump;
	}

	/**
	 * Import seluruh data database dari objek JSON (untuk seed / restore)
	 */
	importJson(data: Record<string, any[]>): void {
		for (const [name, items] of Object.entries(data)) {
			const col = this.collection(name);
			col._restore(items);
		}
	}

	/**
	 * Reset seluruh data di semua koleksi
	 */
	reset(): void {
		for (const col of this.collections.values()) {
			col.clear();
		}
	}
}

export const db = new MockDatabase();
