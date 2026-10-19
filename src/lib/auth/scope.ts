/**
 * Outlet Scoping & Akses Multi-Outlet
 * Referensi: MILESTONE.md §7, PRD 8.1, Invarian Monorepo §2.4
 *
 * Mengontrol akses data per outlet berdasarkan peran:
 * - `owner`, `hq_admin`, `finance`: memiliki akses lintas seluruh outlet (HQ scope).
 * - `store_manager`: terkunci ketat hanya pada outlet tugasnya (`user.outlet_ids`).
 *   Jika mencoba membaca/mengubah outlet lain, sistem melempar `404 not_found`
 *   agar keberadaan data outlet lain tidak bocor.
 */

import type { User } from '../api/contract/types.js';
import { ApiErrors } from '../api/contract/errors.js';

export const DEMO_OUTLETS = [
	{ id: 'out-jkt-01', code: 'JKT-01', name: 'Outlet Senopati', city: 'Jakarta Selatan' },
	{ id: 'out-bdg-01', code: 'BDG-01', name: 'Outlet Dago', city: 'Bandung' },
	{ id: 'out-sub-01', code: 'SUB-01', name: 'Outlet Gubeng', city: 'Surabaya' }
];

export const ALL_OUTLET_IDS = DEMO_OUTLETS.map((o) => o.id);

/**
 * Mengembalikan daftar ID outlet yang boleh diakses pengguna
 */
export function getAccessibleOutlets(user: User | null | undefined): string[] {
	if (!user) return [];

	if (user.role === 'store_manager') {
		return user.outlet_ids || [];
	}

	// owner, hq_admin, finance punya akses ke semua outlet
	return ALL_OUTLET_IDS;
}

/**
 * Cek apakah sebuah outlet berada dalam cakupan akses pengguna
 */
export function isInScope(user: User | null | undefined, outletId: string): boolean {
	if (!user) return false;

	// Opsi "Semua Outlet" / konsolidasi hanya diizinkan untuk peran HQ
	if (outletId === '*' || outletId === 'all') {
		return user.role !== 'store_manager';
	}

	if (user.role !== 'store_manager') {
		return ALL_OUTLET_IDS.includes(outletId);
	}

	return (user.outlet_ids || []).includes(outletId);
}

/**
 * Memastikan outlet berada dalam scope. Melempar 404 not_found jika SM mencoba mengakses outlet luar.
 */
export function assertInScope(user: User | null | undefined, outletId: string): void {
	if (!user) {
		throw ApiErrors.unauthenticated('Sesi pengguna tidak valid');
	}

	if (!isInScope(user, outletId)) {
		// Invarian §2.4: Kembalikan 404 agar tidak membocorkan eksistensi data outlet lain
		throw ApiErrors.notFound('Data outlet tidak ditemukan');
	}
}
