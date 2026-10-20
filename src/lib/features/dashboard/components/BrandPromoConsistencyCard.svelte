<script lang="ts">
	/**
	 * BrandPromoConsistencyCard.svelte
	 * Efektivitas Promo & Konsistensi Standar Operasional Brand
	 *
	 * 1. Efektivitas promo aktif per outlet & dampaknya ke omzet
	 * 2. Konsistensi standar (waktu saji vs standar 5 mnt, deviasi stok, dan waste)
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Badge from '../../../components/data/Badge.svelte';

	// Data Promo Aktif per Outlet
	const activePromos = [
		{ outlet: 'Jodi Senopati', promoName: 'Senin Semangat (20%)', claims: 48, lift: '+18.5% Omzet' },
		{ outlet: 'Jodi Dago', promoName: 'Student Deals (B1G1)', claims: 62, lift: '+22.0% Sore' }
	];

	// Konsistensi Standar Brand
	const consistencyMetrics = [
		{ outlet: 'Jodi Senopati', avgKds: '4.2 mnt', kdsDiff: '-0.8 mnt', wastePct: '0.8%', isDeviant: false },
		{ outlet: 'Jodi Dago', avgKds: '7.8 mnt', kdsDiff: '+2.8 mnt', wastePct: '1.4%', isDeviant: true },
		{ outlet: 'Jodi Gubeng', avgKds: '3.9 mnt', kdsDiff: '-1.1 mnt', wastePct: '1.8%', isDeviant: false }
	];
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	customContent={true}
	title="Promo & Konsistensi Brand"
	icon="tag"
	subtitle="Redemption voucher per gerai & deviasi standar waktu saji / waste"
	badgeText="2 Promo Aktif"
	badgeVariant="success"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2.5">
		<!-- 1. Efektivitas Promo per Outlet -->
		<div class="dash-subbox p-2.5 flex flex-col gap-1.5">
			<span class="text-xs font-bold" style="color: var(--text-main);">Voucher &amp; Promo Aktif Hari Ini:</span>
			<div class="flex flex-col gap-1.5">
				{#each activePromos as p}
					<div class="flex items-center justify-between text-[11px] p-1.5 rounded" style="background: rgba(0,0,0,0.12);">
						<div>
							<div class="font-bold text-xs" style="color: var(--text-main);">{p.promoName}</div>
							<div class="text-[10px]" style="color: var(--text-muted);">{p.outlet} &bull; {p.claims} klaim</div>
						</div>
						<span
							class="text-[10px] font-bold px-1.5 py-0.5 rounded"
							style="background: rgba(16, 185, 129, 0.12); color: #34d399;"
						>
							{p.lift}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 2. Konsistensi Operasional (Benchmark KDS 5.0 mnt) -->
		<div class="dash-subbox p-2.5 flex flex-col gap-1.5">
			<div class="flex items-center justify-between text-xs">
				<span class="font-bold" style="color: var(--text-main);">Konsistensi Standar Saji &amp; Waste:</span>
				<span class="text-[10px] text-muted">Standar: &le; 5.0 mnt</span>
			</div>

			<div class="flex flex-col gap-1">
				{#each consistencyMetrics as m}
					<div
						class="flex items-center justify-between text-xs p-1.5 rounded"
						style="background: {m.isDeviant ? 'rgba(245, 158, 11, 0.08)' : 'transparent'}; border-left: {m.isDeviant ? '2px solid #f59e0b' : 'none'};"
					>
						<div>
							<div class="font-semibold text-[11.5px]" style="color: var(--text-main);">{m.outlet}</div>
							<div class="text-[10px]" style="color: var(--text-muted);">Waste: {m.wastePct} (Avg Brand: 1.1%)</div>
						</div>
						<div class="text-right font-mono">
							<div class="font-bold text-xs" style="color: {m.isDeviant ? '#fbbf24' : '#34d399'};">
								{m.avgKds}
							</div>
							<div class="text-[9.5px] font-bold" style="color: {m.isDeviant ? '#f87171' : '#34d399'};">
								{m.kdsDiff} {m.isDeviant ? '(Menyimpang)' : '(Aman)'}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</DashboardCardFrame>
