/**
 * Mesin Otorisasi PBAC (Policy & Permission-Based Access Control)
 * Referensi: MILESTONE.md §7, PRD 8.4, Invarian Monorepo §2.4
 *
 * Prinsip Kerja:
 * 1. Superadmin / Owner: Akses penuh ke seluruh fitur sistem (`*`).
 * 2. Role Default Templates: Template izin bawaan untuk setiap peran (owner, hq_admin, finance, store_manager, cashier).
 * 3. Granular Overrides (PBAC Checklist): Kemampuan menambah izin (+grant) atau mencabut izin (-revoke)
 *    secara spesifik per-pengguna melalui UI checklist.
 * 4. Scope Guard: Memastikan akses tidak melanggar batas cabang/outlet tugas pengguna.
 */

import type { User, UserRole } from '../api/contract/types.js';
import { isInScope } from './scope.js';

export interface CanContext {
	outletId?: string;
	amount?: number;
	[key: string]: unknown;
}

/**
 * Definisi Izin Sistem untuk UI Checklist & Audit
 */
export interface PermissionDefinition {
	key: string;
	title: string;
	description: string;
	category: string;
	isSensitive?: boolean;
}

/**
 * Katalog Lengkap Seluruh Izin Sistem Hanjo (Dikelompokkan untuk UI Checklist)
 */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
	// --- 1. Point of Sale (POS) & Kasir ---
	{ key: 'pos:order:create', title: 'Buat Pesanan Baru', description: 'Membuat transaksi penjualan kasir di POS', category: 'Point of Sale (POS)' },
	{ key: 'pos:order:read', title: 'Lihat Riwayat Pesanan', description: 'Melihat struk dan riwayat transaksi kasir', category: 'Point of Sale (POS)' },
	{ key: 'pos:payment:collect', title: 'Terima Pembayaran', description: 'Menerima pembayaran tunai, QRIS, atau kartu', category: 'Point of Sale (POS)' },
	{ key: 'pos:receipt:reprint', title: 'Cetak Ulang Struk', description: 'Mencetak ulang salinan struk transaksi', category: 'Point of Sale (POS)' },
	{ key: 'pos:shift:manage', title: 'Kelola Shift Kasir', description: 'Buka dan tutup shift laci kasir', category: 'Point of Sale (POS)' },
	{ key: 'pos:order:void', title: 'Void Pesanan / Item', description: 'Membatalkan item atau transaksi yang sudah terinput', category: 'Point of Sale (POS)', isSensitive: true },
	{ key: 'pos:discount:apply', title: 'Beri Diskon Manual', description: 'Memberikan potongan harga manual pada transaksi', category: 'Point of Sale (POS)', isSensitive: true },
	{ key: 'pos:cash_drawer:open', title: 'Buka Laci Kas Manual', description: 'Membuka laci kas tanpa adanya transaksi masuk', category: 'Point of Sale (POS)', isSensitive: true },

	// --- 2. Navigasi & Tampilan Utama ---
	{ key: 'dashboard:view', title: 'Buka Halaman Dashboard', description: 'Mengakses dashboard utama sistem', category: 'Tampilan Utama' },
	{ key: 'dashboard:view:gross_profit', title: 'Lihat Laba Kotor & Margin', description: 'Melihat angka laba kotor konsolidasi dan estimasi HPP', category: 'Tampilan Utama', isSensitive: true },
	{ key: 'approvals:read', title: 'Kotak Masuk Persetujuan', description: 'Melihat daftar dokumen yang menunggu persetujuan', category: 'Tampilan Utama' },
	{ key: 'reports:read', title: 'Buka Menu Laporan', description: 'Melihat laporan penjualan dan operasional', category: 'Tampilan Utama' },

	// --- 3. Inventaris & Stok Bahan Baku ---
	{ key: 'inventory:read', title: 'Lihat Stok & Ledger', description: 'Melihat saldo stok dan kartu mutasi bahan baku', category: 'Inventaris & Stok' },
	{ key: 'inventory:count', title: 'Input Stock Opname', description: 'Melakukan penghitungan fisik stok harian / mingguan', category: 'Inventaris & Stok' },
	{ key: 'inventory:approve_count', title: 'Setujui Selisih Opname', description: 'Menyetujui penyesuaian selisih hasil opname fisik', category: 'Inventaris & Stok', isSensitive: true },
	{ key: 'inventory:record_waste', title: 'Catat Bahan Rusak (Waste)', description: 'Mencatat bahan terbuang, tumpah, atau kadaluwarsa', category: 'Inventaris & Stok' },
	{ key: 'inventory:transfer', title: 'Transfer Antar Outlet', description: 'Mengirim dan menerima mutasi barang antar-cabang', category: 'Inventaris & Stok' },
	{ key: 'inventory:manual_adjust', title: 'Koreksi Saldo Manual', description: 'Menyesuaikan kuantitas stok tanpa dokumen resmi', category: 'Inventaris & Stok', isSensitive: true },

	// --- 4. Pengadaan & Pembelian ---
	{ key: 'procurement:read', title: 'Lihat Pengadaan', description: 'Melihat riwayat pesanan pembelian (PO) dan penerimaan', category: 'Pengadaan & Pembelian' },
	{ key: 'procurement:create_po', title: 'Buat PO Permintaan Barang', description: 'Membuat permintaan pengadaan barang ke supplier / gudang pusat', category: 'Pengadaan & Pembelian' },
	{ key: 'procurement:approve_external_po', title: 'Setujui Belanja Eksternal', description: 'Menyetujui pembelian barang di luar katalog pusat', category: 'Pengadaan & Pembelian', isSensitive: true },
	{ key: 'procurement:receive_goods', title: 'Terima Barang Masuk', description: 'Mencatat penerimaan fisik barang dari supplier', category: 'Pengadaan & Pembelian' },
	{ key: 'procurement:input_invoice', title: 'Input Nota Supplier', description: 'Mengunggah foto dan menginput nilai nota supplier', category: 'Pengadaan & Pembelian' },
	{ key: 'procurement:verify_invoice', title: 'Verifikasi Nota & True-Up', description: 'Memverifikasi kesesuaian harga nota dan rekonsiliasi HPP', category: 'Pengadaan & Pembelian' },
	{ key: 'payables:read', title: 'Lihat Tagihan Hutang', description: 'Melihat daftar tagihan supplier yang belum lunas', category: 'Pengadaan & Pembelian' },
	{ key: 'payables:pay', title: 'Bayar Hutang Dagang', description: 'Memproses pengeluaran kas/bank untuk pelunasan tagihan', category: 'Pengadaan & Pembelian', isSensitive: true },

	// --- 5. Biaya, Kas Kecil & Tutup Hari ---
	{ key: 'petty_cash:read', title: 'Lihat Kas Kecil', description: 'Melihat mutasi dan saldo kas kecil cabang', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'petty_cash:spend', title: 'Catat Pengeluaran Kas Kecil', description: 'Menginput pengeluaran harian cabang tingkat 1', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'petty_cash:approve_tier2', title: 'Persetujuan Biaya Tingkat 2', description: 'Menyetujui pengeluaran kas kecil melebihi limit harian', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'petty_cash:approve_tier3', title: 'Persetujuan Biaya Tingkat 3 (Owner)', description: 'Menyetujui pengeluaran modal luar biasa', category: 'Kas Kecil & Tutup Hari', isSensitive: true },
	{ key: 'petty_cash:topup', title: 'Top-Up Kas Kecil', description: 'Mengisi kembali saldo kas kecil cabang', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'petty_cash:count_physical', title: 'Hitung Fisik Kas Laci', description: 'Menghitung uang fisik kas kecil untuk audit', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'costs:read_hq', title: 'Lihat Biaya Operasional Pusat', description: 'Melihat pengeluaran konsolidasi seluruh outlet', category: 'Kas Kecil & Tutup Hari', isSensitive: true },
	{ key: 'eod:close', title: 'Lakukan Tutup Hari (EOD)', description: 'Menutup operasional harian, menghitung kas, dan kirim laporan', category: 'Kas Kecil & Tutup Hari' },
	{ key: 'eod:view_summary', title: 'Lihat Rekap Status EOD', description: 'Melihat status tutup hari outlet di dashboard', category: 'Kas Kecil & Tutup Hari' },

	// --- 6. Keuangan & Pajak ---
	{ key: 'finance:read', title: 'Lihat Menu Keuangan', description: 'Melihat ringkasan keuangan, jurnal, dan penyesuaian biaya', category: 'Keuangan & Fiskal' },
	{ key: 'finance:manage_tax', title: 'Kelola Pajak Restoran & PPN', description: 'Mengatur tarif dan rekapitulasi PBJT / PPN', category: 'Keuangan & Fiskal' },
	{ key: 'finance:close_period', title: 'Tutup Periode Fiskal', description: 'Menutup buku periode bulanan / tahunan', category: 'Keuangan & Fiskal', isSensitive: true },
	{ key: 'finance:reopen_period', title: 'Buka Kembali Periode Tertutup', description: 'Membuka kunci periode fiskal yang sudah difinalisasi', category: 'Keuangan & Fiskal', isSensitive: true },
	{ key: 'finance:midtrans_reconcile', title: 'Rekonsiliasi Non-Tunai / QRIS', description: 'Mencocokkan penerimaan POS dengan bank / payment gateway', category: 'Keuangan & Fiskal' },

	// --- 7. Master Data & Pengaturan ---
	{ key: 'catalog:read', title: 'Lihat Katalog & Resep', description: 'Melihat daftar bahan baku, resep, dan menu jual', category: 'Master Data & Pengaturan' },
	{ key: 'catalog:manage', title: 'Kelola Master Katalog', description: 'Menambah, mengubah, dan mengarsipkan item katalog', category: 'Master Data & Pengaturan' },
	{ key: 'catalog:propose_menu', title: 'Ajukan Usulan Menu Lokal', description: 'Store Manager mengusulkan menu khas cabang ke pusat', category: 'Master Data & Pengaturan' },
	{ key: 'org:read', title: 'Lihat Daftar Cabang', description: 'Melihat data profil dan alamat cabang', category: 'Master Data & Pengaturan' },
	{ key: 'org:view_owners', title: 'Lihat Struktur Pemilik & Mitra', description: 'Melihat persentase bagi hasil dan kepemilikan outlet', category: 'Master Data & Pengaturan' },
	{ key: 'org:manage', title: 'Kelola Cabang & Penugasan', description: 'Mengatur data outlet dan penugasan karyawan', category: 'Master Data & Pengaturan', isSensitive: true },
	{ key: 'settings:read', title: 'Lihat Pengaturan Sistem', description: 'Melihat parameter sistem dan profil perusahaan', category: 'Master Data & Pengaturan' },
	{ key: 'settings:manage_general', title: 'Kelola Pengguna & Hak Akses', description: 'Mengatur checklist izin pengguna dan role akun', category: 'Master Data & Pengaturan', isSensitive: true },
	{ key: 'settings:audit_log', title: 'Lihat Audit Trail Log', description: 'Melihat riwayat jejak aktivitas keamanan dan mutasi sistem', category: 'Master Data & Pengaturan', isSensitive: true }
];

