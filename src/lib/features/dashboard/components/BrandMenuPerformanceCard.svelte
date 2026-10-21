<script lang="ts">
	/**
	 * BrandMenuPerformanceCard.svelte
	 * Performa Menu Brand (Menu Inti vs Menu Lokal Per Outlet)
	 *
	 * Menampilkan:
	 * - Top & Bottom produk brand
	 * - Perbandingan kontribusi Menu Inti Pusat (82%) vs Menu Inovasi Lokal Gerai (18%)
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';

	const topProducts = [
		{ name: 'Kopi Susu Jodi', type: 'core', typeLabel: 'Menu Inti', count: 140, omzet: '3080000.00', pct: 36.4 },
		{ name: 'Creamy Latte', type: 'core', typeLabel: 'Menu Inti', count: 88, omzet: '2464000.00', pct: 29.2 },
		{ name: 'Pandan Latte', type: 'local', typeLabel: 'Lokal Dago', count: 42, omzet: '1176000.00', pct: 13.9 }
	];

	const bottomProduct = { name: 'Manual Brew V60', count: 12, omzet: '336000.00', pct: 4.0, note: 'Peminat rendah di Gubeng' };
</script>

<DashboardCardFrame
	cardKey="sales_summary"
	customContent={true}
	title="Performa Menu: Inti vs Lokal"
	icon="star"
	subtitle="Analisis produk teratas, terbawah & kontribusi resep lokal antar gerai"
	badgeText="82% Menu Inti"
	badgeVariant="info"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2.5">
		<!-- 1. Rasio Menu Inti vs Menu Lokal Gerai -->
		<div class="dash-subbox p-2.5 flex flex-col gap-1.5">
			<div class="flex items-center justify-between text-xs">
				<span class="font-bold" style="color: var(--text-main);">Komposisi Resep Brand:</span>
				<span class="text-[10px] text-muted">Total: Rp 8.450.000</span>
			</div>

			<div class="flex items-center justify-between text-[11px]">
				<span class="font-semibold" style="color: var(--brand-primary);">Inti Pusat: 82% ({formatRupiah('6930000.00')})</span>
				<span class="font-semibold" style="color: var(--pill-warning-text);">Lokal Gerai: 18% ({formatRupiah('1520000.00')})</span>
			</div>

			<div class="w-full h-2 rounded-full overflow-hidden flex" style="background: var(--bg-panel-sub); border: 1px solid var(--border-panel);">
				<div style="width: 82%; background: var(--brand-primary);" title="Menu Inti 82%"></div>
				<div style="width: 18%; background: var(--pill-warning-text);" title="Menu Lokal 18%"></div>
			</div>

			<div class="text-[10px] text-muted pt-0.5">
				Resep lokal <em>Pandan Latte</em> di Dago menyumbang omzet tertinggi kedua.
			</div>
		</div>

		<!-- 2. Produk Teratas Brand Hari Ini -->
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-bold" style="color: var(--text-muted);">Top Menu Brand Hari Ini:</span>
			{#each topProducts as item, idx}
				<div class="dash-subbox p-2.5 flex items-center justify-between text-xs">
					<div class="flex items-center gap-2.5">
						<span class="rank-badge rank-{idx + 1}">
							{idx + 1}
						</span>
						<div>
							<div class="font-bold text-xs" style="color: var(--text-main);">{item.name}</div>
							<div class="text-[10px]" style="color: var(--text-muted);">
								<span class="px-1.5 py-0.5 rounded text-[9.5px] font-semibold" style="background: {item.type === 'core' ? 'var(--pill-info-bg)' : 'var(--pill-warning-bg)'}; color: {item.type === 'core' ? 'var(--pill-info-text)' : 'var(--pill-warning-text)'}; border: 1px solid {item.type === 'core' ? 'var(--pill-info-border)' : 'var(--pill-warning-border)'};">
									{item.typeLabel}
								</span>
								&bull; {item.count} cup
							</div>
						</div>
					</div>
					<div class="text-right font-mono">
						<div class="font-bold text-xs" style="color: var(--text-main);">{formatRupiah(item.omzet)}</div>
						<div class="text-[10px] text-muted">{item.pct}%</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- 3. Bottom Performer -->
		<div class="dash-subbox p-2.5 flex items-center justify-between text-xs" style="background: var(--pill-danger-bg); border: 1px solid var(--pill-danger-border); border-left: 3px solid var(--color-danger, #ef4444);">
			<div class="flex items-center gap-2">
				<Icon name="arrow-trending-down" size={14} class="text-danger" />
				<div>
					<span class="font-bold text-xs" style="color: var(--text-main);">{bottomProduct.name}</span>
					<div class="text-[10px]" style="color: var(--text-muted);">{bottomProduct.note} &bull; {bottomProduct.count} cup</div>
				</div>
			</div>
			<div class="text-right font-mono">
				<span class="text-xs font-bold" style="color: var(--pill-danger-text);">{formatRupiah(bottomProduct.omzet)}</span>
			</div>
		</div>
	</div>
</DashboardCardFrame>
