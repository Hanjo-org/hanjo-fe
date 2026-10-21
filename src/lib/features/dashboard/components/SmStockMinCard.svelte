<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatNumber } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SmStockMinCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SmStockMinCardData>('sm_stock_min'));
	const data = $derived(cardState.data);
	const items = $derived(data?.items || []);
</script>

<DashboardCardFrame
	cardKey="sm_stock_min"
	title="Bahan Baku di Bawah Minimum"
	icon="exclamation-triangle"
	subtitle="Stok gerai Anda yang mendekati buffer kritis dan perlu pengadaan segera"
	badgeText="{items.length} Kritis"
	badgeVariant={items.length > 0 ? 'danger' : 'success'}
	drilldownUrl="/inventory"
	drilldownLabel="Cek Inventaris"
	colSpan="col-12 col-lg-6"
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted flex flex-col items-center gap-2">
			<Icon name="check-circle" size={26} class="text-primary mb-1" />
			<p class="font-semibold text-xs" style="color: var(--text-main);">Seluruh bahan baku di gerai Anda aman</p>
			<p class="text-[11px] text-muted m-0">Persediaan fisik berada di atas batas buffer minimum operasional.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			<!-- Headline Ringkasan Kritis -->
			<div class="sales-kpi-headline flex items-center justify-between flex-wrap gap-2">
				<div>
					<span class="headline-val font-bold mono" style="color: var(--pill-danger-text); font-size: 22px;">{items.length} Bahan Kritis</span>
					<span class="text-xs ml-2 font-medium" style="color: var(--text-muted);">(Buffer Stok &lt; 2 Hari)</span>
				</div>
				<Badge variant="danger" text="Perlu Restock" size="sm" />
			</div>

			<!-- Daftar Bahan Baku Kritis -->
			<div class="flex flex-col gap-2.5">
				{#each items as itm}
					<div
						class="dash-subbox flex items-center justify-between p-3.5 rounded-xl gap-3"
						style="border-left: 3px solid var(--color-danger, #ef4444);"
					>
						<!-- Kolom Info Produk & Fisik vs Buffer -->
						<div class="flex flex-col gap-1 min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-bold text-xs truncate" style="color: var(--text-main);" title={itm.item_name}>
									{itm.item_name}
								</span>
								<Badge variant="danger" text="Perlu Reorder" size="sm" />
							</div>
							<div class="text-[11px] flex items-center gap-1.5 flex-wrap" style="color: var(--text-muted);">
								<span>Sisa Fisik:</span>
								<strong class="mono font-bold" style="color: var(--pill-danger-text);">
									{formatNumber(itm.current_stock, 0, 1)} {itm.unit}
								</strong>
								<span>&bull;</span>
								<span>Batas Buffer:</span>
								<span class="mono font-semibold" style="color: var(--text-main);">
									{formatNumber(itm.min_stock, 0, 1)} {itm.unit}
								</span>
							</div>
						</div>

						<!-- Kolom Waktu Habis & Tombol PO Langsung -->
						<div class="flex items-center gap-2.5 flex-shrink-0">
							<div class="text-right flex flex-col items-end">
								<span class="text-xs font-bold mono" style="color: var(--pill-danger-text);">
									~{formatNumber(itm.est_days, 0, 1)} hari
								</span>
								<span class="text-[10px]" style="color: var(--text-subtle);">
									habis jika tidak PO
								</span>
							</div>
							<a
								href="/procurement?item={encodeURIComponent(itm.item_name)}"
								class="btn-approve-direct text-xs py-1.5 px-3 font-semibold flex items-center gap-1"
								style="background: var(--brand-primary); border-color: var(--brand-primary);"
								title="Buat PO untuk {itm.item_name}"
							>
								<Icon name="plus" size={13} />
								<span>PO</span>
							</a>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer Baris Status & Aksi Semua -->
			<div class="flex items-center justify-between pt-2.5 mt-0.5 border-t text-xs flex-wrap gap-2" style="border-color: var(--border-panel);">
				<span class="text-muted flex items-center gap-1.5 text-[11px]">
					<Icon name="clock" size={13} />
					<span>Lead time pengiriman supplier ~1-2 hari kerja</span>
				</span>
				<a
					href="/procurement"
					class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
					style="background: var(--bg-panel-sub); border: 1px solid var(--border-panel); color: var(--text-main);"
				>
					<Icon name="shopping-cart" size={13} />
					<span>Kelola Pengadaan Gerai</span>
				</a>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
