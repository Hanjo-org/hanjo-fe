/**
 * Suite Pengujian Sub-Fase MS-01B & MS-01C: Proyeksi Kartu Dashboard 4 Peran & EOD
 * Referensi: PRD 8.1, MILESTONE.md §MS-01, MS-01.md §T-01.5 s/d §T-01.14
 * Kriteria Penerimaan: AC-01.1, AC-01.2, AC-01.3, AC-01.5, AC-01.6, AC-01.12, AC-01.13
 */

import {
	ROLE_DASHBOARD_CARDS,
	canRoleAccessCard,
	calculateGrossProfit,
	calculateMarginPct,
	formatEstimateBadge,
	evaluateEodReadiness
} from '../../domain/dashboard.js';
import { dashboardService } from '../../services/dashboard.service.js';
import { eodService } from '../../services/eod.service.js';
import { initDefaultEodRecords } from '../../api/drivers/mock/handlers/eod.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const srcDir = path.join(rootDir, 'src');

async function runTests() {
	console.log('🧪 Memulai pengujian MS-01B & MS-01C: Proyeksi Kartu Dashboard 4 Peran...\n');
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

	// Reset state EOD sebelum pengujian
	initDefaultEodRecords('2026-10-13');

	// -------------------------------------------------------------------------
	// 1. Uji Logika Domain Murni (Golden Rule 2 & MILESTONE.md §6.11)
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Logika Domain Murni Dashboard & Formula Kalkulasi');
	const gp = calculateGrossProfit('8450000', '2687100');
	assert(gp === 5762900, 'Kalkulasi laba kotor tepat: 8.450.000 - 2.687.100 = 5.762.900');

	const margin = calculateMarginPct('8450000', '5762900');
	assert(margin === 68.2, 'Kalkulasi margin persentase tepat: 68.2%');

	const estBadge1 = formatEstimateBadge(1);
	assert(estBadge1 === 'Estimasi · 1 nota belum masuk', 'Lencana estimasi tepat saat 1 nota pending (AC-01.5)');

	const estBadge0 = formatEstimateBadge(0);
	assert(estBadge0 === undefined, 'Lencana estimasi tidak tampil saat 0 nota pending');

	const readyEod = evaluateEodReadiness([
		{ key: 'cash_drawer', label: 'Kas Laci', done: true },
		{ key: 'sales_synced', label: 'POS Sync', done: true },
		{ key: 'waste_recorded', label: 'Waste', done: true }
	]);
	assert(readyEod === true, 'Evaluasi kesiapan EOD bernilai true jika seluruh checklist selesai');

	const notReadyEod = evaluateEodReadiness([
		{ key: 'cash_drawer', label: 'Kas Laci', done: false },
		{ key: 'sales_synced', label: 'POS Sync', done: true },
		{ key: 'waste_recorded', label: 'Waste', done: false }
	]);
	assert(notReadyEod === false, 'Evaluasi kesiapan EOD bernilai false jika ada checklist belum selesai');

	// -------------------------------------------------------------------------
	// 2. Uji Matriks Kartu Dashboard per Peran (AC-01.1 & T-01.6 s/d T-01.9)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Matriks Hak Akses Kartu per Peran (AC-01.1)');
	const ownerCards = ROLE_DASHBOARD_CARDS.owner;
	assert(ownerCards.includes('action_center'), 'Owner memiliki kartu action_center');
	assert(ownerCards.includes('sales_summary'), 'Owner memiliki kartu sales_summary');
	assert(ownerCards.includes('gross_profit'), 'Owner memiliki kartu gross_profit');
	assert(ownerCards.includes('outlet_comparison'), 'Owner memiliki kartu outlet_comparison');
	assert(ownerCards.includes('stock_issues'), 'Owner memiliki kartu stock_issues');
	assert(ownerCards.includes('hq_payables'), 'Owner memiliki kartu hq_payables');
	assert(ownerCards.includes('outlet_ops_status'), 'Owner memiliki kartu outlet_ops_status');
	assert(ownerCards.includes('outlet_eod_status'), 'Owner memiliki kartu outlet_eod_status');
	assert(!ownerCards.includes('sm_stock_min'), 'Owner tidak memiliki kartu sm_stock_min');

	const hqCards = ROLE_DASHBOARD_CARDS.hq_admin;
	assert(hqCards.includes('stock_issues'), 'HQ Admin memiliki kartu stock_issues');
	assert(hqCards.includes('outlet_comparison'), 'HQ Admin memiliki kartu outlet_comparison');
	assert(hqCards.includes('gross_profit'), 'HQ Admin memiliki kartu gross_profit (Paritas Dashboard Owner & HQ Admin)');
	assert(hqCards.includes('sales_summary'), 'HQ Admin memiliki kartu sales_summary');

	const financeCards = ROLE_DASHBOARD_CARDS.finance;
	assert(financeCards.includes('hq_payables'), 'Finance memiliki kartu hq_payables');
	assert(financeCards.includes('petty_cash'), 'Finance memiliki kartu petty_cash');
	assert(financeCards.includes('payment_reconciliation'), 'Finance memiliki kartu payment_reconciliation');
	assert(financeCards.includes('true_up_pending'), 'Finance memiliki kartu true_up_pending');
	assert(financeCards.includes('gross_profit'), 'Finance memiliki kartu gross_profit');
	assert(!financeCards.includes('sales_summary'), 'Finance TIDAK memiliki kartu sales_summary');

	const smCards = ROLE_DASHBOARD_CARDS.store_manager;
	assert(smCards.includes('sm_stock_min'), 'Store Manager memiliki kartu sm_stock_min');
	assert(smCards.includes('sm_count_schedule'), 'Store Manager memiliki kartu sm_count_schedule');
	assert(smCards.includes('sm_petty_cash'), 'Store Manager memiliki kartu sm_petty_cash');
	assert(smCards.includes('sm_proposals'), 'Store Manager memiliki kartu sm_proposals');
	assert(smCards.includes('sm_eod_status'), 'Store Manager memiliki kartu sm_eod_status');
	assert(!smCards.includes('outlet_comparison'), 'Store Manager TIDAK memiliki kartu outlet_comparison (Scope lock)');
	assert(!smCards.includes('petty_cash'), 'Store Manager TIDAK memiliki kartu petty_cash konsolidasi');

	// -------------------------------------------------------------------------
	// 3. Uji Dashboard Service & Mock Handlers (T-01.6 - T-01.9, T-01.10)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Layanan Proyeksi Data Kartu (API Client & Mock Handler)');

	// Action center per role
	const ownAct = await dashboardService.getCard<any>('action_center', { role: 'owner' });
	assert(ownAct.data.items.length === 3, 'Owner menerima 3 item tindakan mendesak');

	const smAct = await dashboardService.getCard<any>('action_center', { role: 'store_manager', outlet_id: 'out-jkt-01', date: '2026-10-13' });
	const hasEodAct = smAct.data.items.some((i: any) => i.id === 'act-sm-eod');
	assert(hasEodAct, 'Store Manager menerima item tindakan "Tutup Hari Belum Selesai" jika EOD pending (AC-01.12)');

	// Sales summary (Konsolidasi Organisasi Jodi)
	const salesRes = await dashboardService.getCard<any>('sales_summary', { organization_id: 'org-jodi', outlet_id: '*' });
	assert(salesRes.data.omzet === '8450000.00', 'Omzet konsolidasi tepat: Rp 8.450.000');
	assert(salesRes.data.cup_count === 412, 'Total cup konsolidasi tepat: 412 cup');
	assert(salesRes.data.daily_trends.length === 7, 'Tren harian memuat 7 hari untuk grafik garis (T-01.10)');
	assert(salesRes.data.hourly_traffic.length > 0, 'Distribusi jam ramai tersedia untuk grafik batang (T-01.10)');

	// Scoped sales summary
	const jktSales = await dashboardService.getCard<any>('sales_summary', { outlet_id: 'out-jkt-01' });
	assert(jktSales.data.omzet === '4820000.00', 'Omzet outlet Senopati tepat: Rp 4.820.000');
	assert(jktSales.data.cup_count === 238, 'Cup outlet Senopati tepat: 238 cup');

	// Gross profit & Estimasi badge (AC-01.5)
	const gpRes = await dashboardService.getCard<any>('gross_profit', { organization_id: 'org-jodi' });
	assert(gpRes.data.gross_profit === '5762900.00', 'Laba kotor konsolidasi: Rp 5.762.900');
	assert(gpRes.data.margin_pct === '68.20', 'Margin laba kotor: 68.20%');
	assert(gpRes.data.is_estimate === true, 'is_estimate bernilai true karena ada nota pending');
	assert(gpRes.data.estimate_badge === 'Estimasi · 1 nota belum masuk', 'Lencana Estimasi · 1 nota belum masuk tampil (AC-01.5)');

	// Outlet comparison modes
	const compOwner = await dashboardService.getCard<any>('outlet_comparison', { role: 'owner', organization_id: 'org-jodi' });
	assert(compOwner.data.mode === 'full', 'Owner menerima mode perbandingan full (finansial)');
	assert(compOwner.data.rows.length === 3, 'Memuat 3 baris outlet');

	const compAdmin = await dashboardService.getCard<any>('outlet_comparison', { role: 'hq_admin' });
	assert(compAdmin.data.mode === 'operational', 'HQ Admin menerima mode perbandingan operational');

	// Scope protection: Store Manager cannot access outlet_comparison
	let smBlocked = false;
	try {
		await dashboardService.getCard<any>('outlet_comparison', { role: 'store_manager' });
	} catch (e: any) {
		smBlocked = true;
	}
	assert(smBlocked, 'Store Manager DITOLAK saat mencoba mengakses kartu outlet_comparison (Scope protection)');

	// Stock issues
	const stockRes = await dashboardService.getCard<any>('stock_issues');
	assert(stockRes.data.items.length >= 2, 'Stock issues memuat bahan kritis');
	const milkItem = stockRes.data.items.find((i: any) => i.item_name.includes('Fresh Milk'));
	assert(milkItem?.severity === 'danger', 'Fresh Milk berstatus severity danger');

	// HQ Payables
	const payablesRes = await dashboardService.getCard<any>('hq_payables', { role: 'finance' });
	assert(payablesRes.data.total_balance === '14850000.00', 'Total saldo hutang tepat');
	assert(payablesRes.data.aging.days_1_30 !== undefined, 'Aging bucket tersedia');

	// Petty cash
	const pettyRes = await dashboardService.getCard<any>('petty_cash', { organization_id: 'org-jodi' });
	assert(pettyRes.data.outlets.length === 3, 'Kas kecil memuat baris untuk 3 outlet');

	// Ops status
	const opsRes = await dashboardService.getCard<any>('outlet_ops_status', { organization_id: 'org-jodi' });
	assert(opsRes.data.online_count === 3, 'Seluruh 3 outlet berstatus online');

	// Payment reconciliation
	const reconRes = await dashboardService.getCard<any>('payment_reconciliation');
	assert(reconRes.data.status === 'matched', 'Status rekonsiliasi non-tunai matched');
	assert(reconRes.data.discrepancy_amount === '0.00', 'Selisih rekonsiliasi Rp 0');

	// Store manager specific cards
	const smStock = await dashboardService.getCard<any>('sm_stock_min', { outlet_id: 'out-jkt-01' });
	assert(smStock.data.outlet_id === 'out-jkt-01', 'sm_stock_min terkunci di outlet tugas');
	assert(smStock.data.items.length > 0, 'sm_stock_min memuat bahan di bawah minimum');

	// -------------------------------------------------------------------------
	// 4. Uji Alur Tutup Hari / End of Day (T-01.14, AC-01.12, AC-01.13)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Siklus Tutup Hari (EOD) dan Paritas Antar Kartu');

	// 1. Cek status EOD sebelum ditutup
	const initialEodSummary = await eodService.getSummary('2026-10-13');
	const jktBefore = initialEodSummary.outlets.find((o) => o.outlet_id === 'out-jkt-01');
	assert(jktBefore?.eod_status === 'pending', 'Outlet Senopati awalnya berstatus EOD pending');

	const smEodBefore = (await eodService.getStatus('out-jkt-01', '2026-10-13', 'store_manager')) as any;
	assert(smEodBefore.is_completed === false, 'Checklist SM Senopati awalnya belum selesai (is_completed: false)');

	// 2. SM menyelesaikan EOD via POST /api/v1/eod/complete (T-01.14 & AC-01.13)
	const completeRes = await eodService.completeEod({
		outlet_id: 'out-jkt-01',
		business_date: '2026-10-13',
		cash_drawer_counted: true,
		waste_recorded: true,
		notes: 'Tutup hari shift malam'
	});
	assert(completeRes.is_completed === true, 'Eksekusi POST /eod/complete mengembalikan is_completed: true');
	assert(completeRes.completed_at !== undefined, 'Tercatat timestamp waktu penyelesaian EOD');

	// 3. Verifikasi status outlet berubah di kartu Owner/Admin (AC-01.13)
	const updatedEodSummary = await eodService.getSummary('2026-10-13');
	const jktAfter = updatedEodSummary.outlets.find((o) => o.outlet_id === 'out-jkt-01');
	assert(jktAfter?.eod_status === 'completed', 'Status Outlet Senopati BERUBAH menjadi completed di kartu Owner/Admin (AC-01.13)');

	// 4. Verifikasi item "Tutup Hari Belum Selesai" HILANG dari Action Center SM setelah EOD selesai
	const smActAfter = await dashboardService.getCard<any>('action_center', { role: 'store_manager', outlet_id: 'out-jkt-01', date: '2026-10-13' });
	const hasEodActAfter = smActAfter.data.items.some((i: any) => i.id === 'act-sm-eod');
	assert(!hasEodActAfter, 'Item tindakan "Tutup Hari Belum Selesai" OTOMATIS HILANG dari Action Center setelah EOD selesai');

	// -------------------------------------------------------------------------
	// 5. Uji Integritas File Fisik & Pemisahan Style (Rule 2, 4 & T-01.13)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Verifikasi Pemisahan Style & Pembersihan Prototipe');
	const cssPath = path.join(srcDir, 'lib/features/dashboard/dashboard.css');
	assert(fs.existsSync(cssPath), 'Stylesheet modular src/lib/features/dashboard/dashboard.css ADA (Rule 4)');

	const pagePath = path.join(srcDir, 'routes/+page.svelte');
	const pageContent = fs.readFileSync(pagePath, 'utf-8');
	assert(!pageContent.includes('<style>'), '+page.svelte TIDAK memiliki tag <style> mentah ribuan baris (Rule 4)');
	assert(!pageContent.includes('coffee-banner.jpg'), 'Banner foto dekoratif prototipe BERHASIL DIHAPUS (T-01.13)');
	assert(!pageContent.includes('stock-promo.jpg'), 'Kartu promo stok prototipe BERHASIL DIHAPUS (T-01.13)');
	assert(pageContent.includes('dashboardStore'), '+page.svelte mengimpor dan memakai dashboardStore (Rule 2)');
	assert(pageContent.includes('dashboard-grid'), '+page.svelte merender responsive dashboard-grid (T-01.5)');

	console.log('\n========================================');
	console.log(`Hasil Pengujian: ${passed} Lulus, ${failed} Gagal`);
	console.log('========================================');

	if (failed > 0) {
		process.exit(1);
	}
}

runTests();
