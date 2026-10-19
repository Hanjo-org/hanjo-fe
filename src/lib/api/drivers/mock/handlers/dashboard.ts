/**
 * Mock Handler: Proyeksi Kartu Dashboard 4 Peran (T-01.6 - T-01.9, T-01.14)
 * Referensi: PRD 8.1, MILESTONE.md §MS-01, AC-01.1, AC-01.5, AC-01.6, AC-01.12, AC-01.13
 */

import { router } from '../engine/router.js';
import { clock } from '../engine/clock.js';
import { ApiErrors } from '../../../contract/errors.js';
import { DEMO_OUTLETS } from '../../../../auth/scope.js';
import { getOutletEodStatus } from './eod.js';
import type {
	DashboardCardKey,
	DashboardCardResponse,
	ActionCenterCardData,
	SalesSummaryCardData,
	GrossProfitCardData,
	OutletComparisonCardData,
	StockIssuesCardData,
	HqPayablesCardData,
	PettyCashCardData,
	OutletOpsStatusCardData,
	OutletEodStatusCardData,
	PaymentReconciliationCardData,
	TrueUpPendingCardData,
	SmStockMinCardData,
	SmCountScheduleCardData,
	SmPettyCashCardData,
	SmProposalsCardData,
	SmEodStatusCardData,
	ActionCenterItem
} from '../../../contract/types.js';

export function registerDashboardHandlers(): void {
	// GET /api/v1/dashboard/cards/:key
	router.register('GET', '/api/v1/dashboard/cards/:key', async (ctx) => {
		const key = ctx.params.key as DashboardCardKey;
		const role = (ctx.req.query?.role as string) || 'owner';
		const outletId = (ctx.req.query?.outlet_id as string) || '*';
		const ownerType = (ctx.req.query?.owner_type as string) || 'all';
		const date = (ctx.req.query?.date as string) || clock.businessDate();

		// Pembatasan Cakupan Outlet (RBAC & Scope §7):
		// Store Manager tidak boleh mengakses kartu perbandingan outlet atau data lintas outlet
		if (role === 'store_manager') {
			if (key === 'outlet_comparison' || key === 'petty_cash' || key === 'payment_reconciliation' || key === 'true_up_pending') {
				throw ApiErrors.forbidden(`Kartu ${key} tidak diizinkan untuk peran Store Manager`);
			}
		}

		// Hitung data proyeksi per kartu
		let cardData: unknown;

		switch (key) {
			case 'action_center': {
				cardData = generateActionCenterData(role, outletId, date);
				break;
			}

			case 'sales_summary': {
				cardData = generateSalesSummaryData(outletId);
				break;
			}

			case 'gross_profit': {
				cardData = generateGrossProfitData(outletId);
				break;
			}

			case 'outlet_comparison': {
				if (role === 'store_manager') {
					throw ApiErrors.forbidden('Akses ditolak');
				}
				cardData = generateOutletComparisonData(role, ownerType);
				break;
			}

			case 'stock_issues': {
				cardData = generateStockIssuesData(role, outletId);
				break;
			}

			case 'hq_payables': {
				cardData = generateHqPayablesData(role);
				break;
			}

			case 'petty_cash': {
				cardData = generatePettyCashData();
				break;
			}

			case 'outlet_ops_status': {
				cardData = generateOutletOpsStatusData();
				break;
			}

			case 'outlet_eod_status': {
				cardData = generateOutletEodStatusData(date);
				break;
			}

			case 'payment_reconciliation': {
				cardData = generatePaymentReconciliationData();
				break;
			}

			case 'true_up_pending': {
				cardData = generateTrueUpPendingData();
				break;
			}

			case 'sm_stock_min': {
				cardData = generateSmStockMinData(outletId);
				break;
			}

			case 'sm_count_schedule': {
				cardData = generateSmCountScheduleData(outletId);
				break;
			}

			case 'sm_petty_cash': {
				cardData = generateSmPettyCashData(outletId);
				break;
			}

			case 'sm_proposals': {
				cardData = generateSmProposalsData(outletId);
				break;
			}

			case 'sm_eod_status': {
				cardData = generateSmEodStatusData(outletId, date);
				break;
			}

			default:
				throw ApiErrors.notFound(`Kartu dashboard ${key} tidak ditemukan`);
		}

		const response: DashboardCardResponse = {
			card_key: key,
			updated_at: clock.nowIso(),
			data: cardData
		};

		return { data: response };
	});
}

