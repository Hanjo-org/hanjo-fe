<script lang="ts">
	/**
	 * BrandPulseStrip.svelte
	 * Baris 1 KPI Brand:
	 * 1. Omzet brand hari ini (LFL vs kemarin & vs target brand)
	 * 2. Outlet butuh perhatian (2 dari 3 outlet + alasan singkat)
	 * 3. Food cost % (estimasi) vs target brand
	 * 4. Kas kecil gabungan (terpakai hari ini vs total batas harian)
	 */
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Badge from '../../../components/data/Badge.svelte';

	interface Props {
		onSelectOutletAlert?: (outletName: string) => void;
	}

	let { onSelectOutletAlert }: Props = $props();

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
</script>

<div class="col-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-1">
	<!-- 1. Omzet Brand Hari Ini -->
	<div class="pulse-card">
		<div class="pulse-card-header">
			<span class="pulse-label">Omzet Brand Hari Ini</span>
			<span
				class="text-[11px] font-bold px-2 py-0.5 rounded"
				style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25);"
			>
				▲ {brandMetrics.lfl_growth}% LFL
			</span>
		</div>
		<div class="pulse-hero-val font-mono">
			{formatRupiah(brandMetrics.omzet)}
		</div>
		<div class="pulse-subline flex items-center justify-between text-xs pt-1 border-t" style="border-color: var(--border-panel);">
			<span style="color: var(--text-muted);">Target: {formatRupiah(brandMetrics.target_omzet)}</span>
			<strong style="color: #60a5fa;">{brandMetrics.target_pct}% Tercapai</strong>
		</div>
	</div>

	<!-- 2. Outlet Butuh Perhatian -->
	<div class="pulse-card" style="border-left: 3px solid #f59e0b;">
		<div class="pulse-card-header">
			<span class="pulse-label">Outlet Butuh Perhatian</span>
			<Badge variant="warning" text="Perlu Tindakan" size="sm" />
		</div>
		<div class="pulse-hero-val font-mono flex items-center gap-2" style="color: #fbbf24;">
			<Icon name="exclamation-triangle" size={20} />
			<span>{brandMetrics.issues_count} dari {brandMetrics.total_outlets} Gerai</span>
		</div>
		<div class="pulse-subline flex flex-col gap-0.5 text-[11px] pt-1 border-t" style="border-color: var(--border-panel);">
			<button
				type="button"
				class="text-left hover:underline flex items-center justify-between cursor-pointer"
				style="color: var(--text-muted);"
				onclick={() => onSelectOutletAlert?.('Jodi Dago')}
			>
				<span>&bull; <strong>Jodi Dago:</strong> 1 Stok Kritis (Fresh Milk)</span>
				<span class="text-primary">&rarr;</span>
			</button>
			<button
				type="button"
				class="text-left hover:underline flex items-center justify-between cursor-pointer"
				style="color: var(--text-muted);"
				onclick={() => onSelectOutletAlert?.('Jodi Gubeng')}
			>
				<span>&bull; <strong>Jodi Gubeng:</strong> POS Delay 15m &amp; Low Omzet</span>
				<span class="text-primary">&rarr;</span>
			</button>
		</div>
	</div>

	<!-- 3. Food Cost % (Estimasi) vs Target Brand -->
	<div class="pulse-card">
		<div class="pulse-card-header">
			<div class="flex items-center gap-1.5">
				<span class="pulse-label">Food Cost %</span>
				<span
					class="text-[9.5px] font-bold px-1.5 py-0.2 rounded font-mono"
					style="background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25);"
					title="Estimasi sementara karena menunggu verifikasi nota supplier oleh Finance HQ"
				>
					~Estimasi
				</span>
			</div>
			<Badge variant="success" text="Efisien" size="sm" />
		</div>
		<div class="pulse-hero-val font-mono flex items-baseline gap-2">
			<span>{brandMetrics.food_cost_pct}%</span>
			<span class="text-xs font-normal" style="color: var(--text-muted);">
				Target Brand: &le; {brandMetrics.target_food_cost_pct}%
			</span>
		</div>
		<div class="pulse-subline text-[10.5px] pt-1 border-t truncate" style="border-color: var(--border-panel); color: var(--text-muted);">
			Pending <strong>{brandMetrics.true_up_pending_count} nota True-Up</strong> di Finance HQ
		</div>
	</div>

	<!-- 4. Kas Kecil Gabungan Brand -->
	<div class="pulse-card">
		<div class="pulse-card-header">
			<span class="pulse-label">Kas Kecil Gabungan</span>
			<span class="text-xs font-mono font-bold" style="color: #34d399;">
				{brandMetrics.petty_cash_pct}% Terpakai
			</span>
		</div>
		<div class="pulse-hero-val font-mono">
			{formatRupiah(brandMetrics.petty_cash_spent)}
			<span class="text-xs font-normal" style="color: var(--text-muted);">
				/ {formatRupiah(brandMetrics.petty_cash_limit)}
			</span>
		</div>
		<div class="pulse-subline flex items-center justify-between text-[11px] pt-1 border-t" style="border-color: var(--border-panel);">
			<span style="color: #fbbf24;">{brandMetrics.warning_outlet} terpakai 50%</span>
			<span style="color: var(--text-subtle);">Senopati &amp; Gubeng aman</span>
		</div>
	</div>
</div>
