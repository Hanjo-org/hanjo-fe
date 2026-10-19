<script lang="ts">
	/**
	 * OwnerLiveTrafficCard.svelte
	 * Ritme Penjualan Hari Ini vs Kemarin
	 * Menjawab rasa penasaran Owner:
	 * "Apakah hari ini lebih sepi atau ramai dari kemarin? Jam berapa toko paling ramai?"
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah, formatDate } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Chart from '../../../components/data/Chart.svelte';
	import type { SalesSummaryCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const data = $derived(cardState.data);

	let activeView = $state<'hourly' | 'daily'>('hourly');
	let hoveredHourIndex = $state<number | null>(null);

	const hourlyTraffic = $derived(data?.hourly_traffic || []);
	const dailyTrends = $derived(data?.daily_trends || []);

	// Hitung nilai maksimum omzet per jam untuk normalisasi tinggi grafik
	const maxHourlyVal = $derived.by(() => {
		if (hourlyTraffic.length === 0) return 2000000;
		const maxToday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.omzet) || 0));
		const maxYesterday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.yesterday_omzet || '0') || 0));
		return Math.max(maxToday, maxYesterday, 1000000);
	});

	// Temukan jam puncak keramaian
	const peakHour = $derived.by(() => {
		if (hourlyTraffic.length === 0) return null;
		let maxItem = hourlyTraffic[0];
		let maxVal = parseFloat(maxItem.omzet) || 0;
		for (const item of hourlyTraffic) {
			const v = parseFloat(item.omzet) || 0;
			if (v > maxVal) {
				maxVal = v;
				maxItem = item;
			}
		}
		return maxItem;
	});

	// Data untuk chart tren 7 hari
	const dailyChartPoints = $derived(
		dailyTrends.map((d) => ({
			label: formatDate(d.date).slice(0, 6),
			value: parseFloat(d.omzet) || 0,
			formattedValue: formatRupiah(d.omzet) + ` (${d.cup_count} cup)`
		}))
	);
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	title="Ritme Penjualan: Hari Ini vs Kemarin"
	icon="chart-bar"
	subtitle="Live komparasi transaksi jam per jam untuk memantau jam ramai dan jam sepi"
	badgeText={data?.trend_vs_previous_pct ? `▲ ${data.trend_vs_previous_pct}% Lebih Ramai` : 'Live'}
	badgeVariant="success"
	drilldownUrl="/reports"
	drilldownLabel="Laporan Penjualan Lengkap"
	colSpan="col-12 col-lg-7"
>
	{#if data}
		<!-- Header Tab Switcher -->
		<div class="flex items-center justify-between mb-4">
			<div class="dash-tab-switch">
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeView === 'hourly'}
					onclick={() => (activeView = 'hourly')}
				>
					Komparasi Jam per Jam
				</button>
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeView === 'daily'}
					onclick={() => (activeView = 'daily')}
				>
					Tren 7 Hari Terakhir
				</button>
			</div>

			<!-- Legenda Warna -->
			{#if activeView === 'hourly'}
				<div class="flex items-center gap-3 text-xs">
					<div class="flex items-center gap-1.5">
						<span class="legend-box today"></span>
						<span style="color: var(--text-main); font-weight: 600;">Hari Ini</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="legend-box yesterday"></span>
						<span style="color: var(--text-muted);">Kemarin</span>
					</div>
				</div>
			{/if}
		</div>

		{#if activeView === 'hourly'}
			<!-- 1. Tampilan Grafik Komparasi Jam per Jam -->
			<div class="hourly-chart-box">
				<div class="hourly-bars-container">
					{#each hourlyTraffic as hourItem, idx}
						{@const todayVal = parseFloat(hourItem.omzet) || 0}
						{@const yesterdayVal = parseFloat(hourItem.yesterday_omzet || '0') || 0}
						{@const todayHeight = Math.max((todayVal / maxHourlyVal) * 100, 6)}
						{@const yesterdayHeight = Math.max((yesterdayVal / maxHourlyVal) * 100, 6)}
						{@const isHovered = hoveredHourIndex === idx}

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="hourly-col"
							onmouseenter={() => (hoveredHourIndex = idx)}
							onmouseleave={() => (hoveredHourIndex = null)}
						>
							<div class="bars-pair">
								<!-- Bar Kemarin -->
								<div
									class="bar yesterday"
									style="height: {yesterdayHeight}%;"
									title="Kemarin: {formatRupiah(hourItem.yesterday_omzet || '0')}"
								></div>

								<!-- Bar Hari Ini -->
								<div
									class="bar today"
									class:highlight={isHovered}
									style="height: {todayHeight}%;"
									title="Hari Ini: {formatRupiah(hourItem.omzet)}"
								></div>
							</div>

							<span class="hour-label font-mono">{hourItem.hour}</span>
						</div>
					{/each}
				</div>

				<!-- Tooltip / Detail Bar yang Sedang Diarahkan Kursor -->
				{#if hoveredHourIndex !== null && hourlyTraffic[hoveredHourIndex]}
					{@const sel = hourlyTraffic[hoveredHourIndex]}
					{@const selToday = parseFloat(sel.omzet) || 0}
					{@const selYest = parseFloat(sel.yesterday_omzet || '0') || 0}
					{@const diff = selToday - selYest}
					<div class="hourly-hover-card">
						<div class="flex items-center justify-between text-xs font-bold border-b pb-1 mb-1.5" style="border-color: var(--border-panel);">
							<span style="color: var(--text-main);">Jam {sel.hour} WIB</span>
							<span style={diff >= 0 ? 'color: var(--brand-primary);' : 'color: var(--pill-danger-text);'}>
								{diff >= 0 ? `▲ +${formatRupiah(diff)} Lebih Ramai` : `▼ ${formatRupiah(diff)} Lebih Sepi`}
							</span>
						</div>
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="text-[11px] block text-muted">Hari Ini:</span>
								<strong style="color: var(--brand-primary);">{formatRupiah(sel.omzet)}</strong>
								<span class="text-[11px] block text-muted">{sel.count} Cup</span>
							</div>
							<div>
								<span class="text-[11px] block text-muted">Kemarin:</span>
								<strong style="color: var(--text-main);">{formatRupiah(sel.yesterday_omzet || '0')}</strong>
								<span class="text-[11px] block text-muted">{sel.yesterday_count || 0} Cup</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Insight Puncak Jam Ramai -->
			{#if peakHour}
				<div class="dash-banner dash-banner-success mt-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Icon name="bolt" size={16} />
						<span class="text-xs">
							<strong>Puncak Keramaian Hari Ini:</strong> Jam <strong>{peakHour.hour} WIB</strong> dengan omzet <strong>{formatRupiah(peakHour.omzet)}</strong> ({peakHour.count} cup).
						</span>
					</div>
					<span class="text-[11px] font-semibold" style="color: var(--brand-primary);">
						Peak Hour
					</span>
				</div>
			{/if}
		{:else}
			<!-- 2. Tampilan Grafik Tren 7 Hari Terakhir -->
			<div class="pt-2">
				<Chart
					type="line"
					data={dailyChartPoints}
					height={200}
					color="var(--brand-primary)"
				/>
			</div>
		{/if}
	{/if}
</DashboardCardFrame>
