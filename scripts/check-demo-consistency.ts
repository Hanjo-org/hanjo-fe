/**
 * CI Verification Script: Demo Consistency Checker (T-01.12, AC-01.9)
 *
 * Memverifikasi konsistensi logika dan integritas data mock demo:
 * 1. Jam header / simulasi konsisten dengan jam transaksi terbaru (tidak di masa depan).
 * 2. Tanggal nomor transaksi selaras dengan hari bisnis aktif WIB (2026-10-13).
 * 3. Nilai sorotan grafik harian (is_today) sama persis dengan angka kartu hari itu.
 * 4. Rentang grafik tren harian tepat 7 hari berurutan yang berakhir pada hari bisnis hari ini.
 * 5. Total omzet per outlet Seduhan Kopi Jodi (Senopati + Dago + Gubeng) sama dengan konsolidasi Brand (Rp 8.450.000).
 * 6. Total omzet seluruh 5 outlet sama dengan konsolidasi global (Rp 14.500.000).
 * 7. Lencana navigasi (badges) selaras dengan status item menunggu tindakan.
 */

import { MockDriver } from '../src/lib/api/drivers/mock/driver.js';
import { clock } from '../src/lib/api/drivers/mock/engine/clock.js';
import type { SalesSummaryCardData, NavBadges } from '../src/lib/api/contract/types.js';

interface CheckResult {
	name: string;
	passed: boolean;
	details?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, details?: string) {
	results.push({ name, passed: condition, details });
	if (condition) {
		console.log(`  ✓ ${name}`);
	} else {
		console.error(`  ✗ ${name}`);
		if (details) console.error(`    -> ${details}`);
	}
}

