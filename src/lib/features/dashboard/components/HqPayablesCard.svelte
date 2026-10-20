<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { HqPayablesCardData, DuePayableBill } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<HqPayablesCardData>('hq_payables'));
	const data = $derived(cardState.data);
	const dueBills = $derived(data?.due_bills || []);

	// State Checkbox Batch Payment
	let selectedBillIds = $state<string[]>([]);
	let activeTab = $state<'due_soon' | 'overdue'>('due_soon');
	let batchPaymentSuccess = $state<string | null>(null);

	const overdueBills: DuePayableBill[] = [
		{
			id: 'bill-ovd-1',
			invoice_number: 'INV-SR-2609-042',
			supplier_name: 'PT Sari Rasa Pangan',
			category: 'Sirup & Saus Karamel',
			due_date: '2026-09-28',
			due_date_formatted: '28 Sep 2026',
			days_left: -15,
			days_left_label: 'Lewat 15 hari',
			amount: '850000.00',
			status: 'overdue'
		}
	];

	const displayBills = $derived(activeTab === 'due_soon' ? dueBills : overdueBills);

	const allSelected = $derived(
		displayBills.length > 0 && displayBills.every((b) => selectedBillIds.includes(b.id))
	);

	const selectedTotalAmount = $derived(
		displayBills
			.filter((b) => selectedBillIds.includes(b.id))
			.reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
	);

	function toggleSelectAll() {
		if (allSelected) {
			selectedBillIds = [];
		} else {
			selectedBillIds = displayBills.map((b) => b.id);
		}
	}

	function toggleSelectBill(id: string) {
		if (selectedBillIds.includes(id)) {
			selectedBillIds = selectedBillIds.filter((bId) => bId !== id);
		} else {
			selectedBillIds = [...selectedBillIds, id];
		}
	}

	function handleProcessBatchPayment() {
		const count = selectedBillIds.length;
		const totalFormatted = formatRupiah(selectedTotalAmount);
		batchPaymentSuccess = `Berhasil memproses pembayaran ${count} faktur senilai ${totalFormatted}. Status kas dan jurnal terupdate.`;
		selectedBillIds = [];
		setTimeout(() => {
			batchPaymentSuccess = null;
		}, 4000);
	}
</script>

