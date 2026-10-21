<script lang="ts">
	/**
	 * OwnerTopProductsCard.svelte
	 * Top 5 Menu & Produk Terlaris Hari Ini
	 * Menampilkan 5 menu dengan kontribusi omzet tertinggi, jumlah cup, dan gross margin %
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';

	// Data Top 5 Produk Hari Ini (Total: 672 cup/item • Rp 14.500.000 omzet)
	const topProducts = [
		{ name: 'Kopi Susu Gula Aren', category: 'Signature Coffee', count: 218, unit: 'cup', omzet: '4796000.00', pct: 33.1, margin: 71 },
		{ name: 'Creamy Latte', category: 'Milk Based', count: 142, unit: 'cup', omzet: '3976000.00', pct: 27.4, margin: 69 },
		{ name: 'Cold Brew Signature', category: 'Manual Brew', count: 98, unit: 'cup', omzet: '2450000.00', pct: 16.9, margin: 74 },
		{ name: 'Matcha Espresso Fusion', category: 'Specialty Drink', count: 76, unit: 'cup', omzet: '2128000.00', pct: 14.7, margin: 66 },
		{ name: 'Butter Croissant', category: 'Bakery & Pastry', count: 58, unit: 'pcs', omzet: '1150000.00', pct: 7.9, margin: 62 }
	];
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	customContent={true}
	title="Top 5 Menu Terlaris"
	icon="fire"
	subtitle="Kontribusi produk terhadap total omzet Rp 14,5 jt hari ini"
	badgeText="672 Cup Terjual"
	badgeVariant="success"
	drilldownUrl="/reports"
	drilldownLabel="Analisis Menu & Margin"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2">
		{#each topProducts as prod, idx}
			<div class="dash-subbox p-2.5 flex flex-col gap-1.5">
				<div class="flex items-center justify-between text-xs">
					<div class="flex items-center gap-2">
						<span class="rank-badge rank-{idx + 1}">
							{idx + 1}
						</span>
						<div>
							<div class="font-bold text-xs" style="color: var(--text-main);">{prod.name}</div>
							<div class="text-[10px]" style="color: var(--text-muted);">
								{prod.category} &bull; <strong style="color: var(--text-main);">{prod.count} {prod.unit}</strong>
							</div>
						</div>
					</div>

					<div class="text-right">
						<div class="font-bold text-xs" style="color: var(--text-main); font-variant-numeric: tabular-nums;">{formatRupiah(prod.omzet)}</div>
						<span
							class="text-[9.5px] font-semibold px-1.5 py-0.5 rounded"
							style="background: var(--pill-success-bg); color: var(--pill-success-text); border: 1px solid var(--pill-success-border);"
							title="Margin Laba Kotor Produk"
						>
							Margin {prod.margin}%
						</span>
					</div>
				</div>

				<!-- Progress bar kontribusi terhadap total omzet -->
				<div class="flex items-center gap-2">
					<div class="mini-leaderboard-bar-bg flex-1" title="{prod.pct}% dari total omzet hari ini">
						<div
							class="mini-leaderboard-bar-fill"
							style="width: {prod.pct}%;"
						></div>
					</div>
					<span class="text-[10px] font-semibold" style="color: var(--text-muted); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums;">
						{prod.pct}%
					</span>
				</div>
			</div>
		{/each}
	</div>
</DashboardCardFrame>