/**
 * Template Izin Bawaan per Peran (Default Role Templates)
 * Menjadi standar awal sebelum ada penambahan / pencabutan izin individual di checklist.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
	// Superadmin / Owner: Mengakses seluruh fitur tanpa batas
	owner: ['*'],

	// Admin Pusat: Seluruh operasional, master data, dan persetujuan cabang
	hq_admin: [
		'dashboard:view',
		'approvals:read',
		'reports:read',
		'org:*',
		'catalog:*',
		'inventory:*',
		'procurement:read',
		'procurement:create_po',
		'procurement:receive_goods',
		'payables:read',
		'petty_cash:read',
		'petty_cash:count_physical',
		'costs:*',
		'finance:read',
		'eod:view_summary',
		'settings:*'
	],

	// Bagian Keuangan: Tagihan, verifikasi nota, kas kecil, rekonsiliasi, dan fiskal
	finance: [
		'dashboard:view',
		'dashboard:view:gross_profit',
		'approvals:read',
		'reports:read',
		'org:read',
		'org:view_owners',
		'catalog:read',
		'inventory:read',
		'inventory:count',
		'inventory:approve_count',
		'inventory:record_waste',
		'procurement:*',
		'payables:*',
		'petty_cash:*',
		'costs:*',
		'finance:*',
		'eod:view_summary',
		'settings:read',
		'settings:audit_log'
	],

	// Brand Manager: Operasional multi-outlet brand, kurasi menu lokal, transfer stok gerai, otorisasi kas kecil
	brand_manager: [
		'dashboard:view',
		'approvals:read',
		'approvals:curate_menu',
		'reports:read',
		'org:read',
		'catalog:read',
		'catalog:propose_menu',
		'inventory:read',
		'inventory:transfer',
		'inventory:count',
		'inventory:approve_count',
		'inventory:record_waste',
		'procurement:read',
		'procurement:create_po',
		'procurement:receive_goods',
		'procurement:input_invoice',
		'payables:read',
		'petty_cash:read',
		'petty_cash:spend',
		'petty_cash:approve',
		'eod:view_summary'
	],

	// Manajer Cabang (Store Manager): Operasional toko, kas kecil toko, dan tutup hari
	store_manager: [
		'dashboard:view',
		'approvals:read',
		'reports:read',
		'org:read',
		'catalog:read',
		'catalog:propose_menu',
		'inventory:read',
		'inventory:count',
		'inventory:record_waste',
		'procurement:read',
		'procurement:create_po',
		'procurement:receive_goods',
		'procurement:input_invoice',
		'payables:read',
		'petty_cash:read',
		'petty_cash:spend',
		'petty_cash:count_physical',
		'eod:close',
		'eod:view_summary'
	],

	// Kasir Outlet (Cashier): Operasional POS harian standar
	// Catatan: Aksi sensitif seperti void, diskon manual, buka laci kas manual secara default OFF (bisa ditambah di checklist)
	cashier: [
		'pos:order:create',
		'pos:order:read',
		'pos:payment:collect',
		'pos:receipt:reprint',
		'pos:shift:manage'
	]
};

/**
 * Memeriksa apakah sebuah izin cocok dengan salah satu izin dalam daftar.
 * Mendukung exact match, universal wildcard `*`, dan resource wildcard `resource:*`.
 */