<DashboardCardFrame
	cardKey="hq_payables"
	title="Hutang Supplier & Jadwal Pembayaran"
	icon="document-text"
	subtitle="Kewajiban pembayaran hutang usaha supplier yang jatuh tempo (Jendela 7 hari)"
	badgeText="Jendela 7 Hari"
	badgeVariant="info"
	drilldownUrl="/payables"
	drilldownLabel="Kelola Hutang"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline flex items-center justify-between flex-wrap gap-2">
			<div>
				<span class="headline-val font-bold mono">{formatRupiah(data.due_soon_amount)}</span>
				<span class="text-xs ml-2 font-medium" style="color: var(--text-muted);">(Jatuh Tempo 7 Hari)</span>
			</div>
			<div class="dash-tab-switch">
				<button
					type="button"
					class="dash-tab-btn {activeTab === 'due_soon' ? 'active-primary' : ''}"
					onclick={() => { activeTab = 'due_soon'; selectedBillIds = []; }}
				>
					<span>Jatuh Tempo 7 Hari</span>
					<span class="tab-badge">{dueBills.length}</span>
				</button>
				<button
					type="button"
					class="dash-tab-btn tab-btn-overdue {activeTab === 'overdue' ? 'active-overdue' : ''}"
					onclick={() => { activeTab = 'overdue'; selectedBillIds = []; }}
					title="Simulasi tagihan menunggak lewat jatuh tempo"
				>
					<span>Lewat Jatuh Tempo</span>
					<span class="tab-badge overdue">1</span>
				</button>
			</div>
		</div>

		<!-- Satu Baris Pembanding: Perlu Dibayar dari Total Hutang -->
		<div class="text-xs pb-1" style="color: var(--text-muted);">
			Perlu dibayar: <strong class="mono" style="color: var(--text-main);">{formatRupiah(data.due_soon_amount)}</strong> dari total kewajiban <strong class="mono" style="color: var(--text-main);">{formatRupiah(data.total_balance)}</strong> ({parseFloat(data.total_balance) > 0 ? Math.round((parseFloat(data.due_soon_amount) / parseFloat(data.total_balance)) * 100) : 0}%)
		</div>

		{#if batchPaymentSuccess}
			<div class="dash-banner dash-banner-success text-xs flex items-center gap-2">
				<Icon name="check-circle" size={16} />
				<span>{batchPaymentSuccess}</span>
			</div>
		{/if}

		<!-- Batch Payment Action Bar -->
		{#if selectedBillIds.length > 0}
			<div class="p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs border" style="background: rgba(37, 99, 235, 0.08); border-color: rgba(37, 99, 235, 0.25);">
				<div class="flex items-center gap-2.5">
					<span class="font-bold text-sm" style="color: #1e40af;">{selectedBillIds.length} faktur dipilih</span>
					<span class="dot-sep">•</span>
					<span>Total: <strong class="mono font-bold text-sm" style="color: #1e3a8a;">{formatRupiah(selectedTotalAmount)}</strong></span>
				</div>
				<button
					type="button"
					class="px-4 py-2 font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs"
					style="background: #2563eb;"
					onclick={handleProcessBatchPayment}
				>
					<Icon name="check" size={14} />
					<span>Bayar {selectedBillIds.length} Faktur</span>
				</button>
			</div>
		{/if}

		<!-- Tabel Daftar Tagihan -->
		{#if displayBills.length === 0}
			<div class="p-6 text-center text-muted">
				<p>Tidak ada tagihan dalam kategori ini.</p>
			</div>
		{:else}
			<div class="card-table-wrap pt-1">
				<table class="dash-table" style="min-width: 560px;">
					<thead>
						<tr>
							<th style="width: 36px;" class="text-center">
								<input
									type="checkbox"
									checked={allSelected}
									onchange={toggleSelectAll}
									aria-label="Pilih semua tagihan"
									style="cursor: pointer;"
								/>
							</th>
							<th>Faktur &amp; Supplier</th>
							<th>Jatuh Tempo</th>
							<th class="text-right">Nominal</th>
							<th class="text-center">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each displayBills as bill}
							{@const isUrgent = bill.days_left <= 1}
							{@const isChecked = selectedBillIds.includes(bill.id)}
							<tr
								style={isUrgent
									? 'background: rgba(239, 68, 68, 0.04); border-left: 3px solid #ef4444;'
									: isChecked
									? 'background: rgba(37, 99, 235, 0.04);'
									: ''}
							>
								<td class="text-center">
									<input
										type="checkbox"
										checked={isChecked}
										onchange={() => toggleSelectBill(bill.id)}
										aria-label="Pilih faktur {bill.invoice_number}"
										style="cursor: pointer;"
									/>
								</td>
								<td>
									<div class="font-bold text-xs" style="color: var(--text-main);">{bill.supplier_name}</div>
									<div class="mono text-[11px]" style="color: var(--text-subtle);">
										{bill.invoice_number} · <span style="color: var(--text-muted);">{bill.category}</span>
									</div>
								</td>
								<td>
									<div class="font-semibold text-xs pb-0.5" style="color: var(--text-main);">{bill.due_date_formatted}</div>
									<Badge
										variant={bill.days_left < 0 ? 'danger' : bill.days_left <= 1 ? 'danger' : bill.days_left <= 3 ? 'warning' : 'info'}
										text={bill.days_left_label}
										size="sm"
									/>
								</td>
								<td class="text-right mono font-bold text-xs" style="color: var(--text-main);">
									{formatRupiah(bill.amount)}
								</td>
								<td class="text-center">
									<a
										href="/payables?inv={bill.invoice_number}"
										class="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap"
										style={isUrgent
											? 'color: #ffffff; background: #dc2626; border: 1px solid #b91c1c; box-shadow: 0 1px 3px rgba(220, 38, 38, 0.25);'
											: 'color: var(--text-main); background: var(--bg-panel-sub); border: 1px solid var(--border-panel);'}
										title="Catat pembayaran untuk faktur {bill.invoice_number}"
									>
										<span>{isUrgent ? 'Bayar Segera (H-1)' : 'Catat Pembayaran'}</span>
										<Icon name="arrow-right" size={12} />
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</DashboardCardFrame>
