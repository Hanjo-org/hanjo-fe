/**
 * State Controller: Dashboard 4 Peran (Svelte 5 Runes)
 * Referensi: Golden Rule 2, PRD 8.1, MILESTONE.md §MS-01, AC-01.1, AC-01.6
 *
 * Mengelola state reaktif kartu dashboard secara mandiri, filter toolbar,
 * dan orkestrasi retry tanpa menumpuk logika di komponen tampilan .svelte.
 */

import { dashboardService } from '../../../services/dashboard.service.js';
import { eodService } from '../../../services/eod.service.js';
import { session } from '../../../auth/session.svelte.js';
import { ROLE_DASHBOARD_CARDS, canRoleAccessCard } from '../../../domain/dashboard.js';
import type {
	DashboardCardKey,
	DashboardCardResponse,
	UserRole,
	CompleteEodRequest
} from '../../../api/contract/types.js';

export interface CardState<T = unknown> {
	key: DashboardCardKey;
	data: T | null;
	isLoading: boolean;
	error: string | null;
	updatedAt: string | null;
}

class DashboardStore {
	// Toolbar Filters
	organizationId = $state<string>('*');
	outletId = $state<string>('*');
	ownerType = $state<'all' | 'own_company' | 'partner'>('all');
	dateRange = $state<'today' | '7days' | 'month' | 'custom'>('today');

	// Map of per-card reactive states
	cards = $state<Record<string, CardState<any>>>({});

	// Derived list of visible cards for the current session's role
	currentRole = $derived<UserRole>(session.role || 'owner');
	allowedCardKeys = $derived<DashboardCardKey[]>(
		ROLE_DASHBOARD_CARDS[this.currentRole] || ROLE_DASHBOARD_CARDS.owner
	);

	constructor() {
		// Inisialisasi kartu kosong untuk setiap kemungkinan kunci
		const allKeys: DashboardCardKey[] = [
			'action_center',
			'sales_summary',
			'gross_profit',
			'outlet_comparison',
			'stock_issues',
			'hq_payables',
			'petty_cash',
			'outlet_ops_status',
			'outlet_eod_status',
			'payment_reconciliation',
			'true_up_pending',
			'sm_stock_min',
			'sm_count_schedule',
			'sm_petty_cash',
			'sm_proposals',
			'sm_eod_status'
		];

		const initialMap: Record<string, CardState> = {};
		for (const key of allKeys) {
			initialMap[key] = {
				key,
				data: null,
				isLoading: false,
				error: null,
				updatedAt: null
			};
		}
		this.cards = initialMap;
	}

	/**
	 * Mengambil state untuk kartu tertentu
	 */
	getCardState<T = unknown>(key: DashboardCardKey): CardState<T> {
		if (!this.cards[key]) {
			this.cards[key] = {
				key,
				data: null,
				isLoading: false,
				error: null,
				updatedAt: null
			};
		}
		return this.cards[key] as CardState<T>;
	}

	/**
	 * Memuat satu kartu secara mandiri (AC-01.6)
	 */
	async loadCard(key: DashboardCardKey, isRetry = false): Promise<void> {
		// Validasi apakah peran saat ini berhak atas kartu ini (AC-01.1)
		if (!canRoleAccessCard(this.currentRole, key)) {
			return;
		}

		const card = this.getCardState(key);
		card.isLoading = true;
		card.error = null;

		try {
			const res = await dashboardService.getCard(key, {
				role: this.currentRole,
				organization_id: this.organizationId,
				outlet_id: this.outletId,
				owner_type: this.ownerType,
				date: session.businessDate
			});

			card.data = res.data;
			card.updatedAt = res.updated_at;
			card.error = null;
		} catch (err: any) {
			card.error = err.message || `Gagal memuat kartu ${key}`;
			console.error(`[Dashboard] Galat pada kartu ${key}:`, err);
		} finally {
			card.isLoading = false;
		}
	}

	/**
	 * Memuat seluruh kartu yang berhak untuk peran saat ini
	 */
	async refreshAll(): Promise<void> {
		const keysToLoad = this.allowedCardKeys;
		await Promise.allSettled(keysToLoad.map((k) => this.loadCard(k)));
	}

	/**
	 * Mengubah filter organisasi dan memperbarui kartu terkait
	 */
	setOrganization(orgId: string): void {
		this.organizationId = orgId === 'all' ? '*' : orgId;
		this.refreshAll();
	}

	/**
	 * Mengubah filter outlet dan memperbarui kartu terkait
	 */
	setOutlet(outletId: string): void {
		this.outletId = outletId === 'all' ? '*' : outletId;
		this.refreshAll();
	}

	/**
	 * Mengubah filter tipe kepemilikan dan memperbarui kartu terkait
	 */
	setOwnerType(ownerType: 'all' | 'own_company' | 'partner'): void {
		this.ownerType = ownerType;
		this.refreshAll();
	}

	/**
	 * Mengubah filter rentang tanggal dan memperbarui kartu terkait
	 */
	setDateRange(range: 'today' | '7days' | 'month' | 'custom'): void {
		this.dateRange = range;
		this.refreshAll();
	}

	/**
	 * Aksi Store Manager menyelesaikan Tutup Hari / End of Day (T-01.14 & AC-01.13)
	 */
	async completeEod(notes?: string): Promise<boolean> {
		const targetOutlet = this.outletId && this.outletId !== '*' ? this.outletId : 'out-jkt-01';
		const date = session.businessDate || '2026-10-13';

		try {
			await eodService.completeEod({
				outlet_id: targetOutlet,
				business_date: date,
				cash_drawer_counted: true,
				waste_recorded: true,
				notes
			});

			// Perbarui kartu EOD dan action center secara instan
			await Promise.all([
				this.loadCard('sm_eod_status'),
				this.loadCard('outlet_eod_status'),
				this.loadCard('action_center')
			]);

			return true;
		} catch (err) {
			console.error('[Dashboard] Gagal menyelesaikan EOD:', err);
			return false;
		}
	}
}

export const dashboardStore = new DashboardStore();
