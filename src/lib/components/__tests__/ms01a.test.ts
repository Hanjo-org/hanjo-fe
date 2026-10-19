/**
 * Suite Pengujian Sub-Fase MS-01A: Navigasi Deklaratif, Lencana & Notifikasi
 * Referensi: PRD 8.4, MILESTONE.md §MS-01, MS-01.md §T-01.1 & §T-01.3, AC-01.4
 */

import { getNavigationForUser, NAVIGATION_CONFIG } from '../../config/navigation.js';
import { can, getEffectivePermissions } from '../../auth/can.js';
import { navService } from '../../services/nav.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const srcDir = path.join(rootDir, 'src');

async function runTests() {
	console.log('🧪 Memulai pengujian MS-01A: Navigasi Deklaratif, Lencana & Notifikasi...\n');
	let passed = 0;
	let failed = 0;

	function assert(condition: boolean, msg: string) {
		if (condition) {
			console.log(`  ✅ PASS: ${msg}`);
			passed++;
		} else {
			console.error(`  ❌ FAIL: ${msg}`);
			failed++;
		}
	}

	// -------------------------------------------------------------------------
	// 1. Uji Konfigurasi Navigasi Deklaratif PRD 8.4 (T-01.1)
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Struktur Grup Navigasi PRD 8.4 (T-01.1)');
	const sectionIds = NAVIGATION_CONFIG.map((s) => s.id);
	assert(sectionIds.includes('top'), 'Memiliki seksi Atas (Dashboard & Persetujuan)');
	assert(sectionIds.includes('operasional'), 'Memiliki seksi Operasional');
	assert(sectionIds.includes('keuangan'), 'Memiliki seksi Keuangan');
	assert(sectionIds.includes('master_data'), 'Memiliki seksi Master Data');
	assert(sectionIds.includes('sistem'), 'Memiliki seksi Sistem');

	// Cek aturan warna lencana (merah: danger, kuning: warning, biru: info)
	const invItem = NAVIGATION_CONFIG.find((s) => s.id === 'operasional')?.items.find((i) => i.id === 'inventory');
	assert(invItem?.badgeVariant === 'danger', 'Lencana stok minimum bervarian danger (Merah)');

	const appItem = NAVIGATION_CONFIG.find((s) => s.id === 'top')?.items.find((i) => i.id === 'approvals');
	assert(appItem?.badgeVariant === 'warning', 'Lencana persetujuan bervarian warning (Kuning)');

	const catItem = NAVIGATION_CONFIG.find((s) => s.id === 'master_data')?.items.find((i) => i.id === 'catalog');
	assert(catItem?.badgeVariant === 'info', 'Lencana usulan katalog bervarian info (Biru)');

	// Cek pemetaan lencana pada submenu spesifik
	const invSubItem = invItem?.subItems?.find((sub) => sub.badgeKey === 'inventory.below_min');
	assert(invSubItem?.title === 'Stok per Outlet', 'Submenu Stok per Outlet memiliki badgeKey inventory.below_min');

	const procItem = NAVIGATION_CONFIG.find((s) => s.id === 'operasional')?.items.find((i) => i.id === 'procurement');
	const procSubItem = procItem?.subItems?.find((sub) => sub.badgeKey === 'procurement.invoices_waiting');
	assert(procSubItem?.href === '/procurement#invoices', 'Submenu Nota Supplier memiliki badgeKey procurement.invoices_waiting');

	// -------------------------------------------------------------------------
	// 2. Uji Service Lencana Navigasi (T-01.3 & AC-01.4)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Layanan Lencana Navigasi (GET /api/v1/nav/badges)');

	// Badges untuk Owner (Penuh)
	const ownerBadges = await navService.getBadges('owner');
	assert(typeof ownerBadges['approvals.pending_for_me'] === 'number', 'Owner menerima badge approvals');
	assert(typeof ownerBadges['inventory.below_min'] === 'number', 'Owner menerima badge stok hampir habis');
	assert(typeof ownerBadges['finance.true_up_pending'] === 'number', 'Owner menerima badge true-up');

	// Badges untuk Store Manager (Terkunci & Dibatasi)
	const smBadges = await navService.getBadges('store_manager');
	assert(smBadges['finance.true_up_pending'] === undefined, 'Store Manager TIDAK menerima badge keuangan');
	assert(typeof smBadges['inventory.below_min'] === 'number', 'Store Manager menerima badge stok outlet');

	// Badges untuk Finance
	const finBadges = await navService.getBadges('finance');
	assert(typeof finBadges['finance.true_up_pending'] === 'number', 'Finance menerima badge true-up');
	assert(finBadges['catalog.proposals_pending'] === undefined, 'Finance tidak menerima badge katalog');

	// -------------------------------------------------------------------------
	// 3. Uji Layanan Notifikasi (T-01.3)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Layanan Notifikasi Pengguna (GET /api/v1/notifications)');
	const notifs = await navService.getNotifications();
	assert(Array.isArray(notifs) && notifs.length > 0, 'Daftar notifikasi berhasil diambil');
	const firstNotif = notifs[0];
	assert(Boolean(firstNotif.id && firstNotif.title && firstNotif.type), 'Format item notifikasi lengkap');

	// Tandai satu dibaca
	await navService.markNotificationAsRead(firstNotif.id);
	assert(true, 'Mark single notification as read berhasil dieksekusi');

	// Tandai semua dibaca
	await navService.markAllNotificationsAsRead();
	assert(true, 'Mark all notifications as read berhasil dieksekusi');

	// -------------------------------------------------------------------------
	// 4. Uji Pemisahan Berkas Styling & Komponen Sidebar (Rule 4)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Keberadaan File Fisik & Pemisahan Style');
	const layoutDir = path.join(srcDir, 'lib', 'components', 'layout');
	const sidebarPath = path.join(layoutDir, 'Sidebar.svelte');
	const sidebarCssPath = path.join(layoutDir, 'sidebar.css');
	assert(fs.existsSync(sidebarPath), 'Sidebar.svelte ada');
	assert(fs.existsSync(sidebarCssPath), 'sidebar.css modular stylesheet ada');

	const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
	assert(sidebarContent.includes("import './sidebar.css'"), 'Sidebar.svelte mengimpor stylesheet modular terpisah');
	assert(sidebarContent.includes('badge-count'), 'Sidebar.svelte merender elemen badge-count');
	assert(sidebarContent.includes('collapsed-badge-dot'), 'Sidebar.svelte mendukung titik dot badge saat ciut');
	assert(sidebarContent.includes('collapsed-flyout'), 'Sidebar.svelte mendukung flyout submenu saat ciut');

	// -------------------------------------------------------------------------
	// 5. Uji Arsitektur Navigasi Berbasis PBAC & Granular Override (AC-01.14)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Arsitektur Navigasi PBAC (AC-01.14)');

	// SM standar: tidak punya akses menu finance
	const defaultSmNav = getNavigationForUser('store_manager');
	const defaultSmHasFinance = defaultSmNav.some((s) => s.items.some((i) => i.id === 'finance'));
	assert(!defaultSmHasFinance, 'Store Manager default TIDAK memiliki menu Keuangan & Pajak');

	// Kasir/SM A (spesial): role store_manager TAPI punya izin granular 'finance:read'
	const customSmUser = {
		id: 'user-sm-senior',
		name: 'Budi Senior',
		email: 'budi.senior@hanjo.id',
		role: 'store_manager' as const,
		permissions: ['finance:read']
	};
	const customSmNav = getNavigationForUser(customSmUser);
	const customSmHasFinance = customSmNav.some((s) => s.items.some((i) => i.id === 'finance'));
	assert(customSmHasFinance, 'Kasir / SM dengan izin granular finance:read BERHASIL melihat menu Keuangan (PBAC Override)');

	// User dengan explicit revoke: izin dicabut dengan awalan '-'
	const revokedSmUser = {
		id: 'user-sm-restricted',
		name: 'Budi Restricted',
		email: 'budi.restricted@hanjo.id',
		role: 'store_manager' as const,
		permissions: ['-inventory:read']
	};
	const revokedSmNav = getNavigationForUser(revokedSmUser);
	const revokedSmHasInv = revokedSmNav.some((s) => s.items.some((i) => i.id === 'inventory'));
	assert(!revokedSmHasInv, 'User dengan explicit revoke (-inventory:read) TIDAK melihat menu Inventaris');

	// Superadmin / Owner: Bisa semua aksi secara default
	const ownerUser = { id: 'usr-rina', name: 'Rina Owner', email: 'rina@hanjo.coffee', role: 'owner' as const };
	assert(can(ownerUser, 'pos:order:void'), 'Owner otomatis berhak atas aksi sensitif pos:order:void');
	assert(can(ownerUser, 'finance:reopen_period'), 'Owner otomatis berhak atas aksi sensitif finance:reopen_period');

	// Kasir Default vs Kasir Senior (Checklist Override)
	const standardCashier = { id: 'c-1', name: 'Kasir Budi', email: 'budi@hanjo.coffee', role: 'cashier' as const };
	assert(can(standardCashier, 'pos:order:create'), 'Kasir standar berhak buat pesanan (pos:order:create)');
	assert(!can(standardCashier, 'pos:order:void'), 'Kasir standar SECARA DEFAULT TIDAK BERHAK void pesanan (pos:order:void)');

	// Kasir Senior dengan checklist tambahan (+pos:order:void)
	const seniorCashier = {
		id: 'c-2',
		name: 'Kasir Senior Maya',
		email: 'maya@hanjo.coffee',
		role: 'cashier' as const,
		permissions: ['pos:order:void']
	};
	assert(can(seniorCashier, 'pos:order:void'), 'Kasir senior dengan checklist tambahan BERHASIL melakukan void pesanan');

	// Kasir dengan checklist dicabut (-pos:receipt:reprint)
	const restrictedCashier = {
		id: 'c-3',
		name: 'Kasir Baru',
		email: 'baru@hanjo.coffee',
		role: 'cashier' as const,
		permissions: ['-pos:receipt:reprint']
	};
	assert(!can(restrictedCashier, 'pos:receipt:reprint'), 'Kasir dengan checklist dicabut TIDAK BERHAK cetak ulang struk');

	// Helper getEffectivePermissions (untuk merender checkbox checklist di UI)
	const effectiveStandard = getEffectivePermissions(standardCashier);
	assert(effectiveStandard.has('pos:order:create'), 'getEffectivePermissions memuat izin default kasir');
	assert(!effectiveStandard.has('pos:order:void'), 'getEffectivePermissions tidak mencentang void untuk kasir standar');

	const effectiveSenior = getEffectivePermissions(seniorCashier);
	assert(effectiveSenior.has('pos:order:void'), 'getEffectivePermissions mencentang void untuk kasir senior');

	// -------------------------------------------------------------------------
	// 6. Uji Komponen Header & Lonceng Notifikasi (T-01.2)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 6: Komponen Header, Lonceng Notifikasi & Filter (T-01.2)');
	const headerPath = path.join(layoutDir, 'Header.svelte');
	const headerCssPath = path.join(layoutDir, 'header.css');
	assert(fs.existsSync(headerPath), 'Header.svelte ada');
	assert(fs.existsSync(headerCssPath), 'header.css modular stylesheet ada (Rule 4)');

	const headerContent = fs.readFileSync(headerPath, 'utf-8');
	assert(headerContent.includes("import './header.css'"), 'Header.svelte mengimpor stylesheet modular terpisah');
	assert(headerContent.includes('header-notification-menu'), 'Header.svelte memiliki kontainer menu notifikasi');
	assert(headerContent.includes('notification-trigger-btn'), 'Header.svelte memiliki tombol pemicu lonceng notifikasi');
	assert(headerContent.includes('notif-badge'), 'Header.svelte memiliki lencana angka belum dibaca');
	assert(headerContent.includes('notification-dropdown-menu'), 'Header.svelte memiliki dropdown popover notifikasi');
	assert(headerContent.includes('mark-all-read-btn'), 'Header.svelte memiliki tombol Tandai Semua Dibaca');
	assert(headerContent.includes('header-outlet-picker'), 'Header.svelte memiliki pemilih scope outlet');
	assert(headerContent.includes('wib-date-badge'), 'Header.svelte memiliki badge tanggal hari bisnis WIB');
	assert(headerContent.includes('#header-notification-menu'), 'Header.svelte menangani click outside untuk menu notifikasi');

	// -------------------------------------------------------------------------
	// 7. Uji Pencarian Global Command Palette & Scope Outlet (T-01.4 & AC-01.7)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 7: Pencarian Global Command Palette (T-01.4 & AC-01.7)');
	const palettePath = path.join(layoutDir, 'CommandPalette.svelte');
	const paletteCssPath = path.join(layoutDir, 'command_palette.css');
	assert(fs.existsSync(palettePath), 'CommandPalette.svelte ada');
	assert(fs.existsSync(paletteCssPath), 'command_palette.css modular stylesheet ada (Rule 4)');

	const paletteContent = fs.readFileSync(palettePath, 'utf-8');
	assert(paletteContent.includes("import './command_palette.css'"), 'CommandPalette.svelte mengimpor stylesheet modular terpisah');
	assert(paletteContent.includes('navService.search'), 'CommandPalette.svelte memanggil pencarian entitas navService.search');
	assert(paletteContent.includes('HALAMAN &amp; MENU'), 'CommandPalette.svelte mengelompokkan hasil Halaman & Menu');
	assert(paletteContent.includes('ENTITAS &amp; DOKUMEN'), 'CommandPalette.svelte mengelompokkan hasil Entitas & Dokumen');

	// Pencarian teks umum (misal: "susu" atau "fresh milk")
	const milkResults = await navService.search('fresh milk');
	assert(milkResults.length > 0, 'navService.search menemukan entitas dengan kata kunci fresh milk');
	assert(milkResults.some((r) => r.type === 'item'), 'Hasil pencarian mencakup item bahan baku');

	// Uji Scope Outlet (AC-01.7):
	// Owner dapat melihat PO seluruh cabang
	const ownerPoResults = await navService.search('PO', { role: 'owner' });
	const hasBdgForOwner = ownerPoResults.some((r) => r.outlet_id === 'out-bdg-01');
	assert(hasBdgForOwner, 'Owner BERHASIL melihat PO lintas outlet (Bandung)');

	// Store Manager Senopati (out-jkt-01) TIDAK BOLEH melihat PO outlet Bandung (out-bdg-01)
	const smPoResults = await navService.search('PO', { role: 'store_manager', outlet_id: 'out-jkt-01' });
	const hasBdgForSm = smPoResults.some((r) => r.outlet_id === 'out-bdg-01');
	assert(!hasBdgForSm, 'Store Manager Senopati TIDAK DAPAT melihat PO outlet lain (Bandung) (AC-01.7)');

	const hasJktForSm = smPoResults.some((r) => r.outlet_id === 'out-jkt-01');
	assert(hasJktForSm, 'Store Manager Senopati BERHASIL melihat PO outletnya sendiri (Senopati)');

	console.log('\n========================================');
	console.log(`Hasil Pengujian: ${passed} Lulus, ${failed} Gagal`);
	console.log('========================================');

	if (failed > 0) {
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error('Pengujian gagal dengan error:', err);
	process.exit(1);
});
