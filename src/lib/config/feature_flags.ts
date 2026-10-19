/**
 * Registry & Dependency Graph Feature Flags
 * Referensi: MILESTONE.md §3.5, T-00.9
 *
 * Mengelola daftar fitur opsional/modular, relasi dependensi antar fitur,
 * dan evaluasi konsistensi flag agar modul turunan otomatis nonaktif jika
 * modul prasyaratnya dimatikan.
 */

export type FeatureFlagKey =
	| 'inventory'
	| 'recipes'
	| 'procurement'
	| 'payables'
	| 'petty_cash'
	| 'partner_ownership'
	| 'stock_transfer'
	| 'production'
	| 'midtrans_reconciliation'
	| 'tax'
	| 'pos_sync';

export interface FeatureFlagDefinition {
	key: FeatureFlagKey;
	name: string;
	description: string;
	/** Fitur lain yang wajib aktif agar fitur ini dapat berjalan */
	dependencies: FeatureFlagKey[];
	defaultEnabled: boolean;
}

export const FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlagDefinition> = {
	inventory: {
		key: 'inventory',
		name: 'Manajemen Inventaris & Stok',
		description: 'Ledger stok, kartu pergerakan stok, opname berkala, dan pencatatan waste bahan.',
		dependencies: [],
		defaultEnabled: true
	},
	recipes: {
		key: 'recipes',
		name: 'Resep Berversi & HPP Menu',
		description: 'Formula resep per varian, efek modifier, dan kalkulasi HPP otomatis.',
		dependencies: ['inventory'],
		defaultEnabled: true
	},
	procurement: {
		key: 'procurement',
		name: 'Pengadaan & True-Up Biaya',
		description: 'Alur PO tanpa harga, penerimaan bertahap, verifikasi nota foto, dan penyesuaian True-Up.',
		dependencies: ['inventory'],
		defaultEnabled: true
	},
	payables: {
		key: 'payables',
		name: 'Hutang Dagang & Pembayaran FIFO',
		description: 'Tagihan pemasok, umur hutang 5 bucket, alokasi pembayaran FIFO, dan nota debit/kredit.',
		dependencies: ['procurement'],
		defaultEnabled: true
	},
	petty_cash: {
		key: 'petty_cash',
		name: 'Biaya & Kas Kecil Bertingkat',
		description: 'Batas harian kas kecil 3-tier, alur mode ketat, dan alur tutup hari (EOD) outlet.',
		dependencies: [],
		defaultEnabled: true
	},
	partner_ownership: {
		key: 'partner_ownership',
		name: 'Kepemilikan Mitra / Waralaba',
		description: 'Pemisahan outlet milik sendiri vs mitra dan filter kepemilikan di header.',
		dependencies: [],
		defaultEnabled: true
	},
	stock_transfer: {
		key: 'stock_transfer',
		name: 'Transfer Stok Antar-Outlet',
		description: 'Permintaan kirim bahan antar-cabang dengan alur persetujuan Admin HQ.',
		dependencies: ['inventory'],
		defaultEnabled: true
	},
	production: {
		key: 'production',
		name: 'Produksi Bahan Olahan',
		description: 'Pengolahan bahan mentah menjadi bahan intermediate (batch cold brew, simple syrup, dll).',
		dependencies: ['inventory', 'recipes'],
		defaultEnabled: true
	},
	midtrans_reconciliation: {
		key: 'midtrans_reconciliation',
		name: 'Rekonsiliasi Pembayaran QRIS / Midtrans',
		description: 'Pencocokan mutasi settlement payment gateway terhadap penjualan kasir non-tunai.',
		dependencies: [],
		defaultEnabled: true
	},
	tax: {
		key: 'tax',
		name: 'Perpajakan & Rekapitulasi Pajak',
		description: 'Konfigurasi tarif PPN/PB1 dan rekapitulasi DPP pajak per periode.',
		dependencies: [],
		defaultEnabled: true
	},
	pos_sync: {
		key: 'pos_sync',
		name: 'Sinkronisasi Transaksi POS Kasir',
		description: 'Penerimaan payload penjualan kasir idempoten via POST /api/v1/pos/sales.',
		dependencies: ['inventory'],
		defaultEnabled: true
	}
};

/**
 * Mendapatkan seluruh flag dalam keadaan aktif default
 */
export function getDefaultFeatureFlags(): Record<FeatureFlagKey, boolean> {
	const flags = {} as Record<FeatureFlagKey, boolean>;
	for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]) {
		flags[key] = FEATURE_FLAGS[key].defaultEnabled;
	}
	return flags;
}

/**
 * Memvalidasi konsistensi dependensi feature flags.
 * Mengembalikan status valid dan daftar pesan galat jika ada flag anak yang aktif
 * namun prasyaratnya mati.
 */
export function validateFlagDependencies(activeFlags: Record<string, boolean>): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]) {
		const isEnabled = activeFlags[key] === true;
		if (!isEnabled) continue;

		const def = FEATURE_FLAGS[key];
		for (const dep of def.dependencies) {
			if (activeFlags[dep] !== true) {
				errors.push(
					`Fitur "${def.name}" (${key}) membutuhkan fitur "${FEATURE_FLAGS[dep].name}" (${dep}) dalam keadaan aktif.`
				);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Mematikan seluruh flag turunan secara otomatis jika flag induk dimatikan
 */
export function sanitizeFeatureFlags(flags: Record<string, boolean>): Record<string, boolean> {
	const sanitized = { ...flags };
	let changed = true;

	// Loop sampai konvergen
	while (changed) {
		changed = false;
		for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]) {
			if (sanitized[key] !== true) continue;

			const def = FEATURE_FLAGS[key];
			for (const dep of def.dependencies) {
				if (sanitized[dep] !== true) {
					sanitized[key] = false;
					changed = true;
				}
			}
		}
	}

	return sanitized;
}

/**
 * Cek apakah sebuah feature flag sedang aktif
 */
export function isFeatureEnabled(
	flag: FeatureFlagKey,
	currentFlags?: Record<string, boolean>
): boolean {
	if (!currentFlags) return true;
	return currentFlags[flag] === true;
}
