<script lang="ts">
	/**
	 * OwnerAlertRadarCard.svelte
	 * Radar Masalah & Butuh Tindakan Eksekutif
	 * Menjawab rasa penasaran Owner:
	 * "Yang sedang masalah apa saja? (stok tipis, butuh persetujuan, dll)"
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type {
		ActionCenterCardData,
		StockIssuesCardData,
		OutletEodStatusCardData
	} from '../../../api/contract/types.js';

	const actionState = $derived(dashboardStore.getCardState<ActionCenterCardData>('action_center'));
	const stockState = $derived(dashboardStore.getCardState<StockIssuesCardData>('stock_issues'));
	const eodState = $derived(dashboardStore.getCardState<OutletEodStatusCardData>('outlet_eod_status'));

	const actionItems = $derived(actionState.data?.items || []);
	const stockItems = $derived(stockState.data?.items || []);
	const pendingOutlets = $derived(eodState.data?.outlets.filter((o) => o.eod_status !== 'completed') || []);

	let activeTab = $state<'approvals' | 'stock'>('approvals');
	const totalIssues = $derived(actionItems.length + stockItems.length);
</script>

<DashboardCardFrame
	cardKey="action_center"
	title="Radar Masalah & Otorisasi"
	icon="bolt"
	subtitle="Hanya menampilkan hal yang memerlukan persetujuan atau perhatian mendesak Owner"
	badgeText="{totalIssues} Masalah Perlu Perhatian"
	badgeVariant={totalIssues > 0 ? 'warning' : 'success'}
	drilldownUrl="/approvals"
	drilldownLabel="Inbox Persetujuan"
	colSpan="col-12 col-lg-5"
>
	<!-- Tab Switcher -->
	<div class="dash-tab-switch mb-3">
		<button
			type="button"
			class="dash-tab-btn flex items-center gap-1.5"
			class:active={activeTab === 'approvals'}
			onclick={() => (activeTab = 'approvals')}
		>
			<Icon name="bolt" size={13} />
			<span>Butuh Persetujuan ({actionItems.length})</span>
		</button>
		<button
			type="button"
			class="dash-tab-btn flex items-center gap-1.5"
			class:active={activeTab === 'stock'}
			onclick={() => (activeTab = 'stock')}
		>
			<Icon name="exclamation-triangle" size={13} />
			<span>Bahan Kritis ({stockItems.length})</span>
		</button>
	</div>

	{#if activeTab === 'approvals'}
		<!-- Tab 1: Butuh Persetujuan / Otorisasi -->
		{#if actionItems.length === 0}
			<div class="p-6 text-center text-muted">
				<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
				<p>Tidak ada otorisasi tertunda. Seluruh persetujuan beres!</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each actionItems as item}
					<div class="dash-subbox flex items-start justify-between gap-3 p-3">
						<div class="flex flex-col gap-1">
							<div class="flex items-center gap-2">
								<Badge variant={item.badgeColor} text={item.badge} size="sm" />
								<span class="font-bold text-xs" style="color: var(--text-main);">{item.title}</span>
							</div>
							<p class="text-xs m-0" style="color: var(--text-muted); line-height: 1.4;">
								{item.desc}
							</p>
						</div>

						<div class="flex-shrink-0">
							<Button variant="secondary" size="sm" href={item.actionUrl}>
								{item.actionLabel}
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Tab 2: Peringatan Bahan Kritis & Operasional -->
		{#if stockItems.length === 0 && pendingOutlets.length === 0}
			<div class="p-6 text-center text-muted">
				<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
				<p>Seluruh stok bahan aman dan operasional gerai berjalan normal.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each stockItems as itm}
					<div class="dash-subbox flex items-center justify-between gap-3 p-3" style="border-left: 3px solid var(--pill-danger-border);">
						<div class="flex flex-col gap-0.5">
							<div class="flex items-center gap-2">
								<span class="font-bold text-xs" style="color: var(--text-main);">{itm.item_name}</span>
								<Badge variant="danger" text="Buffer Kritis" size="sm" />
							</div>
							<span class="text-xs" style="color: var(--text-muted);">
								{itm.outlet_name} • Fisik: <strong style="color: var(--pill-danger-text);">{itm.current_qty} {itm.unit}</strong> (Min: {itm.min_qty} {itm.unit})
							</span>
						</div>

						<div class="text-right flex-shrink-0">
							<span class="text-xs font-bold block" style="color: var(--pill-danger-text);">Sisa ~{itm.est_days_left} hari</span>
							<a href="/procurement" class="text-[11px] font-semibold text-primary hover:underline">
								Buat PO →
							</a>
						</div>
					</div>
				{/each}

				{#if pendingOutlets.length > 0}
					<div class="dash-banner dash-banner-warning flex items-center justify-between mt-1">
						<div class="flex items-center gap-2">
							<Icon name="moon" size={14} />
							<span class="text-xs">
								<strong>Tutup Hari (EOD):</strong> {pendingOutlets.length} gerai belum menyelesaikan tutup kas laci.
							</span>
						</div>
						<a href="/reports" class="text-xs font-bold underline">
							Pantau EOD
						</a>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</DashboardCardFrame>
