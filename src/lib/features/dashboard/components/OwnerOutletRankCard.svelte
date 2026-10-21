<script lang="ts">
	/**
	 * OwnerOutletRankCard.svelte
	 * Ranking Kinerja 5 Gerai Hari Ini
	 * Menampilkan perbandingan omzet, persentase kontribusi, dan pertumbuhan vs kemarin
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';

	// Data Ranking 5 Outlet Hari Ini (Multi-Outlet Comparison s/d 21:00 WIB, Total: Rp 14.500.000)
	const outletRanking = [
		{ name: 'Jodi Senopati', city: 'Jakarta Selatan', omzet: '4820000.00', pct: 33.2, delta: '+19.2%', deltaHigher: true, cups: 238 },
		{ name: 'Kaveloka Ubud', city: 'Gianyar, Bali', omzet: '3200000.00', pct: 22.1, delta: '+14.5%', deltaHigher: true, cups: 145 },
		{ name: 'Plaga Farm Bistro', city: 'Badung, Bali', omzet: '2850000.00', pct: 19.7, delta: '+11.8%', deltaHigher: true, cups: 115 },
		{ name: 'Jodi Dago', city: 'Bandung', omzet: '2430000.00', pct: 16.8, delta: '+15.8%', deltaHigher: true, cups: 122 },
		{ name: 'Jodi Gubeng', city: 'Surabaya', omzet: '1200000.00', pct: 8.3, delta: '+12.1%', deltaHigher: true, cups: 52 }
	];
</script>

<DashboardCardFrame
	cardKey="outlet_comparison"
	customContent={true}
	title="Ranking Kinerja Gerai"
	icon="building-storefront"
	subtitle="Perbandingan kontribusi omzet & pertumbuhan 5 gerai s/d 21:00 WIB"
	badgeText="5 Gerai Aktif"
	badgeVariant="info"
	drilldownUrl="/outlets"
	drilldownLabel="Laporan Gerai Lengkap"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2">
		{#each outletRanking as r, idx}
			<div class="dash-subbox p-2.5 flex flex-col gap-1.5">
				<div class="flex items-center justify-between text-xs">
					<div class="flex items-center gap-2">
						<span class="rank-badge rank-{idx + 1}">
							{idx + 1}
						</span>
						<div>
							<div class="font-bold text-xs" style="color: var(--text-main);">{r.name}</div>
							<div class="text-[10px]" style="color: var(--text-muted);">{r.city} &bull; {r.cups} cup</div>
						</div>
					</div>
					<div class="text-right">
						<div class="font-bold text-xs" style="color: var(--text-main); font-variant-numeric: tabular-nums;">{formatRupiah(r.omzet)}</div>
						<div class="text-[10px] font-bold" style="color: {r.deltaHigher ? 'var(--pill-success-text)' : 'var(--pill-danger-text)'}; font-variant-numeric: tabular-nums;">
							{r.delta}
						</div>
					</div>
				</div>

				<!-- Progress bar share omzet -->
				<div class="flex items-center gap-2">
					<div class="mini-leaderboard-bar-bg flex-1" title="{r.pct}% kontribusi terhadap total omzet">
						<div class="mini-leaderboard-bar-fill" style="width: {r.pct}%;"></div>
					</div>
					<span class="text-[10px] font-semibold" style="color: var(--text-muted); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums;">{r.pct}%</span>
				</div>
			</div>
		{/each}
	</div>
</DashboardCardFrame>
