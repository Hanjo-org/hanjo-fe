<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import type { HqPayablesCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<HqPayablesCardData>('hq_payables'));
	const data = $derived(cardState.data);
	const isSummary = $derived(data?.summary_mode ?? false);
</script>

<DashboardCardFrame
	cardKey="hq_payables"
	title="Hutang Usaha & Aging Tagihan"
	icon="document-text"
	subtitle="Saldo kewajiban ke supplier dan distribusi umur jatuh tempo"
	drilldownUrl="/payables"
	drilldownLabel="Daftar Hutang"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.total_balance)}</span>
			<span class="headline-trend" style="color: var(--pill-warning-text); background: var(--pill-warning-bg); border: 1px solid var(--pill-warning-border);">
				Jatuh tempo: {formatRupiah(data.due_soon_amount)}
			</span>
		</div>

		<!-- Aging Buckets Breakdown (MILESTONE.md §6.9) -->
		<div class="flex flex-col gap-2 pt-1">
			<span class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-muted);">
				Umur Hutang (Aging Buckets)
			</span>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
				<div class="dash-subbox p-2.5">
					<div class="text-[11px] font-semibold" style="color: var(--text-muted);">Belum Jatuh Tempo</div>
					<div class="font-bold mono text-sm" style="color: var(--text-main);">{formatRupiah(data.aging.not_due)}</div>
				</div>
				<div class="dash-subbox p-2.5">
					<div class="text-[11px] font-semibold" style="color: var(--text-muted);">1 - 30 Hari</div>
					<div class="font-bold mono text-sm" style="color: var(--text-main);">{formatRupiah(data.aging.days_1_30)}</div>
				</div>
				<div class="p-2.5 rounded-lg" style="background: var(--pill-warning-bg); border: 1px solid var(--pill-warning-border);">
					<div class="text-[11px] font-semibold" style="color: var(--pill-warning-text);">31 - 60 Hari</div>
					<div class="font-bold mono text-sm" style="color: var(--pill-warning-text);">{formatRupiah(data.aging.days_31_60)}</div>
				</div>
				{#if !isSummary}
					<div class="dash-subbox p-2.5">
						<div class="text-[11px] font-semibold" style="color: var(--text-muted);">61 - 90 Hari</div>
						<div class="font-bold mono text-sm" style="color: var(--text-main);">{formatRupiah(data.aging.days_61_90)}</div>
					</div>
					<div class="dash-subbox p-2.5">
						<div class="text-[11px] font-semibold" style="color: var(--text-muted);">&gt; 90 Hari (Macet)</div>
						<div class="font-bold mono text-sm" style="color: var(--text-main);">{formatRupiah(data.aging.days_over_90)}</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</DashboardCardFrame>
