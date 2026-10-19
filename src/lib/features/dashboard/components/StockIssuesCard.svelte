<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import type { StockIssuesCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<StockIssuesCardData>('stock_issues'));
	const data = $derived(cardState.data);
	const items = $derived(data?.items || []);
</script>

<DashboardCardFrame
	cardKey="stock_issues"
	title="Peringatan Stok & Bahan Kritis"
	icon="exclamation-triangle"
	subtitle="Bahan baku di bawah buffer minimum dan estimasi kehabisan stok"
	badgeText={items.filter((i) => i.severity === 'danger').length > 0 ? `${items.filter((i) => i.severity === 'danger').length} Kritis` : 'Aman'}
	badgeVariant={items.filter((i) => i.severity === 'danger').length > 0 ? 'danger' : 'success'}
	drilldownUrl="/inventory"
	drilldownLabel="Kelola Stok"
	colSpan="col-12 col-lg-6"
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Seluruh stok bahan baku berada pada tingkat aman di atas buffer minimum.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2.5">
			{#each items as item}
				<div class="dash-subbox flex items-center justify-between">
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm" style="color: var(--text-main);">{item.item_name}</span>
							<Badge
								variant={item.severity === 'danger' ? 'danger' : 'success'}
								text={item.severity === 'danger' ? 'Perlu Reorder' : 'Stok Cukup'}
								size="sm"
							/>
						</div>
						<span class="text-xs" style="color: var(--text-subtle);">
							{item.outlet_name} • Fisik: <strong style="color: var(--text-main);">{item.current_qty} {item.unit}</strong> (Min: {item.min_qty} {item.unit})
						</span>
					</div>

					<div class="flex flex-col items-end gap-0.5">
						<span class="text-xs font-bold" style={item.severity === 'danger' ? 'color: var(--pill-danger-text);' : 'color: var(--brand-primary);'}>
							Sisa ~{item.est_days_left} hari
						</span>
						<span class="text-[11px]" style="color: var(--text-subtle);">
							estimasi pemakaian
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