export function hasPermissionMatch(grantedList: string[] | undefined, target: string): boolean {
	if (!grantedList || grantedList.length === 0) return false;
	if (grantedList.includes('*')) return true;
	if (grantedList.includes(target)) return true;

	const [targetResource, targetAction] = target.split(':');
	if (targetResource && grantedList.includes(`${targetResource}:*`)) {
		return true;
	}
	if (targetAction && grantedList.includes(`*:${targetAction}`)) {
		return true;
	}
	return false;
}

/**
 * Memeriksa apakah sebuah izin secara eksplisit dicabut (`-permissionKey`).
 */
export function isPermissionRevoked(grantedList: string[] | undefined, target: string): boolean {
	if (!grantedList || grantedList.length === 0) return false;
	if (grantedList.includes(`-${target}`) || grantedList.includes('-*')) {
		return true;
	}
	const [targetResource] = target.split(':');
	if (targetResource && grantedList.includes(`-${targetResource}:*`)) {
		return true;
	}
	return false;
}

/**
 * Menghitung daftar izin aktif pengguna untuk kebutuhan tampilan UI checklist.
 * Menggabungkan izin default peran + izin tambahan (+grant) - izin yang dicabut (-revoke).
 */
export function getEffectivePermissions(user: User | null | undefined): Set<string> {
	if (!user) return new Set();

	// Jika owner / superadmin, seluruh izin di katalog otomatis aktif
	if (user.role === 'owner' || user.permissions?.includes('*')) {
		return new Set(PERMISSION_CATALOG.map((p) => p.key));
	}

	const effective = new Set<string>();

	// 1. Masukkan izin dasar dari template peran bawaan
	const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
	for (const perm of roleDefaults) {
		if (perm.endsWith(':*')) {
			const resource = perm.split(':')[0];
			for (const def of PERMISSION_CATALOG) {
				if (def.key.startsWith(`${resource}:`)) {
					effective.add(def.key);
				}
			}
		} else {
			effective.add(perm);
		}
	}

	// 2. Terapkan penambahan / pencabutan izin granular individual
	if (Array.isArray(user.permissions)) {
		for (const p of user.permissions) {
			if (p.startsWith('-')) {
				const revoked = p.slice(1);
				if (revoked.endsWith(':*')) {
					const resource = revoked.split(':')[0];
					for (const def of PERMISSION_CATALOG) {
						if (def.key.startsWith(`${resource}:`)) {
							effective.delete(def.key);
						}
					}
				} else {
					effective.delete(revoked);
				}
			} else if (p.endsWith(':*')) {
				const resource = p.split(':')[0];
				for (const def of PERMISSION_CATALOG) {
					if (def.key.startsWith(`${resource}:`)) {
						effective.add(def.key);
					}
				}
			} else {
				effective.add(p);
			}
		}
	}

	return effective;
}

