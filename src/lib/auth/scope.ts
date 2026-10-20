/**
 * Organisasi & Outlet Scoping (Akses Hirarki Multi-Organisasi & Multi-Outlet)
 * Referensi: MILESTONE.md §7, PRD 8.1, Invarian Monorepo §2.4, MS-00 & MS-02
 *
 * Hirarki Domain:
 * 1 Organisasi -> memiliki banyak Outlet.
 *
 * Contoh Organisasi Nyata:
 * 1. Seduhan Kopi Jodi (org-jodi): menjalankan beberapa outlet (Jodi Senopati, Jodi Dago, Jodi Gubeng)
 *    dengan 1 manager dapat mengelola beberapa outlet.
 * 2. Kaveloka (org-kaveloka): sementara masih memiliki 1 outlet (Kaveloka Ubud).
 * 3. Plaga (org-plaga): sementara masih memiliki 1 outlet (Plaga Farm Bistro).
 *
 * Hak Akses:
 * - `owner`, `hq_admin`, `finance`: Akses lintas organisasi dan lintas outlet (HQ scope).
 * - `store_manager`: Terkunci pada organisasi dan outlet tugasnya (`user.outlet_ids`).
 *   Jika mencoba membaca/mengubah data luar scope, sistem melempar `404 not_found`.
 */

import type { User, Organization, Outlet } from '../api/contract/types.js';
import { ApiErrors } from '../api/contract/errors.js';

export const DEMO_ORGANIZATIONS: Organization[] = [
	{
		id: 'org-jodi',
		code: 'SKJ',
		name: 'Seduhan Kopi Jodi',
		description: 'Jaringan gerai kopi artisanal multi-outlet (Jakarta, Bandung, Surabaya)',
		active: true
	},
	{
		id: 'org-kaveloka',
		code: 'KVL',
		name: 'Kaveloka',
		description: 'Specialty roastery & coffee bar (Ubud, Bali)',
		active: true
	},
	{
		id: 'org-plaga',
		code: 'PLG',
		name: 'Plaga',
		description: 'Farm-to-table bistro & winery cafe (Badung, Bali)',
		active: true
	}
];

export const DEMO_OUTLETS: Outlet[] = [
	// Organisasi: Seduhan Kopi Jodi
	{
		id: 'out-jkt-01',
		organization_id: 'org-jodi',
		code: 'JKT-01',
		name: 'Jodi Senopati',
		city: 'Jakarta Selatan',
		owner_type: 'own_company',
		active: true
	},
	{
		id: 'out-bdg-01',
		organization_id: 'org-jodi',
		code: 'BDG-01',
		name: 'Jodi Dago',
		city: 'Bandung',
		owner_type: 'own_company',
		active: true
	},
	{
		id: 'out-sub-01',
		organization_id: 'org-jodi',
		code: 'SUB-01',
		name: 'Jodi Gubeng',
		city: 'Surabaya',
		owner_type: 'partner',
		active: true
	},

	// Organisasi: Kaveloka
	{
		id: 'out-kvl-01',
		organization_id: 'org-kaveloka',
		code: 'KVL-01',
		name: 'Kaveloka Ubud',
		city: 'Gianyar, Bali',
		owner_type: 'own_company',
		active: true
	},

	// Organisasi: Plaga
	{
		id: 'out-plg-01',
		organization_id: 'org-plaga',
		code: 'PLG-01',
		name: 'Plaga Farm Bistro',
		city: 'Badung, Bali',
		owner_type: 'own_company',
		active: true
	}
];

export const ALL_ORG_IDS = DEMO_ORGANIZATIONS.map((o) => o.id);
export const ALL_OUTLET_IDS = DEMO_OUTLETS.map((o) => o.id);

/**
 * Mengembalikan daftar Organisasi yang boleh diakses pengguna
 */
export function getAccessibleOrganizations(user: User | null | undefined): Organization[] {
	if (!user) return [];

	if (user.role === 'store_manager' || user.role === 'cashier') {
		const orgId = user.organization_id || 'org-jodi';
		const allowedOrgIds = user.organization_ids || [orgId];
		return DEMO_ORGANIZATIONS.filter((o) => allowedOrgIds.includes(o.id));
	}

	// owner, hq_admin, finance punya akses ke seluruh organisasi
	return DEMO_ORGANIZATIONS;
}

/**
 * Mengembalikan daftar ID outlet yang boleh diakses pengguna
 */
export function getAccessibleOutlets(user: User | null | undefined): string[] {
	if (!user) return [];

	if (user.role === 'store_manager' || user.role === 'cashier') {
		return user.outlet_ids || [];
	}

	// owner, hq_admin, finance punya akses ke semua outlet
	return ALL_OUTLET_IDS;
}

/**
 * Mengembalikan daftar objek Outlet lengkap berdasarkan cakupan pengguna dan filter organisasi
 */
export function getAccessibleOutletEntities(user: User | null | undefined, orgId?: string): Outlet[] {
	if (!user) return [];

	let baseOutlets = DEMO_OUTLETS;

	// Batasi jika store manager atau kasir
	if (user.role === 'store_manager' || user.role === 'cashier') {
		const allowedIds = user.outlet_ids || [];
		baseOutlets = DEMO_OUTLETS.filter((o) => allowedIds.includes(o.id));
	}

	// Filter berdasarkan organisasi jika ditentukan
	if (orgId && orgId !== '*' && orgId !== 'all') {
		return baseOutlets.filter((o) => o.organization_id === orgId);
	}

	return baseOutlets;
}

/**
 * Cek apakah sebuah organisasi berada dalam cakupan akses pengguna
 */
export function isOrgInScope(user: User | null | undefined, orgId: string): boolean {
	if (!user) return false;

	if (orgId === '*' || orgId === 'all') {
		return user.role !== 'store_manager' && user.role !== 'cashier';
	}

	if (user.role !== 'store_manager' && user.role !== 'cashier') {
		return ALL_ORG_IDS.includes(orgId);
	}

	const allowedOrgIds = user.organization_ids || (user.organization_id ? [user.organization_id] : ['org-jodi']);
	return allowedOrgIds.includes(orgId);
}

/**
 * Cek apakah sebuah outlet berada dalam cakupan akses pengguna
 */
export function isInScope(user: User | null | undefined, outletId: string): boolean {
	if (!user) return false;

	// Opsi "Semua Outlet" / konsolidasi hanya diizinkan untuk peran HQ
	if (outletId === '*' || outletId === 'all') {
		return user.role !== 'store_manager' && user.role !== 'cashier';
	}

	if (user.role !== 'store_manager' && user.role !== 'cashier') {
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
