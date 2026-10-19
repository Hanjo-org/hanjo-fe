/**
 * Mock Handler: Status & Penyelesaian Tutup Hari / End of Day (T-01.14, AC-01.12, AC-01.13)
 * Referensi: MILESTONE.md §MS-01, MS-01.md §T-01.14
 */

import { router } from '../engine/router.js';
import { clock } from '../engine/clock.js';
import { DEMO_OUTLETS } from '../../../../auth/scope.js';
import type {
	OutletEodStatusCardData,
	SmEodStatusCardData,
	CompleteEodRequest
} from '../../../contract/types.js';

interface OutletEodRecord {
	outlet_id: string;
	business_date: string;
	cash_drawer_counted: boolean;
	sales_synced: boolean;
	waste_recorded: boolean;
	is_completed: boolean;
	completed_at?: string;
	completed_by_name?: string;
	notes?: string;
}

// In-memory EOD state untuk demo (deterministik berdasarkan business date)
const eodRecords: Map<string, OutletEodRecord> = new Map();

function getEodKey(outletId: string, date: string): string {
	return `${outletId}_${date}`;
}

export function initDefaultEodRecords(date: string = clock.businessDate()): void {
	// Dago sudah selesai tutup hari
	eodRecords.set(getEodKey('out-bdg-01', date), {
		outlet_id: 'out-bdg-01',
		business_date: date,
		cash_drawer_counted: true,
		sales_synced: true,
		waste_recorded: true,
		is_completed: true,
		completed_at: '2026-10-13T14:10:00.000Z',
		completed_by_name: 'Sari Dewi'
	});

	// Senopati belum selesai (masih proses)
	eodRecords.set(getEodKey('out-jkt-01', date), {
		outlet_id: 'out-jkt-01',
		business_date: date,
		cash_drawer_counted: false,
		sales_synced: true,
		waste_recorded: false,
		is_completed: false
	});

	// Gubeng belum selesai
	eodRecords.set(getEodKey('out-sub-01', date), {
		outlet_id: 'out-sub-01',
		business_date: date,
		cash_drawer_counted: false,
		sales_synced: true,
		waste_recorded: false,
		is_completed: false
	});
}

// Inisialisasi awal
initDefaultEodRecords();

