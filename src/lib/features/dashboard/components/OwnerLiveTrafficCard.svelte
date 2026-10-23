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
	import { formatRupiah, formatDate, formatNumber } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SalesSummaryCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const data = $derived(cardState.data);

	// Mode Tampilan Grafik Utama: 'hourly' (Jam per Jam) atau 'daily' (Tren 7 Hari)
	let chartMode = $state<'hourly' | 'daily'>('hourly');

	// State interaksi hover untuk mode Jam per Jam
	let hoveredHourIndex = $state<number | null>(null);
	let barsContainerEl = $state<HTMLDivElement | null>(null);
	let tooltipStyle = $state<string>('');
	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

	// State interaksi hover untuk mode Tren 7 Hari
	let hoveredDayIndex = $state<number | null>(null);
	let dailyBarsContainerEl = $state<HTMLDivElement | null>(null);
	let dailyTooltipStyle = $state<string>('');
	let dailyHoverTimer: ReturnType<typeof setTimeout> | null = null;

	const hourlyTraffic = $derived(data?.hourly_traffic || []);
	const dailyTrends = $derived(data?.daily_trends || []);
	const hoveredItem = $derived(hoveredHourIndex !== null ? hourlyTraffic[hoveredHourIndex] : null);
	const hoveredDayItem = $derived(hoveredDayIndex !== null ? dailyTrends[hoveredDayIndex] : null);

	const total7DaysOmzet = $derived(
		dailyTrends.reduce((acc, curr) => acc + (parseFloat(curr.omzet) || 0), 0)
	);
	const avg7DaysOmzet = $derived(
		dailyTrends.length > 0 ? total7DaysOmzet / dailyTrends.length : 14100000
	);

	function getIndonesianDayName(dateStr: string): string {
		const d = new Date(dateStr);
		const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
		return days[d.getDay()] || '';
	}

	function setHovered(idx: number | null) {
		if (hoverTimer) {
			clearTimeout(hoverTimer);
			hoverTimer = null;
		}
		if (idx !== null) {
			hoveredHourIndex = idx;
			updateTooltipPosition(idx);
		} else {
			// Debounce 60ms agar geser antar batang jam berdekatan tidak berkedip/glitch
			hoverTimer = setTimeout(() => {
				hoveredHourIndex = null;
			}, 60);
		}
	}

	function updateTooltipPosition(idx: number) {
		if (!barsContainerEl) return;
		const rect = barsContainerEl.getBoundingClientRect();
		const totalCols = hourlyTraffic.length || 14;
		const colWidth = rect.width / totalCols;
		const colCenterX = (idx + 0.5) * colWidth;

		let transformX = '-50%';
		let leftPos = colCenterX;

		if (idx <= 2) {
			leftPos = Math.max(6, idx * colWidth);
			transformX = '0%';
		} else if (idx >= totalCols - 3) {
			leftPos = Math.min(rect.width - 6, (idx + 1) * colWidth);
			transformX = '-100%';
		}

		tooltipStyle = `left: ${leftPos}px; transform: translateX(${transformX});`;
	}

	function setHoveredDay(idx: number | null) {
		if (dailyHoverTimer) {
			clearTimeout(dailyHoverTimer);
			dailyHoverTimer = null;
		}
		if (idx !== null) {
			hoveredDayIndex = idx;
			updateDailyTooltipPosition(idx);
		} else {
			dailyHoverTimer = setTimeout(() => {
				hoveredDayIndex = null;
			}, 60);
		}
	}

	function updateDailyTooltipPosition(idx: number) {
		if (!dailyBarsContainerEl) return;
		const rect = dailyBarsContainerEl.getBoundingClientRect();
		const totalCols = dailyTrends.length || 7;
		const colWidth = rect.width / totalCols;
		const colCenterX = (idx + 0.5) * colWidth;

		let transformX = '-50%';
		let leftPos = colCenterX;

		if (idx <= 1) {
			leftPos = Math.max(8, idx * colWidth);
			transformX = '0%';
		} else if (idx >= totalCols - 2) {
			leftPos = Math.min(rect.width - 8, (idx + 1) * colWidth);
			transformX = '-100%';
		}

		dailyTooltipStyle = `left: ${leftPos}px; transform: translateX(${transformX});`;
	}

	// Hitung nilai maksimum omzet per jam untuk normalisasi tinggi grafik
	const maxHourlyVal = $derived.by(() => {
		if (hourlyTraffic.length === 0) return 2000000;
		const maxToday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.omzet) || 0));
		const maxYesterday = Math.max(...hourlyTraffic.map((h) => parseFloat(h.yesterday_omzet || '0') || 0));
		return Math.max(maxToday, maxYesterday, 1000000);
	});

	// Hitung nilai maksimum omzet harian untuk tren 7 hari (skala sumbu Y: max 18 jt)
	const maxDailyVal = $derived.by(() => {
		if (dailyTrends.length === 0) return 18000000;
		return Math.max(...dailyTrends.map((d) => parseFloat(d.omzet) || 0), 18000000);
	});

	// Komparasi Pendapatan Sekarang vs Pendapatan Kemarin
	const todayOmzetNum = $derived(parseFloat(data?.omzet || '0'));
	const yesterdayOmzetNum = $derived(parseFloat(data?.yesterday_omzet || '0'));
	const diffOmzet = $derived(todayOmzetNum - yesterdayOmzetNum);
	const diffPct = $derived(yesterdayOmzetNum > 0 ? ((diffOmzet / yesterdayOmzetNum) * 100).toFixed(1) : '0.0');
	const isHigher = $derived(diffOmzet >= 0);


	// Temukan hari puncak keramaian 7 hari
	const peakDay = $derived.by(() => {
		if (dailyTrends.length === 0) return null;
		let maxItem = dailyTrends[0];
		let maxVal = parseFloat(maxItem.omzet) || 0;
		for (const item of dailyTrends) {
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
	title={chartMode === 'hourly' ? "Penjualan: Hari Ini vs Kemarin" : "Penjualan: Tren 7 Hari Terakhir"}
	icon="chart-bar"
	subtitle=""
	badgeText={chartMode === 'hourly' 
		? (data?.lfl_trend_pct ? `▲ +${data.lfl_trend_pct}% LFL (s/d 21:00)` : data?.trend_vs_previous_pct ? `▲ ${data.trend_vs_previous_pct}% Lebih Ramai` : 'Live')
		: `Total 7 Hari: Rp ${formatNumber(total7DaysOmzet / 1000000, 1, 1)} jt`}
	badgeVariant="info"
	drilldownUrl="/reports"
	drilldownLabel="Laporan Penjualan Lengkap"
	colSpan="col-12 col-lg-7"
>
	{#if data}
		<!-- Toolbar Mode Switcher & Legenda Warna (Aksesibilitas Tinggi) -->
		<div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
			<!-- Switcher Tabs: Jam per Jam vs Tren 7 Hari -->
			<div class="chart-mode-tabs" role="tablist" aria-label="Pilih visualisasi grafik">
				<button
					type="button"
					role="tab"
					aria-selected={chartMode === 'hourly'}
					class="chart-tab-btn"
					class:is-active={chartMode === 'hourly'}
					onclick={() => (chartMode = 'hourly')}
				>
					<Icon name="clock" size={13} />
					<span>Jam per Jam</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={chartMode === 'daily'}
					class="chart-tab-btn"
					class:is-active={chartMode === 'daily'}
					onclick={() => (chartMode = 'daily')}
				>
					<Icon name="calendar" size={13} />
					<span>Tren 7 Hari</span>
				</button>
			</div>

			<!-- Legenda Warna Dinamis Sesuai Mode Aktif -->
			<div class="flex items-center gap-3 text-xs flex-wrap">
				{#if chartMode === 'hourly'}
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
				{:else}
					<div class="flex items-center gap-1.5" title="Realisasi omzet hari ini (13 Okt)">
						<span class="legend-box higher"></span>
						<span style="color: var(--text-main); font-weight: 600;">Hari Ini (13 Okt)</span>
					</div>
					<div class="flex items-center gap-1.5" title="Realisasi omzet 6 hari sebelumnya">
						<span class="legend-box" style="background: rgba(59, 130, 246, 0.55);"></span>
						<span style="color: var(--text-muted); font-weight: 500;">6 Hari Sebelumnya</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- 1. Tampilan Grafik Utama (Switchable: Jam per Jam / Tren 7 Hari) -->
		<div class="hourly-chart-box">
			{#if chartMode === 'hourly'}
				<!-- Mode 1: Komparasi Jam per Jam (08:00 - 21:00 WIB) -->
				<div class="hourly-grid-wrap animate-fadeIn">
					<!-- Sumbu Y -->
					<div class="hourly-y-axis" aria-hidden="true">
						<span class="y-axis-label">Rp 2,0 jt</span>
						<span class="y-axis-label">Rp 1,5 jt</span>
						<span class="y-axis-label">Rp 1,0 jt</span>
						<span class="y-axis-label">Rp 0,5 jt</span>
						<span class="y-axis-label">Rp 0</span>
					</div>

					<!-- Viewport Batang Grafik Jam per Jam -->
					<div class="hourly-viewport">
						<!-- Floating Glitch-Free Tooltip (Hanya Tampil Saat Hover) -->
						{#if hoveredItem && hoveredHourIndex !== null}
							{@const hToday = parseFloat(hoveredItem.omzet) || 0}
							{@const hYest = parseFloat(hoveredItem.yesterday_omzet || '0') || 0}
							{@const hDiff = hToday - hYest}
							{@const hIsHigher = hDiff >= 0}
							{@const hPct = hYest > 0 ? ((hDiff / hYest) * 100).toFixed(1) : '0'}

							<div
								class="hourly-floating-tooltip animate-fadeIn"
								style={tooltipStyle}
							>
								<div class="tooltip-top-row">
									<span class="tooltip-hour font-mono">
										Jam {hoveredItem.hour} WIB
									</span>
									<span class="tooltip-diff-badge" class:lower={!hIsHigher}>
										{hIsHigher ? `▲ +${formatRupiah(hDiff)} (+${hPct}%)` : `▼ ${formatRupiah(hDiff)} (${hPct}%)`}
									</span>
								</div>

								<div class="tooltip-details-grid">
									<div class="tooltip-metric-item">
										<span class="metric-dot today"></span>
										<span class="metric-lbl">Hari Ini:</span>
										<strong class="metric-val today">{formatRupiah(hoveredItem.omzet)}</strong>
										<span class="metric-cnt">({hoveredItem.count} item)</span>
									</div>
									<div class="tooltip-metric-item">
										<span class="metric-dot yesterday"></span>
										<span class="metric-lbl">Kemarin:</span>
										<strong class="metric-val yesterday">{formatRupiah(hoveredItem.yesterday_omzet || '0')}</strong>
										<span class="metric-cnt">({hoveredItem.yesterday_count || 0} item)</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- Garis Bantu Horizontal (Dashed Gridlines) -->
						<div class="chart-grid-lines" aria-hidden="true">
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
						</div>

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="hourly-bars-container"
							role="group"
							aria-label="Grafik perbandingan transaksi jam per jam"
							bind:this={barsContainerEl}
							onmouseleave={() => setHovered(null)}
						>
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
									class:is-hovered={isHovered}
									onmouseenter={() => setHovered(idx)}
									onmouseleave={() => setHovered(null)}
									onclick={() => setHovered(idx)}
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
			{:else}
				<!-- Mode 2: Tren 7 Hari Terakhir (Skala Harian Penuh) -->
				<div class="hourly-grid-wrap animate-fadeIn">
					<!-- Sumbu Y -->
					<div class="hourly-y-axis" aria-hidden="true">
						<span class="y-axis-label">Rp 18 jt</span>
						<span class="y-axis-label">Rp 13,5 jt</span>
						<span class="y-axis-label">Rp 9,0 jt</span>
						<span class="y-axis-label">Rp 4,5 jt</span>
						<span class="y-axis-label">Rp 0</span>
					</div>

					<!-- Viewport Batang Grafik Harian -->
					<div class="hourly-viewport">
						<!-- Floating Glitch-Free Tooltip (Harian) -->
						{#if hoveredDayItem && hoveredDayIndex !== null}
							{@const dOmzet = parseFloat(hoveredDayItem.omzet) || 0}
							{@const dDiff = dOmzet - avg7DaysOmzet}
							{@const dIsHigher = dDiff >= 0}
							{@const dPct = avg7DaysOmzet > 0 ? ((dDiff / avg7DaysOmzet) * 100).toFixed(1) : '0'}

							<div
								class="hourly-floating-tooltip animate-fadeIn"
								style={dailyTooltipStyle}
							>
								<div class="tooltip-top-row">
									<span class="tooltip-hour font-mono">
										{formatDate(hoveredDayItem.date)} ({getIndonesianDayName(hoveredDayItem.date)})
									</span>
									<span class="tooltip-diff-badge" class:lower={!dIsHigher}>
										{dIsHigher ? `▲ +${formatRupiah(dDiff)} (+${dPct}% vs Rata-rata)` : `▼ ${formatRupiah(dDiff)} (${dPct}% vs Rata-rata)`}
									</span>
								</div>

								<div class="tooltip-details-grid">
									<div class="tooltip-metric-item">
										<span class="metric-dot today"></span>
										<span class="metric-lbl">Total Omzet:</span>
										<strong class="metric-val today">{formatRupiah(hoveredDayItem.omzet)}</strong>
									</div>
									<div class="tooltip-metric-item">
										<span class="metric-dot yesterday"></span>
										<span class="metric-lbl">Volume Penjualan:</span>
										<strong class="metric-val yesterday">{hoveredDayItem.cup_count} cup / item</strong>
										<span class="metric-cnt">{(dOmzet / total7DaysOmzet * 100).toFixed(1)}% mingguan</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- Garis Bantu Horizontal (Dashed Gridlines) -->
						<div class="chart-grid-lines" aria-hidden="true">
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
							<div class="grid-line"></div>
						</div>

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="daily-bars-container"
							role="group"
							aria-label="Grafik tren omzet 7 hari terakhir"
							bind:this={dailyBarsContainerEl}
							onmouseleave={() => setHoveredDay(null)}
						>
							{#each dailyTrends as dayItem, idx}
								{@const dVal = parseFloat(dayItem.omzet) || 0}
								{@const dHeight = Math.max((dVal / maxDailyVal) * 100, 10)}
								{@const isHovered = hoveredDayIndex === idx}

								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<div
									class="daily-col"
									class:is-hovered={isHovered}
									onmouseenter={() => setHoveredDay(idx)}
									onmouseleave={() => setHoveredDay(null)}
									onclick={() => setHoveredDay(idx)}
								>
									<div class="daily-bar-wrap">
										<div
											class="daily-bar"
											class:is-today={dayItem.is_today}
											style="height: {dHeight}%;"
										>
											{#if dayItem.is_today}
												<span class="daily-bar-badge">Hari Ini</span>
											{/if}
										</div>
									</div>

									<div class="daily-label font-mono">
										<span>{dayItem.date.slice(8, 10)} Okt</span>
										<span class="day-name">({getIndonesianDayName(dayItem.date)})</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Ringkasan Perbandingan (Teks Bersih Tanpa Kotak) -->
		<div class="flex items-center justify-between flex-wrap gap-3 py-2 px-1 text-xs mt-1">
			{#if chartMode === 'hourly'}
				<div class="flex items-center gap-2">
					<Icon name="banknotes" size={14} class="text-muted" />
					<span>
						<span class="text-muted">Pendapatan Sekarang:</span>
						<strong class="text-main font-bold ml-1">{data ? formatRupiah(data.omzet) : 'Rp 0'}</strong>
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Icon name={isHigher ? 'trending-up' : 'trending-down'} size={14} class={isHigher ? 'text-emerald-500' : 'text-rose-500'} />
					<span>
						<span class="text-muted">Pendapatan Kemarin:</span>
						<strong class="text-main font-bold ml-1">{data?.yesterday_omzet ? formatRupiah(data.yesterday_omzet) : 'Rp 0'}</strong>
						<span class="font-bold ml-1.5 {isHigher ? 'text-emerald-500' : 'text-rose-500'}" style="font-variant-numeric: tabular-nums;">
							({diffOmzet >= 0 ? '+' : '-'}{formatRupiah(Math.abs(diffOmzet))} &bull; {diffOmzet >= 0 ? '+' : ''}{diffPct}%)
						</span>
					</span>
				</div>
			{:else}
				{#if peakDay}
					<div class="flex items-center gap-2">
						<Icon name="bolt" size={14} class="text-amber-500" />
						<span class="text-xs">
							<span class="text-muted">Puncak Mingguan:</span> <strong class="text-main">{formatDate(peakDay.date)} ({getIndonesianDayName(peakDay.date)})</strong> &bull; <strong class="text-main">{formatRupiah(peakDay.omzet)}</strong> ({peakDay.cup_count} cup)
						</span>
					</div>
				{/if}
				<div class="flex items-center gap-2 text-xs">
					<span class="text-muted">Rata-rata 7 Hari:</span>
					<strong class="text-main">~Rp {formatNumber(avg7DaysOmzet / 1000000, 1, 1)} jt/hari</strong>
					<span class="text-muted">&bull; Total:</span>
					<strong class="text-main">Rp {formatNumber(total7DaysOmzet / 1000000, 1, 1)} jt</strong>
				</div>
			{/if}
		</div>

		<!-- Komposisi Pembayaran & AOV (Pembatas Garis Tipis Sederhana) -->
		<div class="pt-3.5 mt-2 border-t flex flex-col justify-between" style="border-color: rgba(255, 255, 255, 0.06);">
			<div class="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-2">
				<div class="flex items-center gap-2">
					<span class="font-bold text-[13px]" style="color: var(--text-main);">Metode Pembayaran</span>
					<span class="text-xs text-muted">(Total: <strong style="color: var(--text-main); font-variant-numeric: tabular-nums;">{data.transaction_count || 360} Struk</strong>)</span>
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted">
					<span>Rata-rata Struk (AOV):</span>
					<strong class="font-bold text-xs" style="color: var(--text-main); font-variant-numeric: tabular-nums;">{formatRupiah(data.avg_transaction_value || '40270.00')}</strong>
				</div>
			</div>

			<div class="flex flex-col gap-1.5 my-1">
				<div class="flex items-center justify-between text-[11.5px] flex-wrap gap-1">
					<span class="font-semibold flex items-center gap-1.5" style="color: var(--pill-info-text);">
						<span class="w-2 h-2 rounded-full inline-block" style="background: #3b82f6;"></span>
						QRIS &bull; {data.non_cash_percentage || '74'}% ({formatRupiah(data.non_cash_amount || '10730000.00')})
					</span>
					<span class="font-semibold flex items-center gap-1.5" style="color: var(--pill-success-text);">
						<span class="w-2 h-2 rounded-full inline-block" style="background: var(--brand-primary, #10b981);"></span>
						Tunai &bull; {data.cash_percentage || '26'}% ({formatRupiah(data.cash_amount || '3770000.00')})
					</span>
				</div>
				<!-- Split visual bar -->
				<div class="w-full h-2 rounded-full overflow-hidden flex" style="background: var(--bg-panel-sub); border: 1px solid var(--border-subtle);">
					<div style="width: {data.non_cash_percentage || '74'}%; background: #3b82f6;" title="QRIS 74%"></div>
					<div style="width: {data.cash_percentage || '26'}%; background: var(--brand-primary, #10b981);" title="Tunai 26%"></div>
				</div>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
