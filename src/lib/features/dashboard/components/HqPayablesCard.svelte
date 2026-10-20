<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { HqPayablesCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<HqPayablesCardData>('hq_payables'));
	const data = $derived(cardState.data);
	const dueBills = $derived(data?.due_bills || []);
</script>

<DashboardCardFrame
	cardKey="hq_payables"
	title="Hutang Jatuh Tempo (7 Hari)"
	icon="document-text"
	subtitle="Daftar kewajiban pembayaran supplier yang jatuh tempo dalam kurun 7 hari"
	drilldownUrl="/payables"
	drilldownLabel="Kelola Hutang"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.due_soon_amount)}</span>
			<Badge
				variant={data.due_soon_count > 0 ? 'warning' : 'success'}
				text="{data.due_soon_count} Tagihan Siap Bayar"
				size="md"
			/>
		</div>
		<div class="text-xs pb-1" style="color: var(--text-muted);">
			Total seluruh kewajiban hutang usaha: <strong class="mono" style="color: var(--text-main);">{formatRupiah(data.total_balance)}</strong>
		</div>

		<!-- Tabel Daftar Tagihan Jatuh Tempo 7 Hari -->
		{#if dueBills.length === 0}
			<div class="p-6 text-center text-muted">
				<p>Tidak ada tagihan supplier yang jatuh tempo dalam 7 hari ke depan. Arus kas aman.</p>
			</div>
		{:else}
			<div class="card-table-wrap pt-2">
				<table class="dash-table" style="min-width: 540px;">
					<thead>
						<tr>
							<th>Faktur & Supplier</th>
							<th>Jatuh Tempo</th>
							<th class="text-right">Nominal</th>
							<th class="text-center">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each dueBills as bill}
							<tr>
								<td>
									<div class="font-bold text-xs" style="color: var(--text-main);">{bill.supplier_name}</div>
									<div class="mono text-[11px]" style="color: var(--text-subtle);">
										{bill.invoice_number} · <span style="color: var(--text-muted);">{bill.category}</span>
									</div>
								</td>
								<td>
									<div class="font-semibold text-xs pb-0.5" style="color: var(--text-main);">{bill.due_date_formatted}</div>
									<Badge
										variant={bill.days_left <= 1 ? 'danger' : bill.days_left <= 3 ? 'warning' : 'info'}
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
										class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors whitespace-nowrap"
										style="color: var(--brand-primary); background: var(--bg-panel-sub); border: 1px solid var(--border-panel);"
										title="Catat pembayaran untuk faktur {bill.invoice_number}"
									>
										Catat Pembayaran
										<Icon name="arrow-right" size={11} />
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
