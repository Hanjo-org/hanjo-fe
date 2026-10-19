/**
 * Suite Pengujian Sub-Fase MS-00D: Shell Deklaratif, Navigasi & Panel Dev
 * Referensi: MILESTONE.md §MS-00D, T-00.10, T-00.13, AC-00.2, AC-00.7
 */

import { getNavigationForUser, COMMAND_PALETTE_ITEMS } from '../../config/navigation.js';
import { apiClient } from '../../api/client.js';
import { Endpoints } from '../../api/contract/endpoints.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const srcDir = path.join(rootDir, 'src');

async function runTests() {
	console.log('🧪 Memulai pengujian MS-00D: Shell Deklaratif, Navigasi & Panel Dev...\n');
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
	// 1. Uji Navigasi Deklaratif untuk 4 Peran (T-00.10, PRD 8.4)
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Navigasi Deklaratif 4 Peran (navigation.ts)');

	// OWNER
	const ownerNav = getNavigationForUser('owner', {
		inventory: true,
		procurement: true,
		petty_cash: true,
		partner_ownership: true,
		tax: true
	});
	const ownerSectionIds = ownerNav.map((s) => s.id);
	assert(ownerSectionIds.includes('operasional') && ownerSectionIds.includes('keuangan'), 'Owner memiliki seksi operasional & keuangan');
	const ownerFinance = ownerNav.find((s) => s.id === 'keuangan')?.items.find((i) => i.id === 'finance');
	assert(Boolean(ownerFinance), 'Owner dapat melihat menu Keuangan & Pajak');

	// STORE MANAGER (Terkunci & Dibatasi)
	const smNav = getNavigationForUser('store_manager', {
		inventory: true,
		procurement: true,
		petty_cash: true,
		partner_ownership: true
	});
	const smFinanceItem = smNav.find((s) => s.id === 'keuangan')?.items.find((i) => i.id === 'finance');
	assert(smFinanceItem === undefined, 'Store Manager DILARANG melihat menu Keuangan & Pajak');

	const smSettingsItem = smNav.find((s) => s.id === 'sistem')?.items.find((i) => i.id === 'settings');
	assert(smSettingsItem === undefined, 'Store Manager DILARANG melihat menu Pengaturan Sistem');

	const smPettyCash = smNav.find((s) => s.id === 'operasional')?.items.find((i) => i.id === 'petty_cash');
	const smHqExpense = smPettyCash?.subItems?.find((sub) => sub.href.includes('#hq'));
	assert(smHqExpense === undefined, 'Store Manager DILARANG melihat Biaya Pusat (HQ Expenses)');

	const smReports = smNav.find((s) => s.id === 'keuangan')?.items.find((i) => i.id === 'reports');
	const smPnlReport = smReports?.subItems?.find((sub) => sub.href.includes('#pnl'));
	assert(smPnlReport === undefined, 'Store Manager DILARANG melihat Laporan Laba Rugi (P&L)');

	// HQ ADMIN
	const adminNav = getNavigationForUser('hq_admin', { inventory: true, procurement: true });
	const adminPnl = adminNav.find((s) => s.id === 'keuangan')?.items.find((i) => i.id === 'reports')?.subItems?.find((s) => s.href.includes('#pnl'));
	assert(adminPnl === undefined, 'HQ Admin DILARANG melihat Laba Rugi (P&L)');

	// FINANCE
	const financeNav = getNavigationForUser('finance', { inventory: true, procurement: true, tax: true });
	const financePnl = financeNav.find((s) => s.id === 'keuangan')?.items.find((i) => i.id === 'reports')?.subItems?.find((s) => s.href.includes('#pnl'));
	assert(Boolean(financePnl), 'Finance berhak melihat Laba Rugi (P&L)');

	// -------------------------------------------------------------------------
	// 2. Uji Efek Feature Flag terhadap Navigasi
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Pengaruh Feature Flag terhadap Navigasi');

	const navNoPettyCash = getNavigationForUser('owner', { petty_cash: false, inventory: true });
	const hasPettyCash = navNoPettyCash.find((s) => s.id === 'operasional')?.items.some((i) => i.id === 'petty_cash');
	assert(hasPettyCash === false, 'Mematikan flag petty_cash menyembunyikan menu Biaya & Kas Kecil');

	const navNoPartner = getNavigationForUser('owner', { partner_ownership: false });
	const outletSub = navNoPartner.find((s) => s.id === 'master_data')?.items.find((i) => i.id === 'outlets')?.subItems;
	const hasOwnersTab = outletSub?.some((s) => s.href.includes('#owners'));
	assert(hasOwnersTab === false, 'Mematikan flag partner_ownership menyembunyikan submenu Pemilik & Investor');

	// -------------------------------------------------------------------------
	// 3. Uji Panel Dev & Endpoint Kontrol Runtime (T-00.13, AC-00.7, AC-00.9)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Endpoint Kontrol Dev (GET /dev/state, clock, latency, reset)');

	// GET /dev/state
	const devState = await apiClient.get<any>(Endpoints.DEV.STATE);
	assert(devState.data_source === 'mock', 'Dev state mengembalikan data_source: mock');
	assert(typeof devState.clock.business_date === 'string', 'Dev state memuat business_date WIB');

	// POST /dev/clock (Freeze & Unfreeze)
	const freezeRes = await apiClient.post<any>(Endpoints.DEV.CLOCK, { action: 'freeze' });
	assert(freezeRes.is_frozen === true, 'Clock berhasil dibekukan (freeze)');

	const unfreezeRes = await apiClient.post<any>(Endpoints.DEV.CLOCK, { action: 'unfreeze' });
	assert(unfreezeRes.is_frozen === false, 'Clock berhasil dicairkan (unfreeze)');

	// POST /dev/latency
	const latRes = await apiClient.post<any>(Endpoints.DEV.LATENCY, { min_ms: 100, max_ms: 150 });
	assert(latRes.latency.minMs === 100, 'Latensi berhasil disetel ke 100ms');

	// POST /dev/reset
	const resetRes = await apiClient.post<any>(Endpoints.DEV.RESET, {});
	assert(resetRes.success === true, 'Reset demo berhasil dieksekusi');

	// -------------------------------------------------------------------------
	// 4. Uji Berkas Fisik Shell Layout & Halaman Fallback (T-00.10)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Keberadaan Berkas Fisik Shell & Halaman Fallback');

	const layoutCompDir = path.join(srcDir, 'lib', 'components', 'layout');
	assert(fs.existsSync(path.join(layoutCompDir, 'Sidebar.svelte')), 'Sidebar.svelte ada');
	assert(fs.existsSync(path.join(layoutCompDir, 'Header.svelte')), 'Header.svelte ada');
	assert(fs.existsSync(path.join(layoutCompDir, 'CommandPalette.svelte')), 'CommandPalette.svelte ada');
	assert(fs.existsSync(path.join(layoutCompDir, 'DevSourcePanel.svelte')), 'DevSourcePanel.svelte ada');

	const routesDir = path.join(srcDir, 'routes');
	assert(fs.existsSync(path.join(routesDir, 'login', '+page.svelte')), 'Halaman login (+page.svelte) ada');
	assert(fs.existsSync(path.join(routesDir, '403', '+page.svelte')), 'Halaman 403 Forbidden (+page.svelte) ada');
	assert(fs.existsSync(path.join(routesDir, '+error.svelte')), 'Halaman +error.svelte ada');

	// -------------------------------------------------------------------------
	// 5. Uji Batas Impor Arsitektural Layout (AC-00.2)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Batas Impor Arsitektural Shell & Layout (AC-00.2)');

	const layoutFiles = [
		path.join(layoutCompDir, 'Sidebar.svelte'),
		path.join(layoutCompDir, 'Header.svelte'),
		path.join(layoutCompDir, 'CommandPalette.svelte'),
		path.join(layoutCompDir, 'DevSourcePanel.svelte'),
		path.join(routesDir, '+layout.svelte'),
		path.join(routesDir, 'login', '+page.svelte'),
		path.join(routesDir, '403', '+page.svelte'),
		path.join(routesDir, '+error.svelte')
	];

	const forbiddenPattern = /from\s+['"][^'"]*drivers\/mock[^'"]*['"]/;
	let cleanLayout = true;

	for (const f of layoutFiles) {
		const code = fs.readFileSync(f, 'utf-8');
		if (forbiddenPattern.test(code)) {
			console.error(`Pelanggaran terdeteksi di: ${f}`);
			cleanLayout = false;
		}
	}

	assert(cleanLayout, 'Seluruh berkas shell & halaman tidak mengimpor dari drivers/mock/*');

	console.log('\n========================================');
	console.log(`Hasil Pengujian: ${passed} Lulus, ${failed} Gagal`);
	console.log('========================================\n');

	if (failed > 0) {
		process.exit(1);
	}
}

runTests();