// ---------------------------------------------------------------------------
// Generator Data Proyeksi Deterministik per Kartu
// ---------------------------------------------------------------------------

function generateActionCenterData(role: string, outletId: string, date: string): ActionCenterCardData {
	let items: ActionCenterItem[] = [];

	if (role === 'owner') {
		items = [
			{
				id: 'act-own-1',
				type: 'APPROVAL',
				title: 'Persetujuan Kas Kecil Melebihi Batas Bebas',
				desc: 'Penggantian Seal Karet Steam Wand Senopati (Rp 350.000) butuh otorisasi Owner.',
				actionUrl: '/approvals',
				actionLabel: 'Tinjau Persetujuan',
				badge: 'Persetujuan Tertunda',
				badgeColor: 'warning'
			},
			{
				id: 'act-own-2',
				type: 'PERIOD_REOPEN',
				title: 'Permintaan Buka Ulang Periode Fiskal',
				desc: 'Tim Finance mengajukan pembukaan audit fiskal bulan September untuk penyesuaian True-Up.',
				actionUrl: '/approvals',
				actionLabel: 'Tinjau Permintaan',
				badge: 'Izin Sensitif',
				badgeColor: 'danger'
			},
			{
				id: 'act-own-3',
				type: 'PROCUREMENT_OVER_LIMIT',
				title: 'Pembelian Darurat Luar Jaringan',
				desc: 'Outlet Senopati memesan Cup 16oz ke CV Kemasan Nusantara karena lonjakan akhir pekan.',
				actionUrl: '/approvals',
				actionLabel: 'Setujui PO',
				badge: 'Persetujuan Tertunda',
				badgeColor: 'warning'
			}
		];
	} else if (role === 'hq_admin') {
		items = [
			{
				id: 'act-adm-1',
				type: 'MENU_PROPOSAL',
				title: 'Usulan Menu Lokal Menunggu Kurasi',
				desc: 'Store Manager Senopati mengajukan varian Avocado Cold Brew untuk menu seasonal.',
				actionUrl: '/catalog#proposals',
				actionLabel: 'Kurasi Resep',
				badge: 'Usulan Baru',
				badgeColor: 'info'
			},
			{
				id: 'act-adm-2',
				type: 'STOCK_COUNT_VARIANCE',
				title: 'Koreksi Stok Opname Melebihi Toleransi',
				desc: 'Selisih opname Syrup Caramel di Cabang Dago (-1.2 L) membutuhkan verifikasi admin pusat.',
				actionUrl: '/inventory',
				actionLabel: 'Verifikasi Selisih',
				badge: 'Opname Audit',
				badgeColor: 'warning'
			},
			{
				id: 'act-adm-3',
				type: 'POS_SYNC_DELAY',
				title: 'Sinkronisasi POS Outlet Terlambat',
				desc: 'Cabang Gubeng belum mengirim heartbeat struk selama lebih dari 15 menit.',
				actionUrl: '/reports',
				actionLabel: 'Periksa Koneksi',
				badge: 'Perhatian Sinkron',
				badgeColor: 'warning'
			}
		];
	} else if (role === 'finance') {
		items = [
			{
				id: 'act-fin-1',
				type: 'INVOICE_TRUE_UP',
				title: '3 Nota Supplier Menunggu Verifikasi & True-Up',
				desc: 'Penerimaan Fresh Milk & Green Beans siap disesuaikan HPP-nya dengan faktur resmi.',
				actionUrl: '/procurement#invoices',
				actionLabel: 'Verifikasi & True-Up',
				badge: 'Menunggu True-Up',
				badgeColor: 'danger'
			},
			{
				id: 'act-fin-2',
				type: 'PETTY_CASH_EXPENSE',
				title: 'Pengeluaran Kas Kecil Menunggu Verifikasi',
				desc: 'Bukti nota beli sabun & kertas thermal Senopati (Rp 85.000) siap diverifikasi.',
				actionUrl: '/petty-cash',
				actionLabel: 'Verifikasi Bukti',
				badge: 'Kas Kecil',
				badgeColor: 'warning'
			},
			{
				id: 'act-fin-3',
				type: 'BILL_DUE_SOON',
				title: 'Tagihan Jatuh Tempo Dalam 5 Hari',
				desc: 'Faktur CV Kemasan Nusantara (Rp 1.250.000) jatuh tempo pada 18 Oktober 2026.',
				actionUrl: '/payables',
				actionLabel: 'Proses Pembayaran',
				badge: 'Jatuh Tempo',
				badgeColor: 'warning'
			},
			{
				id: 'act-fin-4',
				type: 'FISCAL_PERIOD_READY',
				title: 'Periode Fiskal Siap Ditutup',
				desc: 'Seluruh jurnal penerimaan dan penjualan September telah direkonsiliasi 100%.',
				actionUrl: '/finance',
				actionLabel: 'Review Laporan',
				badge: 'Tutup Buku',
				badgeColor: 'info'
			}
		];
	} else {
		// store_manager
		const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';
		const eodRecord = getOutletEodStatus(activeOutlet, date);

		items = [
			{
				id: 'act-sm-1',
				type: 'PR_DRAFT',
				title: 'Draft Permintaan Barang Belum Dikirim',
				desc: 'Pengadaan mingguan biji kopi House Blend belum di-submit ke tim logistik pusat.',
				actionUrl: '/procurement',
				actionLabel: 'Kirim ke Pusat',
				badge: 'Draft PO',
				badgeColor: 'warning'
			},
			{
				id: 'act-sm-2',
				type: 'RECEIPT_AWAITING_INVOICE',
				title: 'Penerimaan Menunggu Foto Nota Supplier',
				desc: 'Barang tiba Fresh Milk 80L (RCV-JKT-01) membutuhkan upload foto nota asli.',
				actionUrl: '/procurement#receipts',
				actionLabel: 'Unggah Nota',
				badge: 'Butuh Tindakan',
				badgeColor: 'danger'
			},
			{
				id: 'act-sm-3',
				type: 'STOCK_COUNT_SCHEDULED',
				title: 'Jadwal Opname Harian Bahan Kritis',
				desc: 'Hitung sisa fisik Susu Fresh Milk dan Biji Kopi sebelum shift malam berakhir.',
				actionUrl: '/inventory',
				actionLabel: 'Mulai Hitung',
				badge: 'Opname Terjadwal',
				badgeColor: 'info'
			}
		];

		// Item EOD khusus Store Manager jika belum selesai (AC-01.12 & T-01.14)
		if (!eodRecord?.is_completed) {
			items.push({
				id: 'act-sm-eod',
				type: 'EOD_PENDING',
				title: 'Tutup Hari Operasional Belum Selesai',
				desc: 'Hitung kas laci, pastikan transaksi POS sinkron, dan catat waste harian sebelum toko tutup.',
				actionUrl: '#eod-status-card',
				actionLabel: 'Selesaikan Tutup Hari',
				badge: 'Tutup Hari',
				badgeColor: 'danger'
			});
		}
	}

	return {
		items,
		total_pending: items.length
	};
}

