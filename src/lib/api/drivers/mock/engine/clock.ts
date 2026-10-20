/**
 * Clock deterministik untuk simulasi waktu dan demo
 * Referensi: MILESTONE.md §2 P7, §4.1, §5, dan Aturan Kerja 4
 *
 * Seluruh komponen dan handler mock dilarang memanggil `new Date()`
 * atau `Date.now()` secara langsung untuk logika bisnis.
 */

class MockClock {
	private frozenTimeMs: number | null = new Date('2026-10-13T14:00:00.000Z').getTime();
	private timeOffsetMs: number = 0;

	/**
	 * Mengembalikan timestamp waktu sekarang (Date object)
	 */
	now(): Date {
		if (this.frozenTimeMs !== null) {
			return new Date(this.frozenTimeMs);
		}
		return new Date(Date.now() + this.timeOffsetMs);
	}

	/**
	 * Mengembalikan string ISO 8601 UTC (mis. "2026-10-13T06:28:00.000Z")
	 */
	nowIso(): string {
		return this.now().toISOString();
	}

	/**
	 * Mengembalikan timestamp dalam milidetik
	 */
	nowMs(): number {
		return this.now().getTime();
	}

	/**
	 * Membekukan waktu ke waktu tertentu (ISO string atau Date)
	 */
	freeze(target: string | Date | number): void {
		if (typeof target === 'string') {
			this.frozenTimeMs = new Date(target).getTime();
		} else if (target instanceof Date) {
			this.frozenTimeMs = target.getTime();
		} else {
			this.frozenTimeMs = target;
		}
	}

	/**
	 * Mencairkan waktu kembali berjalan normal
	 */
	unfreeze(): void {
		if (this.frozenTimeMs !== null) {
			// Pertahankan offset agar waktu tidak melompat drastis ke waktu sistem
			this.timeOffsetMs = this.frozenTimeMs - Date.now();
			this.frozenTimeMs = null;
		}
	}

	/**
	 * Memajukan waktu sebanyak N milidetik
	 */
	advance(ms: number): void {
		if (this.frozenTimeMs !== null) {
			this.frozenTimeMs += ms;
		} else {
			this.timeOffsetMs += ms;
		}
	}

	/**
	 * Memajukan waktu sebanyak N hari
	 */
	advanceDays(days: number): void {
		this.advance(days * 24 * 60 * 60 * 1000);
	}

	/**
	 * Memajukan waktu sebanyak N jam
	 */
	advanceHours(hours: number): void {
		this.advance(hours * 60 * 60 * 1000);
	}

	/**
	 * Reset clock ke waktu nyata sistem
	 */
	reset(): void {
		this.frozenTimeMs = new Date('2026-10-13T14:00:00.000Z').getTime();
		this.timeOffsetMs = 0;
	}

	/**
	 * Mengembalikan tanggal hari bisnis (string YYYY-MM-DD) dalam zona waktu Asia/Jakarta (WIB, UTC+7)
	 * Referensi: MILESTONE.md §4.1
	 */
	businessDate(date: Date = this.now()): string {
		// Menggunakan Intl format untuk Asia/Jakarta
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Asia/Jakarta',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		return formatter.format(date); // format en-CA menghasilkan YYYY-MM-DD
	}

	/**
	 * Mengecek apakah waktu saat ini sedang dibekukan
	 */
	isFrozen(): boolean {
		return this.frozenTimeMs !== null;
	}
}

export const clock = new MockClock();