/**
 * Memeriksa apakah pengguna berhak melakukan aksi pada sumber daya tertentu.
 * Pintu gerbang otorisasi utama (Policy Enforcement Point) untuk UI.
 *
 * Contoh:
 * - `can(user, 'pos:order:void')`
 * - `can(user, 'inventory:read', { outletId: 'out-senopati' })`
 * - `can(user, 'spend', 'petty_cash', { outletId: 'out-senopati', amount: 350000 })`
 */
export function can(
	user: User | null | undefined,
	actionOrPermission: string,
	resourceOrContext?: string | CanContext,
	maybeContext?: CanContext
): boolean {
	if (!user) return false;

	// Superadmin / Owner selalu berhak melakukan apa pun
	if (user.role === 'owner' || user.permissions?.includes('*')) {
		return true;
	}

	// Normalisasi parameter: (user, action, resource, context) vs (user, 'action:resource', context)
	let permissionKey: string;
	let context: CanContext | undefined;

	if (typeof resourceOrContext === 'string') {
		permissionKey = `${resourceOrContext}:${actionOrPermission}`;
		context = maybeContext;
	} else {
		permissionKey = actionOrPermission;
		context = resourceOrContext;
	}

	// 1. Validasi scope outlet jika context menyertakan outletId
	if (context?.outletId) {
		if (!isInScope(user, context.outletId)) {
			return false;
		}
	}

	// 2. Evaluasi Granular Permissions Langsung dari Pengguna (PBAC Overrides)
	if (Array.isArray(user.permissions)) {
		// A. Explicit Revoke (-permission) memiliki prioritas penolakan tertinggi
		if (isPermissionRevoked(user.permissions, permissionKey)) {
			return false;
		}

		// B. Explicit Grant / Wildcard
		if (hasPermissionMatch(user.permissions, permissionKey)) {
			return true;
		}
	}

	// 3. Evaluasi Template Default Peran (Fallback standar peran)
	const rolePermissions = ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
	if (hasPermissionMatch(rolePermissions, permissionKey)) {
		return true;
	}

	// 4. Default Deny: Tolak jika tidak ada izin yang cocok
	return false;
}