function generateSalesSummaryData(outletId: string): SalesSummaryCardData {
	// Jika spesifik per outlet
	if (outletId === 'out-jkt-01') {
		return {
			omzet: '4820000.00',
			cup_count: 238,
			transaction_count: 124,
			yesterday_transaction_count: 118,
			avg_transaction_value: '38870.00',
			cash_amount: '1253200.00',
			cash_percentage: '26.00',
			non_cash_amount: '3566800.00',
			non_cash_percentage: '74.00',
			void_refund_count: 1,
			void_refund_amount: '38500.00',
			trend_vs_previous_pct: '+19.2',
			yesterday_omzet: '4650000.00',
			yesterday_cup_count: 230,
			is_busier_than_yesterday: true,
			busier_label: 'Lebih Ramai (+19.2% vs Kemarin)',
			hourly_traffic: [
				{ hour: '08:00', count: 18, omzet: '360000.00', yesterday_count: 14, yesterday_omzet: '280000.00' },
				{ hour: '09:00', count: 24, omzet: '480000.00', yesterday_count: 20, yesterday_omzet: '400000.00' },
				{ hour: '10:00', count: 22, omzet: '440000.00', yesterday_count: 20, yesterday_omzet: '400000.00' },
				{ hour: '11:00', count: 30, omzet: '600000.00', yesterday_count: 26, yesterday_omzet: '520000.00' },
				{ hour: '12:00', count: 48, omzet: '960000.00', yesterday_count: 42, yesterday_omzet: '840000.00' },
				{ hour: '13:00', count: 42, omzet: '840000.00', yesterday_count: 38, yesterday_omzet: '760000.00' },
				{ hour: '14:00', count: 32, omzet: '640000.00', yesterday_count: 28, yesterday_omzet: '560000.00' },
				{ hour: '15:00', count: 22, omzet: '500000.00', yesterday_count: 18, yesterday_omzet: '420000.00' }
			],
			daily_trends: [
				{ date: '2026-10-07', omzet: '4100000.00', cup_count: 205 },
				{ date: '2026-10-08', omzet: '4250000.00', cup_count: 212 },
				{ date: '2026-10-09', omzet: '4400000.00', cup_count: 220 },
				{ date: '2026-10-10', omzet: '4950000.00', cup_count: 245 },
				{ date: '2026-10-11', omzet: '5100000.00', cup_count: 252 },
				{ date: '2026-10-12', omzet: '4650000.00', cup_count: 230 },
				{ date: '2026-10-13', omzet: '4820000.00', cup_count: 238, is_today: true }
			]
		};
	}

	if (outletId === 'out-bdg-01') {
		return {
			omzet: '2430000.00',
			cup_count: 122,
			transaction_count: 64,
			yesterday_transaction_count: 58,
			avg_transaction_value: '37960.00',
			cash_amount: '631800.00',
			cash_percentage: '26.00',
			non_cash_amount: '1798200.00',
			non_cash_percentage: '74.00',
			void_refund_count: 0,
			void_refund_amount: '0.00',
			trend_vs_previous_pct: '+15.8',
			hourly_traffic: [
				{ hour: '08:00', count: 10, omzet: '190000.00' },
				{ hour: '10:00', count: 15, omzet: '300000.00' },
				{ hour: '12:00', count: 28, omzet: '560000.00' },
				{ hour: '14:00', count: 20, omzet: '400000.00' }
			],
			daily_trends: [
				{ date: '2026-10-07', omzet: '2100000.00', cup_count: 105 },
				{ date: '2026-10-08', omzet: '2200000.00', cup_count: 110 },
				{ date: '2026-10-09', omzet: '2350000.00', cup_count: 118 },
				{ date: '2026-10-10', omzet: '2600000.00', cup_count: 130 },
				{ date: '2026-10-11', omzet: '2700000.00', cup_count: 135 },
				{ date: '2026-10-12', omzet: '2300000.00', cup_count: 115 },
				{ date: '2026-10-13', omzet: '2430000.00', cup_count: 122, is_today: true }
			]
		};
	}

	if (outletId === 'out-sub-01') {
		return {
			omzet: '1200000.00',
			cup_count: 52,
			transaction_count: 32,
			yesterday_transaction_count: 30,
			avg_transaction_value: '38460.00',
			cash_amount: '312000.00',
			cash_percentage: '26.00',
			non_cash_amount: '888000.00',
			non_cash_percentage: '74.00',
			void_refund_count: 0,
			void_refund_amount: '0.00',
			trend_vs_previous_pct: '+12.1',
			hourly_traffic: [
				{ hour: '08:00', count: 6, omzet: '120000.00' },
				{ hour: '12:00', count: 18, omzet: '420000.00' },
				{ hour: '14:00', count: 12, omzet: '280000.00' }
			],
			daily_trends: [
				{ date: '2026-10-07', omzet: '1050000.00', cup_count: 45 },
				{ date: '2026-10-08', omzet: '1100000.00', cup_count: 48 },
				{ date: '2026-10-09', omzet: '1150000.00', cup_count: 50 },
				{ date: '2026-10-10', omzet: '1350000.00', cup_count: 58 },
				{ date: '2026-10-11', omzet: '1400000.00', cup_count: 60 },
				{ date: '2026-10-12', omzet: '1150000.00', cup_count: 50 },
				{ date: '2026-10-13', omzet: '1200000.00', cup_count: 52, is_today: true }
			]
		};
	}

	// Konsolidasi Seluruh Outlet (Total: Rp 8.450.000, 412 cups, 220 transactions)
	return {
		omzet: '8450000.00',
		cup_count: 412,
		transaction_count: 220,
		yesterday_transaction_count: 206,
		avg_transaction_value: '38400.00',
		cash_amount: '2197000.00',
		cash_percentage: '26.00',
		non_cash_amount: '6253000.00',
		non_cash_percentage: '74.00',
		void_refund_count: 1,
		void_refund_amount: '38500.00',
		trend_vs_previous_pct: '+18.4',
		yesterday_omzet: '8100000.00',
		yesterday_cup_count: 395,
		is_busier_than_yesterday: true,
		busier_label: 'Lebih Ramai (+18.4% vs Kemarin)',
		hourly_traffic: [
			{ hour: '08:00', count: 34, omzet: '670000.00', yesterday_count: 28, yesterday_omzet: '560000.00' },
			{ hour: '09:00', count: 42, omzet: '840000.00', yesterday_count: 35, yesterday_omzet: '700000.00' },
			{ hour: '10:00', count: 45, omzet: '920000.00', yesterday_count: 40, yesterday_omzet: '810000.00' },
			{ hour: '11:00', count: 58, omzet: '1190000.00', yesterday_count: 52, yesterday_omzet: '1040000.00' },
			{ hour: '12:00', count: 94, omzet: '1940000.00', yesterday_count: 82, yesterday_omzet: '1680000.00' },
			{ hour: '13:00', count: 80, omzet: '1620000.00', yesterday_count: 72, yesterday_omzet: '1460000.00' },
			{ hour: '14:00', count: 64, omzet: '1320000.00', yesterday_count: 56, yesterday_omzet: '1150000.00' },
			{ hour: '15:00', count: 40, omzet: '850000.00', yesterday_count: 30, yesterday_omzet: '700000.00' }
		],
		daily_trends: [
			{ date: '2026-10-07', omzet: '7250000.00', cup_count: 355 },
			{ date: '2026-10-08', omzet: '7550000.00', cup_count: 370 },
			{ date: '2026-10-09', omzet: '7900000.00', cup_count: 388 },
			{ date: '2026-10-10', omzet: '8900000.00', cup_count: 433 },
			{ date: '2026-10-11', omzet: '9200000.00', cup_count: 447 },
			{ date: '2026-10-12', omzet: '8100000.00', cup_count: 395 },
			{ date: '2026-10-13', omzet: '8450000.00', cup_count: 412, is_today: true }
		]
	};
}

