<script lang="ts">
	/**
	 * OwnerPulseStrip.svelte
	 * Ringkasan 4 Denyut Utama Bisnis Hari Ini (Live KPI Cockpit)
	 * Menjawab langsung: Live Omzet, Apakah lebih ramai/sepi vs kemarin, Estimasi Margin HPP, dan Kondisi Gerai.
	 */
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import type {
		SalesSummaryCardData,
		GrossProfitCardData,
		OutletOpsStatusCardData,
		OutletEodStatusCardData
	} from '../../../api/contract/types.js';

	const salesState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const gpState = $derived(dashboardStore.getCardState<GrossProfitCardData>('gross_profit'));
	const opsState = $derived(dashboardStore.getCardState<OutletOpsStatusCardData>('outlet_ops_status'));
	const eodState = $derived(dashboardStore.getCardState<OutletEodStatusCardData>('outlet_eod_status'));

	const sales = $derived(salesState.data);
	const gp = $derived(gpState.data);
	const ops = $derived(opsState.data);
	const eod = $derived(eodState.data);

	const isBusier = $derived(sales?.is_busier_than_yesterday ?? true);
	const trendPct = $derived(sales?.trend_vs_previous_pct || '+18.4');
	const yesterdayOmzet = $derived(sales?.yesterday_omzet || '8100000.00');

	// Metrik Transaksi & AOV (Universal untuk F&B Minuman + Makanan)
	const txCount = $derived(sales?.transaction_count ?? 220);
	const yesterdayTx = $derived(sales?.yesterday_transaction_count ?? 206);
	const txDiff = $derived(txCount - yesterdayTx);
</script>

<div class="owner-pulse-grid col-12">
	<!-- 1. Live Omzet & Komparasi Kemarin -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge brand">
				<Icon name="banknotes" size={18} />
			</div>
			<div class="pulse-trend-text {isBusier ? 'success' : 'danger'}" title="Perbandingan Like-for-Like (LFL) pada rentang jam yang sama (08:00 - 21:00 WIB)">
				<Icon name={isBusier ? 'trending-up' : 'clock'} size={14} />
				<span>{sales?.lfl_trend_pct ? `${sales.lfl_trend_pct}% LFL (s/d 21:00)` : `${trendPct}% Lebih Ramai`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Omzet Live Hari Ini (13 Okt)</span>
			<div class="pulse-main-val">
				{sales ? formatRupiah(sales.omzet) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Kemarin LFL: <strong>{sales?.lfl_yesterday_omzet ? formatRupiah(sales.lfl_yesterday_omzet) : formatRupiah(yesterdayOmzet)}</strong></span>
				<span class="dot-sep">•</span>
				<span>Full Kemarin: <strong>{formatRupiah(yesterdayOmzet)}</strong> ({sales?.full_day_trend_pct || '+4.7'}%)</span>
				<span class="dot-sep">•</span>
				<span>{sales?.non_cash_percentage || '74'}% QRIS</span>
			</div>
		</div>
	</div>

	<!-- 2. Total Transaksi (Struk / Pesanan) & AOV -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge info">
				<Icon name="shopping-cart" size={18} />
			</div>
			<div class="pulse-trend-text success">
				<Icon name="check" size={14} />
				<span>{txDiff >= 0 ? `+${txDiff} struk vs kemarin` : `${txDiff} struk vs kemarin`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Total Transaksi (Struk)</span>
			<div class="pulse-main-val">
				{txCount} <span class="pulse-unit">Struk</span>
			</div>
			<div class="pulse-subtext">
				<span>Rata-rata: <strong>{sales ? formatRupiah(sales.avg_transaction_value) : 'Rp 0'}</strong> / struk (AOV)</span>
				<span class="dot-sep">•</span>
				<span>{sales?.cup_count || 672} item terjual</span>
			</div>
		</div>
	</div>

	<!-- 3. Estimasi Laba Kotor & Margin -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="chart-pie" size={18} />
			</div>
			{#if gp?.is_estimate}
				<div class="pulse-trend-text warning" title="1 nota supplier belum diverifikasi/true-up, estimasi HPP dapat terkoreksi">
					<Icon name="receipt-percent" size={14} />
					<span>Estimasi (1 Nota Pending)</span>
				</div>
			{:else}
				<div class="pulse-trend-text success">
					<Icon name="check" size={14} />
					<span>HPP Final</span>
				</div>
			{/if}
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Laba Kotor (Estimasi HPP)</span>
			<div class="pulse-main-val">
				{gp ? formatRupiah(gp.gross_profit) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Margin: <strong style="color: var(--brand-primary);">~{gp ? gp.margin_pct : '68'}%</strong> <span class="text-[11px] text-muted">(Rentang 58% - 68%)</span></span>
				<span class="dot-sep">•</span>
				<span>HPP: {gp ? formatRupiah(gp.cogs_amount) : 'Rp 0'}</span>
			</div>
		</div>
	</div>

	<!-- 4. Kondisi Jaringan Gerai & EOD -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="signal" size={18} />
			</div>
			<div class="pulse-trend-text {ops && ops.online_count === ops.total_outlets ? 'success' : 'warning'}">
				<Icon name="check-circle" size={14} />
				<span>{ops && ops.online_count === ops.total_outlets ? 'Normal & Sinkron' : `${ops?.online_count || 0}/${ops?.total_outlets || 0} Online`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Status Jaringan Gerai</span>
			<div class="pulse-main-val">
				{ops ? `${ops.online_count}/${ops.total_outlets}` : '5/5'} <span class="pulse-unit">Online &amp; Aktif</span>
			</div>
			<div class="pulse-subtext">
				<span style="color: var(--text-main); font-weight: 500;">5 gerai operasional buka</span>
				<span class="dot-sep">•</span>
				<span>Tutup EOD mulai 22:00 WIB ({eod ? `${eod.completed_count}/${eod.total_count}` : '0/5'})</span>
			</div>
		</div>
	</div>
</div>
