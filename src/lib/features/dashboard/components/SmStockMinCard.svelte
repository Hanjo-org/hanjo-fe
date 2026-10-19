<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
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
	subtitle="Stok gerai Anda yang mendekati buffer kritis dan perlu pengadaan"
	badgeText="{items.length} Kritis"
	badgeVariant="danger"
	drilldownUrl="/inventory"
	drilldownLabel="Cek Inventaris"
	colSpan="col-12 col-lg-6"
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Seluruh bahan baku di gerai Anda aman di atas batas minimum.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-2">
				{#each items as itm}
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--pill-danger-bg); border: 1px solid var(--pill-danger-border);">
						<div>
							<div class="font-bold text-sm flex items-center gap-2" style="color: var(--text-main);">
								<span>{itm.item_name}</span>
								<Badge variant="danger" text="Perlu Reorder" size="sm" />
							</div>
							<div class="text-xs mt-0.5" style="color: var(--text-muted);">
								Sisa Fisik: <strong style="color: var(--pill-danger-text);">{itm.current_stock} {itm.unit}</strong> (Batas Buffer: {itm.min_stock} {itm.unit})
							</div>
						</div>

						<div class="text-right">
							<span class="text-xs font-bold block" style="color: var(--pill-danger-text);">Sisa ~{itm.est_days} hari</span>
							<span class="text-[11px]" style="color: var(--text-subtle);">habis jika tidak PO</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Tombol Tindakan Cepat (T-01.9: Tombol Buat Permintaan Barang) -->
			<div class="pt-2 flex items-center justify-end" style="border-top: 1px solid var(--border-subtle);">
				<Button variant="primary" size="md" href="/procurement">
					<Icon name="plus" size={14} />
					<span>Buat Permintaan Barang (PO)</span>
				</Button>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