function generateGrossProfitData(outletId: string): GrossProfitCardData {
	if (outletId === 'out-jkt-01') {
		return {
			gross_profit: '3325800.00',
			margin_pct: '69.00',
			cogs_amount: '1494200.00',
			is_estimate: true,
			pending_invoice_count: 1,
			estimate_badge: 'Estimasi · 1 nota belum masuk',
			trend_vs_previous_pct: '+2.4'
		};
	}

	return {
		gross_profit: '5762900.00',
		margin_pct: '68.20',
		cogs_amount: '2687100.00',
		is_estimate: true,
		pending_invoice_count: 1,
		estimate_badge: 'Estimasi · 1 nota belum masuk',
		trend_vs_previous_pct: '+2.1'
	};
}

function generateOutletComparisonData(role: string, ownerTypeFilter: string): OutletComparisonCardData {
	const allRows = [
		{
			outlet_id: 'out-jkt-01',
			outlet_name: 'Senopati Flagship',
			owner_type: 'own_company' as const,
			omzet: '4820000.00',
			cups: 238,
			cogs: '1494200.00',
			operational_costs: '285000.00',
			gross_profit: '3040800.00',
			margin_pct: '69.00',
			stock_diff_pct: '0.40',
			waste_pct: '1.20',
			sync_status: 'ONLINE' as const,
			last_sync: '2 menit lalu'
		},
		{
			outlet_id: 'out-bdg-01',
			outlet_name: 'Outlet Dago',
			owner_type: 'own_company' as const,
			omzet: '2430000.00',
			cups: 122,
			cogs: '777600.00',
			operational_costs: '165000.00',
			gross_profit: '1487400.00',
			margin_pct: '68.00',
			stock_diff_pct: '0.60',
			waste_pct: '1.50',
			sync_status: 'ONLINE' as const,
			last_sync: '4 menit lalu'
		},
		{
			outlet_id: 'out-sub-01',
			outlet_name: 'Outlet Gubeng',
			owner_type: 'partner' as const,
			omzet: '1200000.00',
			cups: 52,
			cogs: '408000.00',
			operational_costs: '95000.00',
			gross_profit: '697000.00',
			margin_pct: '65.50',
			stock_diff_pct: '0.80',
			waste_pct: '1.80',
			sync_status: 'ONLINE' as const,
			last_sync: '7 menit lalu'
		}
	];

	const filteredRows = allRows.filter((row) => {
		if (ownerTypeFilter === 'all') return true;
		return row.owner_type === ownerTypeFilter;
	});

	return {
		rows: filteredRows,
		mode: role === 'owner' ? 'full' : 'operational'
	};
}

