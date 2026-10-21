/**
 * Domain Logic: Organisasi, Outlet & Kepemilikan Mitra (MS-02)
 * Referensi: PRD 8.1, MILESTONE.md §MS-02, Invarian Monorepo §2.2
 *
 * Mengikuti Golden Rule 2: Logika bisnis murni tanpa I/O, deterministik,
 * dan dapat diuji secara independen.
 */

import type {
	Organization,
	Outlet,
	OutletOwnership,
	BlockingDocument
} from '../api/contract/types.js';

export interface OwnershipValidationResult {
	valid: boolean;
	hasEmptyShares: boolean;
	totalSharePct: number;
	error?: string;
}

export interface DeactivationCheckResult {
	canDeactivate: boolean;
	message?: string;
	blockingDocuments: BlockingDocument[];
}

/**
 * Validasi format kode organisasi (2-10 karakter alfanumerik kapital)
 */
export function validateOrgCode(code: string): { valid: boolean; error?: string } {
	const trimmed = code?.trim().toUpperCase();
	if (!trimmed) {
		return { valid: false, error: 'Kode organisasi wajib diisi' };
	}
	if (!/^[A-Z0-9-]{2,10}$/.test(trimmed)) {
		return { valid: false, error: 'Kode organisasi harus 2-10 karakter alfanumerik (huruf kapital, angka, tanda hubung)' };
	}
	return { valid: true };
}

/**
 * Validasi format kode outlet (mis. JKT-01, BDG-01, KVL-01)
 */
export function validateOutletCode(code: string): { valid: boolean; error?: string } {
	const trimmed = code?.trim().toUpperCase();
	if (!trimmed) {
		return { valid: false, error: 'Kode outlet wajib diisi' };
	}
	if (!/^[A-Z0-9-]{2,12}$/.test(trimmed)) {
		return { valid: false, error: 'Kode outlet harus 2-12 karakter alfanumerik dan tanda hubung (-)' };
	}
	return { valid: true };
}

/**
 * Memeriksa kelayakan penonaktifan outlet (AC-02.2)
 * Mencegah nonaktif bila ada PO terbuka atau nota supplier menunggu verifikasi
 */
export function evaluateOutletDeactivation(
	outletId: string,
	blockingDocs: BlockingDocument[]
): DeactivationCheckResult {
	if (blockingDocs && blockingDocs.length > 0) {
		return {
			canDeactivate: false,
			message: `Outlet tidak dapat dinonaktifkan karena masih memiliki ${blockingDocs.length} dokumen operasional terbuka.`,
			blockingDocuments: blockingDocs
		};
	}

	return {
		canDeactivate: true,
		blockingDocuments: []
	};
}

/**
 * Memeriksa kelayakan penonaktifan organisasi induk (AC-02.2)
 * Mencegah nonaktif bila masih memiliki outlet berstatus aktif di bawahnya
 */
export function evaluateOrgDeactivation(
	orgId: string,
	outletsUnderOrg: Outlet[]
): DeactivationCheckResult {
	const activeOutlets = outletsUnderOrg.filter(
		(o) => o.organization_id === orgId && (o.status === 'active' || o.active !== false)
	);

	if (activeOutlets.length > 0) {
		const blockingDocs: BlockingDocument[] = activeOutlets.map((o) => ({
			id: o.id,
			doc_type: 'active_outlet',
			ref_number: o.code,
			title: o.name,
			reason: `Gerai ${o.name} (${o.city}) masih berstatus aktif.`
		}));

		return {
			canDeactivate: false,
			message: `Organisasi tidak dapat dinonaktifkan karena masih membawahi ${activeOutlets.length} outlet aktif. Nonaktifkan seluruh outlet terlebih dahulu.`,
			blockingDocuments: blockingDocs
		};
	}

	return {
		canDeactivate: true,
		blockingDocuments: []
	};
}

/**
 * Validasi pembagian kepemilikan investor (T-02.5, AC-02.3, AC-02.4)
 * Aturan:
 * 1. Boleh ada persentase kosong (null / undefined), namun akan memicu banner peringatan.
 * 2. Jika SELURUH pemilik aktif memiliki nilai persentase, total WAJIB tepat 100%.
 * 3. Periode tanggal (effective_from s/d effective_to) untuk pemilik yang sama TIDAK BOLEH tumpang tindih.
 */
export function validateOwnershipRules(ownerships: OutletOwnership[]): OwnershipValidationResult {
	if (!ownerships || ownerships.length === 0) {
		return { valid: true, hasEmptyShares: false, totalSharePct: 0 };
	}

	// 1. Periksa overlap tanggal untuk pemilik yang sama (AC-02.4)
	const byOwner: Record<string, OutletOwnership[]> = {};
	for (const o of ownerships) {
		const key = o.owner_name.trim().toLowerCase();
		if (!byOwner[key]) byOwner[key] = [];
		byOwner[key].push(o);
	}

	for (const [ownerKey, list] of Object.entries(byOwner)) {
		if (list.length > 1) {
			for (let i = 0; i < list.length; i++) {
				for (let j = i + 1; j < list.length; j++) {
					const a = list[i];
					const b = list[j];
					const aStart = new Date(a.effective_from).getTime();
					const aEnd = a.effective_to ? new Date(a.effective_to).getTime() : Infinity;
					const bStart = new Date(b.effective_from).getTime();
					const bEnd = b.effective_to ? new Date(b.effective_to).getTime() : Infinity;

					// Cek tumpang tindih interval: max(start) <= min(end)
					if (Math.max(aStart, bStart) <= Math.min(aEnd, bEnd)) {
						return {
							valid: false,
							hasEmptyShares: false,
							totalSharePct: 0,
							error: `Periode tanggal kepemilikan tumpang tindih untuk pemilik "${a.owner_name}".`
						};
					}
				}
			}
		}
	}

	// 2. Evaluasi total persentase saham (AC-02.3)
	let hasEmpty = false;
	let totalShare = 0;

	for (const item of ownerships) {
		if (item.share_pct === null || item.share_pct === undefined || item.share_pct === '' || isNaN(Number(item.share_pct))) {
			hasEmpty = true;
		} else {
			totalShare += Number(item.share_pct);
		}
	}

	// Jika ada yang kosong, simpan valid tapi beri penanda hasEmptyShares = true
	if (hasEmpty) {
		return {
			valid: true,
			hasEmptyShares: true,
			totalSharePct: Number(totalShare.toFixed(2))
		};
	}

	// Jika SEMUA terisi, total wajib tepat 100% (toleransi desimal 0.01)
	const roundedTotal = Number(totalShare.toFixed(2));
	if (Math.abs(roundedTotal - 100) > 0.01) {
		return {
			valid: false,
			hasEmptyShares: false,
			totalSharePct: roundedTotal,
			error: `Total persentase kepemilikan harus tepat 100% (saat ini: ${roundedTotal}%).`
		};
	}

	return {
		valid: true,
		hasEmptyShares: false,
		totalSharePct: 100
	};
}
