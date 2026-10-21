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
		OutletOpsStatusCardData
	} from '../../../api/contract/types.js';

	const salesState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const gpState = $derived(dashboardStore.getCardState<GrossProfitCardData>('gross_profit'));
	const opsState = $derived(dashboardStore.getCardState<OutletOpsStatusCardData>('outlet_ops_status'));

	const sales = $derived(salesState.data);
	const gp = $derived(gpState.data);
	const ops = $derived(opsState.data);

	const yesterdayOmzet = $derived(sales?.yesterday_omzet || '8100000.00');

	// Komparasi hanya Full Kemarin (tanpa LFL)
	const omzetNum = $derived(Number(sales?.omzet ?? 0));
	const yesterdayOmzetNum = $derived(Number(yesterdayOmzet));
	const isHigherThanYesterday = $derived(omzetNum >= yesterdayOmzetNum);

	const fullDayTrendPct = $derived.by(() => {
		if (sales?.full_day_trend_pct) {
			const val = sales.full_day_trend_pct;
			return val.startsWith('+') || val.startsWith('-') ? val : `+${val}`;
		}
		if (yesterdayOmzetNum > 0) {
			const diff = ((omzetNum - yesterdayOmzetNum) / yesterdayOmzetNum) * 100;
			const sign = diff >= 0 ? '+' : '';
			return `${sign}${diff.toFixed(1)}`;
		}
		return '+0.0';
	});

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
			<div class="pulse-trend-text {isHigherThanYesterday ? 'success' : 'danger'}" title="Perbandingan terhadap total omzet kemarin penuh">
				<Icon name={isHigherThanYesterday ? 'trending-up' : 'trending-down'} size={14} />
				<span>{fullDayTrendPct}% vs Kemarin</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Omzet Hari Ini</span>
			<div class="pulse-main-val">
				{sales ? formatRupiah(sales.omzet) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Kemarin: <strong>{formatRupiah(yesterdayOmzet)}</strong></span>
				<span class="pulse-subtag">{sales?.non_cash_percentage || '74'}% QRIS</span>
			</div>
		</div>
	</div>

	<!-- 2. Total Transaksi -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge info">
				<Icon name="shopping-cart" size={18} />
			</div>
			<div class="pulse-trend-text {txDiff >= 0 ? 'success' : 'danger'}">
				<Icon name={txDiff >= 0 ? 'trending-up' : 'trending-down'} size={14} />
				<span>{txDiff >= 0 ? `+${txDiff} vs kemarin` : `${txDiff} vs kemarin`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Total Transaksi</span>
			<div class="pulse-main-val">
				{txCount} <span class="pulse-unit">Struk</span>
			</div>
			<div class="pulse-subtext">
				<span>Kemarin: <strong>{yesterdayTx} struk</strong></span>
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
				<div class="pulse-trend-text warning" title="1 nota supplier belum diverifikasi/true-up">
					<Icon name="receipt-percent" size={14} />
					<span>Estimasi HPP</span>
				</div>
			{:else}
				<div class="pulse-trend-text success">
					<Icon name="check" size={14} />
					<span>HPP Final</span>
				</div>
			{/if}
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Laba Kotor</span>
			<div class="pulse-main-val">
				{gp ? formatRupiah(gp.gross_profit) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Beban HPP: <strong>{gp ? formatRupiah(gp.cogs_amount) : 'Rp 0'}</strong></span>
			</div>
		</div>
	</div>

	<!-- 4. Jaringan Gerai -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="signal" size={18} />
			</div>
			<div class="pulse-trend-text {ops && ops.online_count === ops.total_outlets ? 'success' : 'warning'}">
				<Icon name="check-circle" size={14} />
				<span>{ops && ops.online_count === ops.total_outlets ? 'Semua Sinkron' : `${ops?.online_count || 0}/${ops?.total_outlets || 0} Online`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Jaringan Gerai</span>
			<div class="pulse-main-val">
				{ops ? `${ops.online_count}/${ops.total_outlets}` : '5/5'} <span class="pulse-unit">Online</span>
			</div>
			<div class="pulse-subtext">
				<span style="color: var(--text-main); font-weight: 500;">{ops ? ops.online_count : 5} gerai operasional aktif</span>
			</div>
		</div>
	</div>
</div>
