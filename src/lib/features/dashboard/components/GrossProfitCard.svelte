<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { GrossProfitCardData } from '../../../api/contract/types.js';

	interface Props {
		colSpan?: string;
	}

	let { colSpan = 'col-12 col-lg-6' }: Props = $props();

	const cardState = $derived(dashboardStore.getCardState<GrossProfitCardData>('gross_profit'));
	const data = $derived(cardState.data);
</script>

<DashboardCardFrame
	cardKey="gross_profit"
	title="Laba Kotor & Margin (HPP)"
	icon="trending-up"
	subtitle="Kalkulasi laba kotor terhadap omzet bersih dan estimasi HPP"
	drilldownUrl="/finance"
	drilldownLabel="Keuangan & HPP"
	{colSpan}
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.gross_profit)}</span>
			<span class="headline-trend">
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="18 15 12 9 6 15" />
				</svg>
				{data.trend_vs_previous_pct}% vs kemarin
			</span>
		</div>

		<!-- Lencana Estimasi HPP (AC-01.5) -->
		{#if data.is_estimate && data.estimate_badge}
			<div class="py-1">
				<Badge variant="warning" text={data.estimate_badge} size="md" />
			</div>
		{/if}

		<div class="sales-subgrid">
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Margin Laba Kotor</span>
				<span class="sales-subitem-val font-extrabold text-base" style="color: var(--brand-primary);">
					{data.margin_pct}%
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Total HPP Bahan Baku</span>
				<span class="sales-subitem-val">
					{formatRupiah(data.cogs_amount)}
				</span>
			</div>
		</div>

		<div class="dash-banner dash-banner-warning">
			<div class="font-bold flex items-center gap-1.5 mb-0.5">
				<Icon name="information-circle" size={16} />
				<span>Status Biaya Sementara (True-Up)</span>
			</div>
			<span>
				HPP dihitung dari harga beli terakhir. Angka laba kotor final akan disesuaikan otomatis saat Finance menyelesaikan verifikasi nota supplier.
			</span>
		</div>
	{/if}
</DashboardCardFrame>
