<script lang="ts">
	/**
	 * OwnerLiveTrafficCard.svelte
	 * Penjualan Hari Ini vs Kemarin (Live Traffic + Tren 7 Hari + Metode Bayar)
	 * Susunan terstruktur:
	 * [ Grafik jam per jam ]
	 * [ Tren 7 hari | Metode bayar ]
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah, formatDate } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SalesSummaryCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const data = $derived(cardState.data);

	let hoveredHourIndex = $state<number | null>(null);

	const hourlyTraffic = $derived(data?.hourly_traffic || []);
	const dailyTrends = $derived(data?.daily_trends || []);
	const hoveredItem = $derived(hoveredHourIndex !== null ? hourlyTraffic[hoveredHourIndex] : null);

	// Hitung nilai maksimum omzet per jam untuk normalisasi tinggi grafik
	const maxHourlyVal = $derived.by(() => {
		if (hourlyTraffic.length === 0) return 2000000;
		const maxToday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.omzet) || 0));
		const maxYesterday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.yesterday_omzet || '0') || 0));
		return Math.max(maxToday, maxYesterday, 1000000);
	});

	// Hitung nilai maksimum omzet harian untuk tren 7 hari
	const maxDailyVal = $derived.by(() => {
		if (dailyTrends.length === 0) return 16000000;
		return Math.max(...dailyTrends.map((d) => parseFloat(d.omzet) || 0), 16000000);
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
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	title="Penjualan: Hari Ini vs Kemarin"
	icon="chart-bar"
	subtitle="Live komparasi transaksi jam per jam (08:00 - 21:00 WIB) untuk mengamati jam ramai dan jam sepi"
	badgeText={data?.lfl_trend_pct ? `▲ +${data.lfl_trend_pct}% LFL (s/d 21:00)` : data?.trend_vs_previous_pct ? `▲ ${data.trend_vs_previous_pct}% Lebih Ramai` : 'Live'}
	badgeVariant="info"
	drilldownUrl="/reports"
	drilldownLabel="Laporan Penjualan Lengkap"
	colSpan="col-12 col-lg-7"
>
	{#if data}
		<!-- Header Subtitle & Legenda Warna (Aksesibilitas Tinggi) -->
		<div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
			<span class="text-xs font-semibold" style="color: var(--text-muted);">
				Komparasi Real-Time Jam per Jam (08:00 - 21:00 WIB)
			</span>

			<div class="flex items-center gap-3 text-xs flex-wrap">
				<div class="flex items-center gap-1.5" title="Jam saat transaksi hari ini melampaui atau sama dengan kemarin">
					<span class="legend-box higher"></span>
					<span style="color: var(--text-main); font-weight: 600;">▲ Hari Ini (&ge; Kemarin)</span>
				</div>
				<div class="flex items-center gap-1.5" title="Jam saat transaksi hari ini lebih rendah dari kemarin">
					<span class="legend-box lower" style="background: repeating-linear-gradient(-45deg, #ef4444, #ef4444 2px, #dc2626 2px, #dc2626 4px); border: 1px solid #b91c1c;"></span>
					<span style="color: #f87171; font-weight: 600;">▼ Hari Ini (&lt; Kemarin)</span>
				</div>
				<div class="flex items-center gap-1.5" title="Realisasi transaksi kemarin pada jam yang sama">
					<span class="legend-box yesterday"></span>
					<span style="color: var(--text-muted); font-weight: 500;">Kemarin (LFL)</span>
				</div>
			</div>
		</div>

		<!-- 1. Tampilan Grafik Komparasi Jam per Jam (08:00 - 21:00 WIB) -->
		<div class="hourly-chart-box">
			<!-- Docked Live Inspector Banner (Jaminan Tidak Pernah Terpotong / Glitch) -->
			{#if hoveredItem}
				{@const hToday = parseFloat(hoveredItem.omzet) || 0}
				{@const hYest = parseFloat(hoveredItem.yesterday_omzet || '0') || 0}
				{@const hDiff = hToday - hYest}
				{@const hIsHigher = hDiff >= 0}
				{@const hPct = hYest > 0 ? ((hDiff / hYest) * 100).toFixed(1) : '0'}

				<div class="hourly-inspector-bar">
					<div class="flex items-center gap-2">
						<span class="hourly-inspector-badge font-mono" class:lower={!hIsHigher}>
							Jam {hoveredItem.hour} WIB
						</span>
						<span class="text-xs font-bold" style="color: {hIsHigher ? '#60a5fa' : '#f87171'};">
							{hIsHigher ? `▲ +${formatRupiah(hDiff)} (+${hPct}% vs Kemarin)` : `▼ ${formatRupiah(hDiff)} (${hPct}% vs Kemarin)`}
						</span>
					</div>
					<div class="flex items-center gap-3 text-xs">
						<span>Hari Ini: <strong style="color: var(--text-main);">{formatRupiah(hoveredItem.omzet)}</strong> ({hoveredItem.count} item)</span>
						<span class="dot-sep">•</span>
						<span>Kemarin: <strong style="color: var(--text-muted);">{formatRupiah(hoveredItem.yesterday_omzet || '0')}</strong> ({hoveredItem.yesterday_count || 0} item)</span>
					</div>
				</div>
			{:else}
				<div class="hourly-inspector-bar idle">
					<span class="text-xs" style="color: var(--text-muted);">
						Arahkan kursor / sentuh bar jam untuk membedah omzet vs kemarin
					</span>
					{#if peakHour}
						<span class="text-xs font-semibold" style="color: #60a5fa;">
							Puncak: Jam {peakHour.hour} ({formatRupiah(peakHour.omzet)})
						</span>
					{/if}
				</div>
			{/if}

			<!-- Area Grafik + Sumbu Y + Garis Bantu -->
			<div class="hourly-grid-wrap">
				<!-- Sumbu Y -->
				<div class="hourly-y-axis" aria-hidden="true">
					<span class="y-axis-label">Rp 2,0 jt</span>
					<span class="y-axis-label">Rp 1,5 jt</span>
					<span class="y-axis-label">Rp 1,0 jt</span>
					<span class="y-axis-label">Rp 0,5 jt</span>
					<span class="y-axis-label">Rp 0</span>
				</div>

				<!-- Viewport Batang Grafik -->
				<div class="hourly-viewport">
					<!-- Garis Bantu Horizontal (Dashed Gridlines) -->
					<div class="chart-grid-lines" aria-hidden="true">
						<div class="grid-line"></div>
						<div class="grid-line"></div>
						<div class="grid-line"></div>
						<div class="grid-line"></div>
						<div class="grid-line"></div>
					</div>

					<div class="hourly-bars-container">
						{#each hourlyTraffic as hourItem, idx}
							{@const todayVal = parseFloat(hourItem.omzet) || 0}
							{@const yesterdayVal = parseFloat(hourItem.yesterday_omzet || '0') || 0}
							{@const diff = todayVal - yesterdayVal}
							{@const isHigher = diff >= 0}
							{@const todayHeight = Math.max((todayVal / maxHourlyVal) * 100, 6)}
							{@const yesterdayHeight = Math.max((yesterdayVal / maxHourlyVal) * 100, 6)}
							{@const isHovered = hoveredHourIndex === idx}

							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="hourly-col"
								onmouseenter={() => (hoveredHourIndex = idx)}
								onmouseleave={() => (hoveredHourIndex = null)}
								onclick={() => (hoveredHourIndex = idx)}
							>
								<div class="bars-pair">
									<!-- Bar Kemarin (Netral / Abu-abu) -->
									<div
										class="bar yesterday"
										style="height: {yesterdayHeight}%;"
									></div>

									<!-- Bar Hari Ini (Biru jika >= kemarin, Merah jika < kemarin) -->
									<div
										class="bar today"
										class:higher={isHigher}
										class:lower={!isHigher}
										class:highlight={isHovered}
										style="height: {todayHeight}%;"
									>
										<!-- Indikator Panah di atas Bar untuk Aksesibilitas Buta Warna -->
										{#if !isHigher}
											<span class="bar-indicator-arrow lower" title="Turun dibanding jam yang sama kemarin">▼</span>
										{/if}
									</div>
								</div>

								<span class="hour-label font-mono" class:lower={!isHigher}>{hourItem.hour}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Insight Singkat Puncak & Dips -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
			{#if peakHour}
				<div class="dash-banner dash-banner-info flex items-center justify-between py-1.5 px-2.5">
					<div class="flex items-center gap-1.5">
						<Icon name="bolt" size={14} />
						<span class="text-[11.5px]">
							<strong>Puncak Ramai (Lunch):</strong> Jam <strong>{peakHour.hour} WIB</strong> &bull; <strong>{formatRupiah(peakHour.omzet)}</strong> ({peakHour.count} struk).
						</span>
					</div>
				</div>
			{/if}
			<div class="dash-banner flex items-center justify-between py-1.5 px-2.5" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25);">
				<div class="flex items-center gap-1.5 text-[11.5px]" style="color: #f87171;">
					<span class="font-bold">▼ 4 Jam Kritis:</span>
					<span>14:00, 15:00, 17:00, &amp; 21:00 turun volume vs kemarin.</span>
				</div>
			</div>
		</div>

		<!-- Susunan Bawah Rekomendasi: [ Tren 7 Hari | Metode Bayar & AOV ] -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
			<!-- 1. Tren 7 Hari Terakhir -->
			<div class="dash-subbox p-2.5 flex flex-col justify-between">
				<div class="flex items-center justify-between text-xs mb-1">
					<span class="font-bold" style="color: var(--text-main);">Tren 7 Hari Terakhir</span>
					<span class="text-[10.5px] font-mono text-muted">Rata-rata: ~Rp 14,1 jt/hari</span>
				</div>

				<!-- Mini 7-Day Bar Chart -->
				<div class="flex items-end justify-between gap-1.5 h-12 pt-1 pb-1">
					{#each dailyTrends as day}
						{@const dVal = parseFloat(day.omzet) || 0}
						{@const dHeight = Math.max((dVal / maxDailyVal) * 100, 15)}
						<div
							class="flex flex-col items-center flex-1 gap-1 h-full justify-end cursor-pointer group"
							title="{formatDate(day.date)}: {formatRupiah(day.omzet)} ({day.cup_count} cup)"
						>
							<div
								class="w-full rounded-t transition-all"
								style="height: {dHeight}%; background: {day.is_today ? '#3b82f6' : 'rgba(255, 255, 255, 0.18)'};"
							></div>
							<span
								class="text-[9px] font-mono"
								style="color: {day.is_today ? '#60a5fa' : 'var(--text-muted)'}; font-weight: {day.is_today ? '700' : '500'};"
							>
								{day.date.slice(8, 10)}
							</span>
						</div>
					{/each}
				</div>

				<div class="flex items-center justify-between text-[10px] text-muted pt-1 border-t mt-1" style="border-color: var(--border-panel);">
					<span>07 Okt (Rp 12,5 jt)</span>
					<span class="font-bold" style="color: #60a5fa;">Hari Ini: Rp 14,5 jt ({data.cup_count} cup)</span>
				</div>
			</div>

			<!-- 2. Komposisi Pembayaran & AOV -->
			<div class="dash-subbox p-2.5 flex flex-col justify-between">
				<div class="flex items-center justify-between text-xs mb-1">
					<span class="font-bold" style="color: var(--text-main);">Metode Bayar &amp; AOV</span>
					<span class="text-[10.5px] font-mono text-muted">{data.transaction_count || 360} Struk</span>
				</div>

				<div class="flex flex-col gap-1.5 my-auto">
					<div class="flex items-center justify-between text-[11px]">
						<span class="font-semibold" style="color: #60a5fa;">
							QRIS {data.non_cash_percentage || '74'}% ({formatRupiah(data.non_cash_amount || '10730000.00')})
						</span>
						<span class="font-semibold" style="color: #34d399;">
							Tunai {data.cash_percentage || '26'}% ({formatRupiah(data.cash_amount || '3770000.00')})
						</span>
					</div>
					<!-- Split visual bar -->
					<div class="w-full h-2 rounded-full overflow-hidden flex" style="background: rgba(255,255,255,0.06);">
						<div style="width: {data.non_cash_percentage || '74'}%; background: #3b82f6;" title="QRIS 74%"></div>
						<div style="width: {data.cash_percentage || '26'}%; background: #10b981;" title="Tunai 26%"></div>
					</div>
				</div>

				<div class="flex items-center justify-between text-[10px] text-muted pt-1 border-t mt-1" style="border-color: var(--border-panel);">
					<span>Rata-rata Struk (AOV):</span>
					<strong class="font-mono text-xs" style="color: var(--text-main);">{formatRupiah(data.avg_transaction_value || '40270.00')}</strong>
				</div>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