function generateStockIssuesData(role: string, outletId: string): StockIssuesCardData {
	const allItems = [
		{
			id: 'stk-1',
			item_name: 'Fresh Milk Greenfield',
			outlet_id: 'out-jkt-01',
			outlet_name: 'Outlet Senopati',
			current_qty: '18.2000',
			min_qty: '20.0000',
			unit: 'L',
			est_days_left: '1.5',
			severity: 'danger' as const,
			stock_diff_pct: '-0.40',
			waste_pct: '1.20'
		},
		{
			id: 'stk-2',
			item_name: 'Pure Uji Matcha Powder',
			outlet_id: 'out-jkt-01',
			outlet_name: 'Outlet Senopati',
			current_qty: '120.0000',
			min_qty: '150.0000',
			unit: 'g',
			est_days_left: '2.0',
			severity: 'danger' as const,
			stock_diff_pct: '-0.20',
			waste_pct: '0.80'
		},
		{
			id: 'stk-3',
			item_name: 'House Blend Espresso Beans',
			outlet_id: 'out-bdg-01',
			outlet_name: 'Outlet Dago',
			current_qty: '24.5000',
			min_qty: '10.0000',
			unit: 'kg',
			est_days_left: '5.2',
			severity: 'success' as const,
			stock_diff_pct: '0.00',
			waste_pct: '0.50'
		}
	];

	const filtered = outletId && outletId !== '*'
		? allItems.filter((i) => i.outlet_id === outletId)
		: allItems;

	return {
		items: filtered,
		total_issues: filtered.filter((i) => i.severity === 'danger').length,
		summary_mode: role === 'owner'
	};
}

