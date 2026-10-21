/**
 * Suite Pengujian Sub-Fase MS-01D: Integritas Demo, Konsistensi Data & Fitur Staged
 * Referensi: PRD 8.4, MILESTONE.md §MS-01, MS-01.md §T-01.11, T-01.12, AC-01.3, AC-01.4, AC-01.9, AC-01.10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	canRoleAccessCard,
	CARD_FEATURE_FLAG_MAP
} from '../../domain/dashboard.js';
import { getDefaultFeatureFlags } from '../../config/feature_flags.js';
import { dashboardService } from '../../services/dashboard.service.js';
import { navService } from '../../services/nav.service.js';
import { clock } from '../../api/drivers/mock/engine/clock.js';
import type { SalesSummaryCardData } from '../../api/contract/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const srcDir = path.join(rootDir, 'src');

async function runTests() {
	console.log('🧪 Memulai pengujian MS-01D: Integritas Demo & Konsistensi Data...\n');
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
	// 1. Uji T-01.11: Halaman "Segera Hadir" (Coming Soon Component & Route)
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Halaman & Komponen "Segera Hadir" (T-01.11)');
	const comingSoonComponentPath = path.join(srcDir, 'lib', 'components', 'feedback', 'ComingSoon.svelte');
	assert(fs.existsSync(comingSoonComponentPath), 'Komponen ComingSoon.svelte tersedia di src/lib/components/feedback/');

	const comingSoonContent = fs.readFileSync(comingSoonComponentPath, 'utf-8');
	assert(comingSoonContent.includes('title'), 'Komponen ComingSoon mendukung prop title');
	assert(comingSoonContent.includes('milestone'), 'Komponen ComingSoon mendukung prop milestone');
	assert(comingSoonContent.includes('targetModule'), 'Komponen ComingSoon mendukung konteks modul target');
	assert(comingSoonContent.includes('backUrl'), 'Komponen ComingSoon mendukung navigasi kembali');

	const componentsIndexPath = path.join(srcDir, 'lib', 'components', 'index.ts');
	const componentsIndexContent = fs.readFileSync(componentsIndexPath, 'utf-8');
	assert(componentsIndexContent.includes('ComingSoon'), 'ComingSoon diekspor melalui lib/components/index.ts');

	const comingSoonRoutePath = path.join(srcDir, 'routes', 'coming-soon', '+page.svelte');
	assert(fs.existsSync(comingSoonRoutePath), 'Rute /coming-soon/+page.svelte tersedia');

	const errorRoutePath = path.join(srcDir, 'routes', '+error.svelte');
	const errorRouteContent = fs.readFileSync(errorRoutePath, 'utf-8');
	assert(errorRouteContent.includes('ComingSoon'), 'Rute +error.svelte merender ComingSoon pada status 404');

	// -------------------------------------------------------------------------
	// 2. Uji AC-01.10: Dynamic Feature Flag Gating untuk Kartu Dashboard
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Feature Flag Gating pada Kartu Dashboard (AC-01.10)');
	assert(CARD_FEATURE_FLAG_MAP.petty_cash === 'petty_cash', 'Kartu petty_cash dipetakan ke feature flag petty_cash');
	assert(CARD_FEATURE_FLAG_MAP.sm_petty_cash === 'petty_cash', 'Kartu sm_petty_cash dipetakan ke feature flag petty_cash');
	assert(CARD_FEATURE_FLAG_MAP.payment_reconciliation === 'midtrans_reconciliation', 'Kartu payment_reconciliation dipetakan ke flag midtrans_reconciliation');
	assert(CARD_FEATURE_FLAG_MAP.true_up_pending === 'procurement', 'Kartu true_up_pending dipetakan ke flag procurement');

	// Matikan feature flag petty_cash
	const defaultFlags = getDefaultFeatureFlags();
	const flagsWithoutPettyCash = { ...defaultFlags, petty_cash: false };
	assert(
		canRoleAccessCard('owner', 'petty_cash', flagsWithoutPettyCash) === false,
		'Owner DILARANG melihat kartu petty_cash saat flag petty_cash = false'
	);
	assert(
		canRoleAccessCard('finance', 'petty_cash', flagsWithoutPettyCash) === false,
		'Finance DILARANG melihat kartu petty_cash saat flag petty_cash = false'
	);
	assert(
		canRoleAccessCard('store_manager', 'sm_petty_cash', flagsWithoutPettyCash) === false,
		'Store Manager DILARANG melihat kartu sm_petty_cash saat flag petty_cash = false'
	);

	// Nyalakan feature flag petty_cash
	const flagsWithPettyCash = { ...defaultFlags, petty_cash: true };
	assert(
		canRoleAccessCard('owner', 'petty_cash', flagsWithPettyCash) === true,
		'Owner DIIZINKAN melihat kartu petty_cash saat flag petty_cash = true'
	);
	assert(
		canRoleAccessCard('finance', 'petty_cash', flagsWithPettyCash) === true,
		'Finance DIIZINKAN melihat kartu petty_cash saat flag petty_cash = true'
	);
	assert(
		canRoleAccessCard('store_manager', 'sm_petty_cash', flagsWithPettyCash) === true,
		'Store Manager DIIZINKAN melihat kartu sm_petty_cash saat flag petty_cash = true'
	);

	// Matikan feature flag midtrans_reconciliation & procurement
	const flagsWithoutMidtrans = { ...defaultFlags, midtrans_reconciliation: false };
	assert(
		canRoleAccessCard('finance', 'payment_reconciliation', flagsWithoutMidtrans) === false,
		'Finance DILARANG melihat kartu payment_reconciliation saat midtrans_reconciliation = false'
	);

	const flagsWithoutProcurement = { ...defaultFlags, procurement: false };
	assert(
		canRoleAccessCard('finance', 'true_up_pending', flagsWithoutProcurement) === false,
		'Finance DILARANG melihat kartu true_up_pending saat procurement = false'
	);

	// -------------------------------------------------------------------------
	// 3. Uji AC-01.3: Paritas Angka Kartu vs Halaman Telusur
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Paritas Angka Kartu vs Halaman Telusur (AC-01.3)');
	const resSen = await dashboardService.getCard<SalesSummaryCardData>('sales_summary', { outlet_id: 'out-jkt-01' });
	assert(resSen.data.omzet === '4820000.00', 'Omzet kartu Senopati sama dengan Rp 4.820.000');
	assert(resSen.data.cup_count === 238, 'Jumlah cup kartu Senopati sama dengan 238');
	assert(resSen.data.transaction_count === 124, 'Jumlah transaksi kartu Senopati sama dengan 124');

	const resJodi = await dashboardService.getCard<SalesSummaryCardData>('sales_summary', {
		organization_id: 'org-jodi',
		outlet_id: '*'
	});
	assert(resJodi.data.omzet === '8450000.00', 'Omzet konsolidasi Seduhan Kopi Jodi sama dengan Rp 8.450.000');
	assert(resJodi.data.cup_count === 412, 'Jumlah cup konsolidasi Jodi sama dengan 412');
	assert(resJodi.data.transaction_count === 220, 'Jumlah transaksi konsolidasi Jodi sama dengan 220');

	const resGlobal = await dashboardService.getCard<SalesSummaryCardData>('sales_summary', {
		organization_id: '*',
		outlet_id: '*'
	});
	assert(resGlobal.data.omzet === '14500000.00', 'Omzet konsolidasi global seluruh gerai sama dengan Rp 14.500.000');
	assert(resGlobal.data.cup_count === 672, 'Jumlah cup konsolidasi global sama dengan 672');
	assert(resGlobal.data.transaction_count === 360, 'Jumlah transaksi konsolidasi global sama dengan 360');

	// -------------------------------------------------------------------------
	// 4. Uji AC-01.4: Integritas Lencana Menu vs Item Menunggu Tindakan
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Integritas Lencana Menu vs Item Tindakan (AC-01.4)');
	const ownerBadges = await navService.getBadges('owner');
	assert(ownerBadges['approvals.pending_for_me'] === 3, 'Lencana persetujuan Owner = 3 (sama dengan daftar pending)');
	assert(ownerBadges['inventory.below_min'] === 4, 'Lencana stok kritis Owner = 4');
	assert(ownerBadges['procurement.invoices_waiting'] === 3, 'Lencana nota supplier Owner = 3');
	assert(ownerBadges['petty_cash.pending_verification'] === 2, 'Lencana kas kecil Owner = 2');
	assert(ownerBadges['finance.true_up_pending'] === 3, 'Lencana true-up Owner = 3');
	assert(ownerBadges['catalog.proposals_pending'] === 2, 'Lencana usulan menu Owner = 2');

	const smBadges = await navService.getBadges('store_manager');
	assert(smBadges['approvals.pending_for_me'] === 1, 'Lencana persetujuan SM = 1');
	assert(smBadges['inventory.below_min'] === 2, 'Lencana stok kritis SM = 2 (terkunci gerai sendiri)');
	assert(smBadges['procurement.invoices_waiting'] === 1, 'Lencana nota supplier SM = 1');
	assert(smBadges['petty_cash.pending_verification'] === 1, 'Lencana kas kecil SM = 1');
	assert(smBadges['catalog.proposals_pending'] === 1, 'Lencana usulan menu SM = 1');

	// -------------------------------------------------------------------------
	// 5. Uji T-01.12 & AC-01.9: Skrip Pemeriksa Konsistensi Demo
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Verifikasi Skrip Pemeriksa Konsistensi Demo (T-01.12 & AC-01.9)');
	const scriptPath = path.join(rootDir, 'scripts', 'check-demo-consistency.ts');
	assert(fs.existsSync(scriptPath), 'Skrip scripts/check-demo-consistency.ts tersedia');

	const packageJsonPath = path.join(rootDir, 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	assert(packageJson.scripts['check:demo'] !== undefined, 'package.json memiliki script "check:demo"');

	const currentBusinessDate = clock.businessDate();
	assert(currentBusinessDate === '2026-10-13', 'clock.businessDate() deterministik menghasilkan 2026-10-13');

	const currentNowIso = clock.nowIso();
	assert(currentNowIso === '2026-10-13T14:00:00.000Z', 'clock.nowIso() deterministik menghasilkan jam 21:00 WIB (14:00 UTC)');

	// Verifikasi grafik jam ramai tidak melampaui jam sistem saat ini
	const maxTrafficHour = resSen.data.hourly_traffic.reduce((max, h) => {
		const hourInt = parseInt(h.hour.split(':')[0], 10);
		return hourInt > max ? hourInt : max;
	}, 0);
	assert(maxTrafficHour <= 21, `Jam trafik tertinggi (${maxTrafficHour}:00) tidak melampaui jam sistem (21:00 WIB)`);

	console.log('\n==================================================');
	console.log(`📊 Hasil Pengujian MS-01D: ${passed} PASS, ${failed} FAIL`);
	console.log('==================================================\n');

	if (failed > 0) {
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error('Fatal error in ms01d.test.ts:', err);
	process.exit(1);
});
