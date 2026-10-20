/**
 * Logika Domain Murni: Formula & Proyeksi Dashboard (MILESTONE.md §6.11, §MS-01)
 *
 * Sesuai Golden Rule 2 & Rule 5:
 * - Fungsi murni, bebas I/O, tanpa efek samping.
 * - DILARANG mengimpor dari api/, features/, atau ui/.
 */

import type { UserRole, DashboardCardKey, SmEodChecklistItem } from '../api/contract/types.js';

/**
 * Matriks Kartu Dashboard per Peran (MILESTONE.md §MS-01, AC-01.1)
 */
export const ROLE_DASHBOARD_CARDS: Record<UserRole, DashboardCardKey[]> = {
	owner: [
		'action_center',
		'sales_summary',
		'gross_profit',
		'outlet_comparison',
		'stock_issues',
		'hq_payables',
		'outlet_ops_status',
		'outlet_eod_status'
	],
	hq_admin: [
		'action_center',
		'sales_summary',
		'gross_profit',
		'outlet_comparison',
		'stock_issues',
		'hq_payables',
		'outlet_ops_status',
		'outlet_eod_status'
	],
	finance: [
		'action_center',
		'hq_payables',
		'petty_cash',
		'payment_reconciliation',
		'gross_profit',
		'true_up_pending',
		'outlet_eod_status'
	],
	store_manager: [
		'action_center',
		'sm_stock_min',
		'sm_count_schedule',
		'sm_petty_cash',
		'sm_proposals',
		'sm_eod_status'
	],
	cashier: [
		'action_center'
	]
};

/**
 * Memeriksa apakah sebuah peran berhak melihat kartu tertentu (AC-01.1)
 */
export function canRoleAccessCard(role: UserRole, cardKey: DashboardCardKey): boolean {
	const allowedCards = ROLE_DASHBOARD_CARDS[role];
	if (!allowedCards) return false;
	return allowedCards.includes(cardKey);
}

/**
 * Menghitung Laba Kotor (Gross Profit) murni
 * Formula: netSales - cogs
 */
export function calculateGrossProfit(netSales: number | string, cogs: number | string): number {
	const salesNum = typeof netSales === 'string' ? parseFloat(netSales) : netSales;
	const cogsNum = typeof cogs === 'string' ? parseFloat(cogs) : cogs;
	if (isNaN(salesNum) || isNaN(cogsNum)) return 0;
	return salesNum - cogsNum;
}

/**
 * Menghitung Margin Laba Kotor dalam persen (%)
 * Formula: (grossProfit / netSales) * 100
 */
export function calculateMarginPct(netSales: number | string, grossProfit: number | string): number {
	const salesNum = typeof netSales === 'string' ? parseFloat(netSales) : netSales;
	const profitNum = typeof grossProfit === 'string' ? parseFloat(grossProfit) : grossProfit;
	if (isNaN(salesNum) || isNaN(profitNum) || salesNum <= 0) return 0;
	return Math.round((profitNum / salesNum) * 1000) / 10; // 1 desimal, misal 68.2
}

/**
 * Memformat Lencana Estimasi HPP jika ada nota supplier yang belum masuk (AC-01.5)
 */
export function formatEstimateBadge(pendingInvoicesCount: number): string | undefined {
	if (pendingInvoicesCount <= 0) return undefined;
	return `Estimasi · ${pendingInvoicesCount} nota belum masuk`;
}

/**
 * Mengevaluasi apakah Tutup Hari (EOD) siap diselesaikan
 */
export function evaluateEodReadiness(checklist: SmEodChecklistItem[]): boolean {
	if (!checklist || checklist.length === 0) return false;
	return checklist.every((item) => item.done === true);
}