export function registerEodHandlers(): void {
	// GET /api/v1/eod/status?outlet_id=&date=&role=
	router.register('GET', '/api/v1/eod/status', async (ctx) => {
		const date = (ctx.req.query?.date as string) || clock.businessDate();
		const outletId = (ctx.req.query?.outlet_id as string) || 'out-jkt-01';
		const role = (ctx.req.query?.role as string) || 'store_manager';

		// Jika peran SM, kembalikan format checklist SM
		if (role === 'store_manager') {
			let record = eodRecords.get(getEodKey(outletId, date));
			if (!record) {
				record = {
					outlet_id: outletId,
					business_date: date,
					cash_drawer_counted: false,
					sales_synced: true,
					waste_recorded: false,
					is_completed: false
				};
				eodRecords.set(getEodKey(outletId, date), record);
			}

			const outletName = DEMO_OUTLETS.find((o) => o.id === outletId)?.name || 'Outlet Senopati';

			const smData: SmEodStatusCardData = {
				outlet_id: outletId,
				outlet_name: outletName,
				business_date: date,
				is_completed: record.is_completed,
				completed_at: record.completed_at,
				checklist: [
					{
						key: 'cash_drawer',
						label: 'Hitung Fisik Uang Kas Laci Kasir',
						done: record.cash_drawer_counted,
						details: record.cash_drawer_counted
							? 'Kas laci telah dihitung & sesuai struk tunai'
							: 'Wajib dihitung sebelum gerai tutup'
					},
					{
						key: 'sales_synced',
						label: 'Seluruh Penjualan POS Hari Ini Tersinkron',
						done: record.sales_synced,
						details: 'Semua struk offline telah terunggah ke pusat'
					},
					{
						key: 'waste_recorded',
						label: 'Catat Pembuangan & Waste Bahan Harian',
						done: record.waste_recorded,
						details: record.waste_recorded
							? 'Sisa susu dan bahan rusak telah dicatat'
							: 'Catat bahan terbuang hari ini'
					}
				],
				can_complete:
					!record.is_completed &&
					record.cash_drawer_counted &&
					record.sales_synced &&
					record.waste_recorded
			};

			return { data: smData };
		}

		// Jika Owner / HQ Admin / Finance: kembalikan ringkasan konsolidasi per outlet
		const rows = DEMO_OUTLETS.map((outlet) => {
			const rec = eodRecords.get(getEodKey(outlet.id, date));
			return {
				outlet_id: outlet.id,
				outlet_name: outlet.name,
				eod_status: rec?.is_completed ? ('completed' as const) : ('pending' as const),
				cash_drawer_counted: rec?.cash_drawer_counted ?? false,
				sales_synced: rec?.sales_synced ?? true,
				waste_recorded: rec?.waste_recorded ?? false,
				completed_at: rec?.completed_at,
				completed_by_name: rec?.completed_by_name
			};
		});

		const completedCount = rows.filter((r) => r.eod_status === 'completed').length;

		const eodSummary: OutletEodStatusCardData = {
			business_date: date,
			completed_count: completedCount,
			total_count: rows.length,
			outlets: rows
		};

		return { data: eodSummary };
	});

	// POST /api/v1/eod/complete (T-01.14 & AC-01.13)
	router.register('POST', '/api/v1/eod/complete', async (ctx) => {
		const payload = (ctx.req.body as CompleteEodRequest) || {};
		const outletId = payload.outlet_id || 'out-jkt-01';
		const date = payload.business_date || clock.businessDate();

		const key = getEodKey(outletId, date);
		const existing = eodRecords.get(key) || {
			outlet_id: outletId,
			business_date: date,
			cash_drawer_counted: false,
			sales_synced: true,
			waste_recorded: false,
			is_completed: false
		};

		// Perbarui state EOD
		existing.cash_drawer_counted = payload.cash_drawer_counted ?? true;
		existing.waste_recorded = payload.waste_recorded ?? true;
		existing.is_completed = true;
		existing.completed_at = clock.nowIso();
		existing.completed_by_name = 'Budi Santoso';
		existing.notes = payload.notes;

		eodRecords.set(key, existing);

		const outletName = DEMO_OUTLETS.find((o) => o.id === outletId)?.name || 'Outlet Senopati';

		const updatedSmData: SmEodStatusCardData = {
			outlet_id: outletId,
			outlet_name: outletName,
			business_date: date,
			is_completed: true,
			completed_at: existing.completed_at,
			checklist: [
				{
					key: 'cash_drawer',
					label: 'Hitung Fisik Uang Kas Laci Kasir',
					done: true,
					details: 'Kas laci telah dihitung & sesuai struk tunai'
				},
				{
					key: 'sales_synced',
					label: 'Seluruh Penjualan POS Hari Ini Tersinkron',
					done: true,
					details: 'Semua struk offline telah terunggah ke pusat'
				},
				{
					key: 'waste_recorded',
					label: 'Catat Pembuangan & Waste Bahan Harian',
					done: true,
					details: 'Sisa susu dan bahan rusak telah dicatat'
				}
			],
			can_complete: false
		};

		return {
			data: updatedSmData,
			meta: {
				effects: {
					eod_completed: 1,
					outlet_status_updated: 1
				}
			}
		};
	});

	// GET /api/v1/eod/summary
	router.register('GET', '/api/v1/eod/summary', async (ctx) => {
		const date = (ctx.req.query?.date as string) || clock.businessDate();
		const rows = DEMO_OUTLETS.map((outlet) => {
			const rec = eodRecords.get(getEodKey(outlet.id, date));
			return {
				outlet_id: outlet.id,
				outlet_name: outlet.name,
				eod_status: rec?.is_completed ? ('completed' as const) : ('pending' as const),
				cash_drawer_counted: rec?.cash_drawer_counted ?? false,
				sales_synced: rec?.sales_synced ?? true,
				waste_recorded: rec?.waste_recorded ?? false,
				completed_at: rec?.completed_at,
				completed_by_name: rec?.completed_by_name
			};
		});

		return {
			data: {
				business_date: date,
				completed_count: rows.filter((r) => r.eod_status === 'completed').length,
				total_count: rows.length,
				outlets: rows
			}
		};
	});
}

/**
 * Helper untuk mengambil status EOD outlet tertentu (dipakai handler dashboard)
 */
export function getOutletEodStatus(outletId: string, date: string): OutletEodRecord | undefined {
	return eodRecords.get(getEodKey(outletId, date));
}
