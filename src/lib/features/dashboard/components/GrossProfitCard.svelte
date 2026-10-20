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
	subtitle="Kalkulasi laba kotor terhadap omzet bersih dan estimasi HPP bahan baku"
	drilldownUrl="/finance"
	drilldownLabel="Keuangan & HPP"
	{colSpan}
>
	{#if data}
		<div class="sales-kpi-headline flex items-center justify-between flex-wrap gap-2">
			<div>
				<span class="headline-val font-bold mono">{formatRupiah(data.gross_profit)}</span>
			</div>
			<span class="headline-trend">
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="18 15 12 9 6 15" />
				</svg>
				{data.trend_vs_previous_pct}% vs kemarin
			</span>
		</div>

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
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Status Estimasi HPP</span>
				<span class="sales-subitem-val font-semibold text-xs" style="color: var(--pill-warning-text);">
					Sementara (True-Up)
				</span>
			</div>
		</div>

		<!-- Insight Finansial Utama: Estimasi Dampak 3 Nota True-Up (Rp 3,45 jt) terhadap Margin -->
		<div class="dash-subbox flex flex-col gap-3 p-4 rounded-xl border" style="background: rgba(245, 158, 11, 0.06); border-color: rgba(245, 158, 11, 0.25);">
			<div class="flex items-center justify-between flex-wrap gap-2">
				<span class="font-bold text-xs flex items-center gap-1.5" style="color: var(--pill-warning-text);">
					<Icon name="receipt-percent" size={16} />
					<span>Estimasi Dampak 3 Nota True-Up (Rp 3,45 jt) terhadap Margin</span>
				</span>
				<Badge variant="warning" text="Risiko Koreksi HPP" size="sm" />
			</div>

			<div class="grid grid-cols-2 gap-3 text-xs pt-1">
				<div class="flex flex-col gap-1">
					<span style="color: var(--text-subtle);">Margin Berjalan (Sementara):</span>
					<strong class="mono text-base font-bold" style="color: var(--text-main);">{data.margin_pct}%</strong>
				</div>
				<div class="flex flex-col gap-1">
					<span style="color: var(--pill-danger-text);">Potensi Pasca Faktur Masuk:</span>
					<strong class="mono text-base font-bold" style="color: var(--pill-danger-text);">49.8% (-2.6%)</strong>
				</div>
			</div>

			<div class="text-[11.5px] pt-2.5 border-t flex items-center justify-between flex-wrap gap-1 leading-relaxed" style="color: var(--text-muted); border-color: rgba(245, 158, 11, 0.18);">
				<span>3 nota penerimaan masih memakai harga beli estimasi. Selesaikan rekonsiliasi untuk mengunci HPP definitif.</span>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