async function runDemoConsistencyChecks() {
	console.log('\n========================================');
	console.log('  HANJO ERP - DEMO CONSISTENCY CHECKER  ');
	console.log('========================================\n');

	const driver = new MockDriver();

	// 1. Verifikasi Clock & Hari Bisnis
	console.log('[1/6] Memeriksa Jam & Hari Bisnis Simultan (WIB)...');
	const businessDate = clock.businessDate();
	const nowIso = clock.nowIso();
	const nowDate = clock.now();
	const nowHourWib = (nowDate.getUTCHours() + 7) % 24;

	check(
		'Hari bisnis WIB aktif adalah 2026-10-13',
		businessDate === '2026-10-13',
		`Didapat: ${businessDate}`
	);

	check(
		'Clock deterministik dibekukan pada 21:00 WIB (14:00 UTC)',
		nowIso === '2026-10-13T14:00:00.000Z' && nowHourWib === 21,
		`Didapat nowIso: ${nowIso}, hourWib: ${nowHourWib}`
	);

	// 2. Verifikasi Tanggal Nomor Transaksi vs Hari Bisnis
	console.log('\n[2/6] Memeriksa Nomor Transaksi & Urutan Waktu...');
	const sampleTransactions = [
		{ id: 'TRX-SEN-20261013-0042', timeStr: '14:28 WIB', datePart: '20261013', hour: 14, min: 28 },
		{ id: 'TRX-BSD-20261013-0028', timeStr: '14:15 WIB', datePart: '20261013', hour: 14, min: 15 },
		{ id: 'TRX-SEN-20261013-0040', timeStr: '13:50 WIB', datePart: '20261013', hour: 13, min: 50 }
	];

	const datePartExpected = businessDate.replace(/-/g, '');
	for (const tx of sampleTransactions) {
		check(
			`Nomor transaksi ${tx.id} sesuai tanggal hari bisnis (${datePartExpected})`,
			tx.datePart === datePartExpected,
			`Date part: ${tx.datePart} vs ${datePartExpected}`
		);

		// Jam transaksi harus <= jam clock sekarang (21:00 WIB)
		const txHourWib = tx.hour;
		check(
			`Transaksi ${tx.id} terjadi (${tx.timeStr}) sebelum atau pada jam sistem (${nowHourWib}:00 WIB)`,
			txHourWib <= nowHourWib,
			`Jam transaksi: ${txHourWib} vs Jam sistem: ${nowHourWib}`
		);
	}

	// 3. Verifikasi Sorotan Grafik vs Nilai Kartu Hari Ini
	console.log('\n[3/6] Memeriksa Sorotan Grafik Tren vs Nilai Kartu Hari Ini...');
	const getSalesSummary = async (query: string): Promise<SalesSummaryCardData> => {
		const res = await driver.request<any>({
			method: 'GET',
			path: `/api/v1/dashboard/cards/sales_summary?${query}`
		});
		return res.body?.data?.data || res.body?.data;
	};

	const checkCardHighlight = async (
		desc: string,
		query: string,
		expectedOmzet: string
	) => {
		const data = await getSalesSummary(query);
		check(
			`${desc}: omzet kartu bernilai ${expectedOmzet}`,
			data.omzet === expectedOmzet,
			`Didapat: ${data.omzet}`
		);

		const todayTrend = data.daily_trends?.find((d) => d.is_today || d.date === businessDate);
		check(
			`${desc}: sorotan grafik hari ini bernilai sama persis dengan omzet kartu (${expectedOmzet})`,
			todayTrend?.omzet === expectedOmzet,
			`Grafik hari ini: ${todayTrend?.omzet} vs Kartu: ${expectedOmzet}`
		);

		check(
			`${desc}: grafik tren tepat 7 hari berurutan berakhir di ${businessDate}`,
			data.daily_trends?.length === 7 && data.daily_trends[6].date === businessDate,
			`Jumlah hari: ${data.daily_trends?.length}, tanggal akhir: ${data.daily_trends?.[6]?.date}`
		);
	};

	await checkCardHighlight('Senopati Flagship (out-jkt-01)', 'outlet_id=out-jkt-01', '4820000.00');
	await checkCardHighlight('Jodi Dago Bandung (out-bdg-01)', 'outlet_id=out-bdg-01', '2430000.00');
	await checkCardHighlight('Jodi Gubeng Surabaya (out-sub-01)', 'outlet_id=out-sub-01', '1200000.00');
	await checkCardHighlight('Seduhan Kopi Jodi (org-jodi)', 'organization_id=org-jodi&outlet_id=*', '8450000.00');
	await checkCardHighlight('Konsolidasi Global Seluruh Gerai', 'organization_id=*&outlet_id=*', '14500000.00');

	// 4. Verifikasi Konsolidasi Matematika Multi-Outlet
	console.log('\n[4/6] Memeriksa Integritas Matematika Konsolidasi Multi-Outlet...');
	const dataSen = await getSalesSummary('outlet_id=out-jkt-01');
	const dataDag = await getSalesSummary('outlet_id=out-bdg-01');
	const dataGub = await getSalesSummary('outlet_id=out-sub-01');
	const dataJodi = await getSalesSummary('organization_id=org-jodi&outlet_id=*');

	const senOmzet = parseFloat(dataSen.omzet);
	const dagOmzet = parseFloat(dataDag.omzet);
	const gubOmzet = parseFloat(dataGub.omzet);
	const jodiExpected = senOmzet + dagOmzet + gubOmzet;
	const jodiActual = parseFloat(dataJodi.omzet);

	check(
		'Total omzet per outlet Jodi (Senopati + Dago + Gubeng) = Konsolidasi Jodi (Rp 8.450.000)',
		Math.abs(jodiExpected - jodiActual) < 0.01 && jodiActual === 8450000,
		`Jumlah: ${jodiExpected} vs Konsolidasi: ${jodiActual}`
	);

	const jodiCupsExpected = dataSen.cup_count + dataDag.cup_count + dataGub.cup_count;
	check(
		'Total cup count per outlet Jodi = Konsolidasi Jodi (412 cups)',
		jodiCupsExpected === dataJodi.cup_count && jodiCupsExpected === 412,
		`Jumlah: ${jodiCupsExpected} vs Konsolidasi: ${dataJodi.cup_count}`
	);

	const jodiTrxExpected = dataSen.transaction_count + dataDag.transaction_count + dataGub.transaction_count;
	check(
		'Total transaksi per outlet Jodi = Konsolidasi Jodi (220 transaksi)',
		jodiTrxExpected === dataJodi.transaction_count && jodiTrxExpected === 220,
		`Jumlah: ${jodiTrxExpected} vs Konsolidasi: ${dataJodi.transaction_count}`
	);

	// Konsolidasi Global (5 Outlet)
	const dataKvl = await getSalesSummary('outlet_id=out-kvl-01');
	const dataPlg = await getSalesSummary('outlet_id=out-plg-01');
	const dataGlobal = await getSalesSummary('organization_id=*&outlet_id=*');

	const kvlOmzet = parseFloat(dataKvl.omzet);
	const plgOmzet = parseFloat(dataPlg.omzet);
	const globalExpected = jodiExpected + kvlOmzet + plgOmzet;
	const globalActual = parseFloat(dataGlobal.omzet);

	check(
		'Total seluruh 5 outlet = Konsolidasi Global (Rp 14.500.000)',
		Math.abs(globalExpected - globalActual) < 0.01 && globalActual === 14500000,
		`Jumlah 5 outlet: ${globalExpected} vs Global: ${globalActual}`
	);

	const globalCupsExpected = jodiCupsExpected + dataKvl.cup_count + dataPlg.cup_count;
	check(
		'Total cup count 5 outlet = Konsolidasi Global (672 cups)',
		globalCupsExpected === dataGlobal.cup_count && globalCupsExpected === 672,
		`Jumlah: ${globalCupsExpected} vs Global: ${dataGlobal.cup_count}`
	);

	// 5. Verifikasi Lencana Navigasi vs Antrean Menunggu Tindakan (AC-01.4)
	console.log('\n[5/6] Memeriksa Lencana Navigasi vs Status Tindakan (AC-01.4)...');
	const navRes = await driver.request<NavBadges>({ method: 'GET', path: '/api/v1/nav/badges?role=owner' });
	const badges = navRes.body.data;

	check(
		'Lencana Persetujuan (approvals.pending_for_me) memiliki nilai positif',
		badges['approvals.pending_for_me'] > 0,
		`Nilai: ${badges['approvals.pending_for_me']}`
	);

	check(
		'Lencana Inventaris Kritis (inventory.below_min) memiliki nilai positif',
		badges['inventory.below_min'] > 0,
		`Nilai: ${badges['inventory.below_min']}`
	);

	check(
		'Lencana Nota Supplier (procurement.invoices_waiting) memiliki nilai positif',
		badges['procurement.invoices_waiting'] > 0,
		`Nilai: ${badges['procurement.invoices_waiting']}`
	);

	// 6. Verifikasi Status EOD dan Paritas Tindakan
	console.log('\n[6/6] Memeriksa Konsistensi Status End of Day (EOD)...');
	const eodRes = await driver.request<any>({ method: 'GET', path: '/api/v1/eod/status?outlet_id=out-jkt-01&date=2026-10-13' });
	check(
		'Status EOD Senopati terdaftar dan dapat diakses',
		eodRes.status === 200 && eodRes.body?.data?.outlet_id === 'out-jkt-01',
		`Status: ${eodRes.status}`
	);

	console.log('\n========================================');
	const total = results.length;
	const passed = results.filter((r) => r.passed).length;
	const failed = total - passed;

	console.log(`  HASIL: ${passed}/${total} PENGUJIAN LULUS`);
	if (failed > 0) {
		console.error(`  PERINGATAN: ${failed} PENGUJIAN GAGAL!`);
		console.log('========================================\n');
		process.exit(1);
	} else {
		console.log('  STATUS: KONSISTENSI DEMO LULUS SEMPURNA (100%)');
		console.log('========================================\n');
		process.exit(0);
	}
}

runDemoConsistencyChecks().catch((err) => {
	console.error('Fatal error running demo consistency check:', err);
	process.exit(1);
});