function generateHqPayablesData(role: string): HqPayablesCardData {
	return {
		total_balance: '14850000.00',
		due_soon_amount: '1250000.00',
		overdue_amount: '0.00',
		aging: {
			not_due: '9500000.00',
			days_1_30: '4100000.00',
			days_31_60: '1250000.00',
			days_61_90: '0.00',
			days_over_90: '0.00'
		},
		summary_mode: role === 'owner'
	};
}

function generatePettyCashData(): PettyCashCardData {
	return {
		total_balance: '4250000.00',
		pending_verification_count: 2,
		pending_verification_amount: '435000.00',
		outlets: [
			{
				outlet_id: 'out-jkt-01',
				outlet_name: 'Outlet Senopati',
				current_balance: '1500000.00',
				daily_spent: '85000.00',
				daily_limit: '300000.00',
				pending_verification_count: 1,
				pending_verification_amount: '85000.00'
			},
			{
				outlet_id: 'out-bdg-01',
				outlet_name: 'Outlet Dago',
				current_balance: '1750000.00',
				daily_spent: '150000.00',
				daily_limit: '300000.00',
				pending_verification_count: 1,
				pending_verification_amount: '350000.00'
			},
			{
				outlet_id: 'out-sub-01',
				outlet_name: 'Outlet Gubeng',
				current_balance: '1000000.00',
				daily_spent: '50000.00',
				daily_limit: '200000.00',
				pending_verification_count: 0,
				pending_verification_amount: '0.00'
			}
		]
	};
}

