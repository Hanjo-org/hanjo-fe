<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import type { TrueUpPendingCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<TrueUpPendingCardData>('true_up_pending'));
	const data = $derived(cardState.data);
	const items = $derived(data?.items || []);
</script>

<DashboardCardFrame
	cardKey="true_up_pending"
	title="Antrean Nota True-Up Menunggu Verifikasi"
	icon="receipt-percent"
	subtitle="Penerimaan barang dengan harga sementara yang perlu dicocokkan ke faktur"
	badgeText="{data?.pending_invoices_count || 0} Nota Pending"
	badgeVariant="warning"
	drilldownUrl="/procurement"
	drilldownLabel="Verifikasi Nota"
	colSpan="col-12 col-lg-6"
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Tidak ada penerimaan barang yang menunggu nota. Seluruh HPP sudah final.</p>
		</div>
	{:else}
		<div class="sales-kpi-headline mb-3">
			<span class="headline-val">{formatRupiah(data?.provisional_total_value)}</span>
			<span class="headline-trend" style="color: var(--pill-warning-text); background: var(--pill-warning-bg); border: 1px solid var(--pill-warning-border);">
				Total Nilai Sementara
			</span>
		</div>

		<div class="flex flex-col gap-2">
			{#each items as item}
				<div class="dash-subbox flex items-center justify-between">
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm mono" style="color: var(--text-main);">{item.receipt_number}</span>
							<Badge variant="warning" text="{item.age_days} hari lalu" size="sm" />
						</div>
						<span class="text-xs" style="color: var(--text-subtle);">
							{item.supplier_name} • {item.outlet_name}
						</span>
					</div>

					<div class="flex flex-col items-end gap-0.5">
						<span class="font-bold mono text-sm" style="color: var(--text-main);">
							{formatRupiah(item.provisional_total)}
						</span>
						<span class="text-[11px]" style="color: var(--pill-warning-text); font-weight: 600;">
							Perlu Rekonsiliasi
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
