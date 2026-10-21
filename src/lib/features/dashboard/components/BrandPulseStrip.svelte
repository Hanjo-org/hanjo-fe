<script lang="ts">
	/**
	 * BrandPulseStrip.svelte
	 * Baris 1 KPI Brand:
	 * 1. Omzet brand hari ini (LFL vs kemarin & vs target brand)
	 * 2. Outlet butuh perhatian (2 dari 3 outlet + alasan singkat)
	 * 3. Food cost % (estimasi) vs target brand
	 * 4. Kas kecil gabungan (terpakai hari ini vs total batas harian)
	 */
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SalesSummaryCardData } from '../../../api/contract/types.js';

	interface Props {
		onSelectOutletAlert?: (outletName: string) => void;
	}

	let { onSelectOutletAlert }: Props = $props();

	const salesState = $derived(dashboardStore.getCardState<SalesSummaryCardData>('sales_summary'));
	const salesData = $derived(salesState.data);

	// KPI Data Brand: Seduhan Kopi Jodi (Konsolidasi 3 Gerai s/d 21:00 WIB)
	const brandMetrics = {
		omzet: '8450000.00',
		target_omzet: '8500000.00',
		target_pct: '99.4',
		lfl_growth: '+16.8',
		yesterday_lfl: '7230000.00',
		total_outlets: 3,
		issues_count: 2,
		food_cost_pct: '31.4',
		target_food_cost_pct: '32.0',
		true_up_pending_count: 2,
		petty_cash_spent: '330000.00',
		petty_cash_limit: '850000.00',
		petty_cash_pct: 38.8,
		warning_outlet: 'Jodi Dago'
	};

	const currentOmzet = $derived(salesData?.omzet || brandMetrics.omzet);
</script>

<div class="owner-pulse-grid col-12">
	<!-- 1. Omzet Brand Hari Ini -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge brand">
				<Icon name="banknotes" size={18} />
			</div>
			<div class="pulse-trend-text success" title="Perbandingan LFL terhadap kemarin">
				<Icon name="arrow-trending-up" size={14} />
				<span>{brandMetrics.lfl_growth}% LFL</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Omzet Brand Hari Ini</span>
			<div class="pulse-main-val font-mono">
				{formatRupiah(currentOmzet)}
			</div>
			<div class="pulse-subtext">
				<span>Target: <strong>{formatRupiah(brandMetrics.target_omzet)}</strong></span>
				<span class="pulse-subtag">{brandMetrics.target_pct}% Tercapai</span>
			</div>
		</div>
	</div>

	<!-- 2. Outlet Butuh Perhatian -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge warning">
				<Icon name="exclamation-triangle" size={18} />
			</div>
			<div class="pulse-trend-text warning">
				<Icon name="bell-alert" size={14} />
				<span>{brandMetrics.issues_count} dari {brandMetrics.total_outlets} Gerai</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Outlet Butuh Perhatian</span>
			<div class="pulse-main-val font-mono flex items-center gap-2" style="color: var(--pill-warning-text);">
				<span>{brandMetrics.issues_count} Gerai Alert</span>
			</div>
			<div class="pulse-subtext flex flex-col gap-1 items-stretch">
				<button
					type="button"
					class="text-left hover:underline flex items-center justify-between cursor-pointer py-0.5"
					style="color: var(--text-muted);"
					onclick={() => onSelectOutletAlert?.('Jodi Dago')}
				>
					<span><strong>Jodi Dago:</strong> 1 Stok Kritis</span>
					<span class="pulse-subtag">Periksa</span>
				</button>
			</div>
		</div>
	</div>

	<!-- 3. Food Cost % (Estimasi) vs Target Brand -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge info">
				<Icon name="chart-pie" size={18} />
			</div>
			<div class="pulse-trend-text success">
				<Icon name="check-circle" size={14} />
				<span>Target &le; {brandMetrics.target_food_cost_pct}%</span>
			</div>
		</div>

		<div class="pulse-content">
			<div class="flex items-center gap-1.5">
				<span class="pulse-label">Food Cost %</span>
				<span
					class="text-[9.5px] font-bold px-1.5 py-0.5 rounded font-mono"
					style="background: var(--pill-info-bg); color: var(--pill-info-text); border: 1px solid var(--pill-info-border);"
					title="Estimasi sementara karena menunggu verifikasi nota supplier oleh Finance HQ"
				>
					~Estimasi
				</span>
			</div>
			<div class="pulse-main-val font-mono">
				{brandMetrics.food_cost_pct}%
			</div>
			<div class="pulse-subtext">
				<span>Pending <strong>{brandMetrics.true_up_pending_count} nota True-Up</strong> di HQ</span>
			</div>
		</div>
	</div>

	<!-- 4. Kas Kecil Gabungan Brand -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="wallet" size={18} />
			</div>
			<div class="pulse-trend-text success">
				<Icon name="check" size={14} />
				<span>{brandMetrics.petty_cash_pct}% Terpakai</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Kas Kecil Gabungan Brand</span>
			<div class="pulse-main-val font-mono">
				{formatRupiah(brandMetrics.petty_cash_spent)}
			</div>
			<div class="pulse-subtext">
				<span>Batas: <strong>{formatRupiah(brandMetrics.petty_cash_limit)}</strong></span>
				<span class="pulse-subtag">{brandMetrics.warning_outlet} 50%</span>
			</div>
		</div>
	</div>
</div>
