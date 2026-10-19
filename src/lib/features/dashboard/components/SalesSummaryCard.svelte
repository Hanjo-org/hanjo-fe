<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah, formatNumber } from '../../../utils/format.js';
	import Chart from '../../../components/data/Chart.svelte';
	import type { SalesSummaryCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const data = $derived(cardState.data);

	// Tab tampilan visualisasi grafik: Tren Harian vs Jam Ramai
	let chartView = $state<'trend' | 'hourly'>('trend');

	const trendChartPoints = $derived(
		(data?.daily_trends || []).map((t) => ({
			label: t.date.slice(5), // '10-13'
			value: parseFloat(t.omzet),
			formattedValue: `${formatRupiah(t.omzet)} (${t.cup_count} cup)`
		}))
	);

	const hourlyChartPoints = $derived(
		(data?.hourly_traffic || []).map((h) => ({
			label: h.hour,
			value: h.count,
			formattedValue: `${h.count} cup (${formatRupiah(h.omzet)})`
		}))
	);
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	title="Ringkasan Penjualan & Omzet"
	icon="banknotes"
	subtitle="Konsolidasi struk POS kasir & analitik transaksi"
	drilldownUrl="/reports"
	drilldownLabel="Laporan Penjualan"
	colSpan="col-12 col-lg-8"
>
	{#if data}
		<!-- 1. Headline Omzet & Trend -->
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.omzet)}</span>
			<span class="headline-trend">
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="18 15 12 9 6 15" />
				</svg>
				{data.trend_vs_previous_pct}% vs kemarin
			</span>
		</div>

		<!-- 2. Sub-metrik Transaksi & Komposisi Pembayaran -->
		<div class="sales-subgrid">
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Total Cup</span>
				<span class="sales-subitem-val">{formatNumber(data.cup_count)} Cup</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Rata-rata Nilai (AOV)</span>
				<span class="sales-subitem-val">{formatRupiah(data.avg_transaction_value)}</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">QRIS / Non-Tunai</span>
				<span class="sales-subitem-val font-bold" style="color: var(--brand-primary);">
					{data.non_cash_percentage}% ({formatRupiah(data.non_cash_amount)})
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Tunai Kas Laci</span>
				<span class="sales-subitem-val">
					{data.cash_percentage}% ({formatRupiah(data.cash_amount)})
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Void & Refund</span>
				<span class="sales-subitem-val font-semibold" style="color: var(--pill-danger-text);">
					{data.void_refund_count} trx ({formatRupiah(data.void_refund_amount)})
				</span>
			</div>
		</div>

		<!-- 3. Visualisasi Grafik Tren & Jam Ramai (T-01.10) -->
		<div class="sales-chart-wrapper pt-2">
			<div class="flex items-center justify-between pb-2" style="border-bottom: 1px solid var(--border-subtle);">
				<span class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-muted);">
					{chartView === 'trend' ? 'Tren Omzet 7 Hari Terakhir (Garis)' : 'Distribusi Jam Ramai Toko (Batang)'}
				</span>
				<div class="dash-tab-switch">
					<button
						type="button"
						class="dash-tab-btn {chartView === 'trend' ? 'active' : ''}"
						onclick={() => (chartView = 'trend')}
					>
						Tren Harian
					</button>
					<button
						type="button"
						class="dash-tab-btn {chartView === 'hourly' ? 'active' : ''}"
						onclick={() => (chartView = 'hourly')}
					>
						Jam Ramai
					</button>
				</div>
			</div>

			{#if chartView === 'trend'}
				<Chart
					type="line"
					data={trendChartPoints}
					height={180}
					color="var(--brand-primary, #059669)"
				/>
			{:else}
				<Chart
					type="bar"
					data={hourlyChartPoints}
					height={180}
					color="var(--pill-info-text, #3b82f6)"
				/>
			{/if}
		</div>
	{/if}
</DashboardCardFrame>
