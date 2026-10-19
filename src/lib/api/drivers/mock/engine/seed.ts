/**
 * Generator Bilangan Pseudo-Acak Deterministik (PRNG) untuk Seed Mock
 * Referensi: MILESTONE.md §5, AC-00.9
 *
 * Menggunakan algoritma mulberry32 dengan seed tetap untuk memastikan
 * seluruh data tiruan yang dihasilkan selalu identik pada setiap eksekusi seed ulang.
 */

export class SeededRandom {
	private s: number;

	constructor(seed: string | number = 42) {
		this.s = typeof seed === 'number' ? seed : this.hashString(seed);
	}

	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
		}
		return hash;
	}

	/**
	 * Menghasilkan angka float antara [0, 1)
	 */
	next(): number {
		let t = (this.s += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/**
	 * Menghasilkan angka integer dalam rentang [min, max]
	 */
	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}

	/**
	 * Memilih elemen acak dari sebuah array
	 */
	pickOne<T>(items: T[]): T {
		return items[this.nextInt(0, items.length - 1)];
	}

	/**
	 * Memilih N elemen acak unik dari sebuah array
	 */
	pickMultiple<T>(items: T[], count: number): T[] {
		const copy = [...items];
		const result: T[] = [];
		const take = Math.min(count, copy.length);
		for (let i = 0; i < take; i++) {
			const idx = this.nextInt(0, copy.length - 1);
			result.push(copy.splice(idx, 1)[0]);
		}
		return result;
	}

	/**
	 * Menghasilkan UUIDv7 pseudo-deterministik
	 */
	uuid(prefix: string = 'id'): string {
		const hex = () => this.nextInt(0, 15).toString(16);
		const hex4 = () => hex() + hex() + hex() + hex();
		return `${prefix}_${hex4()}${hex4()}-${hex4()}-${hex4()}-${hex4()}${hex4()}${hex4()}`;
	}
}

export const defaultPrng = new SeededRandom('hanjo_erp_demo_seed_2026');