function generateOutletOpsStatusData(): OutletOpsStatusCardData {
	return {
		online_count: 3,
		total_outlets: 3,
		outlets: [
			{
				outlet_id: 'out-jkt-01',
				outlet_name: 'Outlet Senopati',
				sync_status: 'ONLINE',
				last_sync_time: '14:28 WIB',
				last_sync_mins_ago: 2,
				eod_status: 'pending'
			},
			{
				outlet_id: 'out-bdg-01',
				outlet_name: 'Outlet Dago',
				sync_status: 'ONLINE',
				last_sync_time: '14:26 WIB',
				last_sync_mins_ago: 4,
				eod_status: 'completed'
			},
			{
				outlet_id: 'out-sub-01',
				outlet_name: 'Outlet Gubeng',
				sync_status: 'ONLINE',
				last_sync_time: '14:23 WIB',
				last_sync_mins_ago: 7,
				eod_status: 'pending'
			}
		]
	};
}

function generateOutletEodStatusData(date: string): OutletEodStatusCardData {
	const rows = DEMO_OUTLETS.map((outlet) => {
		const rec = getOutletEodStatus(outlet.id, date);
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
		business_date: date,
		completed_count: rows.filter((r) => r.eod_status === 'completed').length,
		total_count: rows.length,
		outlets: rows
	};
}

function generatePaymentReconciliationData(): PaymentReconciliationCardData {
	return {
		erp_non_cash_total: '6253000.00',
		midtrans_settlement_total: '6253000.00',
		discrepancy_amount: '0.00',
		status: 'matched',
		settlement_date: '2026-10-13',
		unsettled_transactions_count: 0
	};
}

function generateTrueUpPendingData(): TrueUpPendingCardData {
	return {
		pending_invoices_count: 3,
		provisional_total_value: '3450000.00',
		items: [
			{
				id: 'inv-up-1',
				receipt_number: 'RCV-JKT-01-20261012-01',
				supplier_name: 'CV Sumber Pangan',
				outlet_name: 'Outlet Senopati',
				provisional_total: '1800000.00',
				age_days: 2
			},
			{
				id: 'inv-up-2',
				receipt_number: 'RCV-BDG-01-20261013-01',
				supplier_name: 'PT Susu Nusantara',
				outlet_name: 'Outlet Dago',
				provisional_total: '950000.00',
				age_days: 1
			},
			{
				id: 'inv-up-3',
				receipt_number: 'RCV-JKT-01-20261011-02',
				supplier_name: 'CV Biji Makmur',
				outlet_name: 'Outlet Senopati',
				provisional_total: '700000.00',
				age_days: 3
			}
		]
	};
}

function generateSmStockMinData(outletId: string): SmStockMinCardData {
	const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';
	const outletName = DEMO_OUTLETS.find((o) => o.id === activeOutlet)?.name || 'Outlet Senopati';

	return {
		outlet_id: activeOutlet,
		outlet_name: outletName,
		items: [
			{
				item_id: 'itm-001',
				item_name: 'Fresh Milk Greenfield',
				current_stock: '18.2000',
				min_stock: '20.0000',
				unit: 'Liter',
				est_days: '1.5',
				severity: 'danger'
			},
			{
				item_id: 'itm-002',
				item_name: 'Pure Uji Matcha Powder',
				current_stock: '120.0000',
				min_stock: '150.0000',
				unit: 'Gram',
				est_days: '2.0',
				severity: 'danger'
			}
		]
	};
}

function generateSmCountScheduleData(outletId: string): SmCountScheduleCardData {
	const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';

	return {
		outlet_id: activeOutlet,
		next_count_date: '2026-10-15',
		is_overdue: false,
		overdue_days: 0,
		scope: 'critical',
		status_label: 'Tepat Waktu'
	};
}

function generateSmPettyCashData(outletId: string): SmPettyCashCardData {
	const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';

	return {
		outlet_id: activeOutlet,
		current_balance: '1500000.00',
		daily_spent: '85000.00',
		daily_limit: '300000.00',
		spent_pct: '28.30',
		remaining_today: '215000.00'
	};
}

function generateSmProposalsData(outletId: string): SmProposalsCardData {
	const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';

	return {
		outlet_id: activeOutlet,
		items: [
			{
				id: 'prop-001',
				recipe_name: 'Avocado Cold Brew Special',
				status: 'submitted',
				feedback: 'Menunggu review tim HQ Admin',
				updated_at: '2026-10-12T10:00:00Z'
			}
		]
	};
}

function generateSmEodStatusData(outletId: string, date: string): SmEodStatusCardData {
	const activeOutlet = outletId && outletId !== '*' ? outletId : 'out-jkt-01';
	const outletName = DEMO_OUTLETS.find((o) => o.id === activeOutlet)?.name || 'Outlet Senopati';
	const record = getOutletEodStatus(activeOutlet, date);

	const isCompleted = record?.is_completed ?? false;
	const drawerDone = record?.cash_drawer_counted ?? false;
	const salesDone = record?.sales_synced ?? true;
	const wasteDone = record?.waste_recorded ?? false;

	return {
		outlet_id: activeOutlet,
		outlet_name: outletName,
		business_date: date,
		is_completed: isCompleted,
		completed_at: record?.completed_at,
		checklist: [
			{
				key: 'cash_drawer',
				label: 'Hitung Fisik Uang Kas Laci Kasir',
				done: drawerDone,
				details: drawerDone ? 'Kas laci telah dihitung' : 'Wajib dihitung sebelum toko tutup'
			},
			{
				key: 'sales_synced',
				label: 'Seluruh Penjualan POS Hari Ini Tersinkron',
				done: salesDone,
				details: 'Semua struk offline telah terunggah ke pusat'
			},
			{
				key: 'waste_recorded',
				label: 'Catat Pembuangan & Waste Bahan Harian',
				done: wasteDone,
				details: wasteDone ? 'Waste hari ini sudah dicatat' : 'Catat bahan terbuang hari ini'
			}
		],
		can_complete: !isCompleted && drawerDone && salesDone && wasteDone
	};
}
