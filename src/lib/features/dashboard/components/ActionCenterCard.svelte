<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import type { ActionCenterCardData } from '../../../api/contract/types.js';

	interface Props {
		colSpan?: string;
	}

	let { colSpan = 'col-12 col-lg-6' }: Props = $props();

	const cardState = $derived(dashboardStore.getCardState<ActionCenterCardData>('action_center'));
	const items = $derived(cardState.data?.items || []);
</script>

<DashboardCardFrame
	cardKey="action_center"
	title="Notifikasi & Persetujuan"
	icon="bell"
	subtitle="Tugas menunggu verifikasi, otorisasi, & tindak lanjut operasional"
	badgeText="{items.length} Menunggu"
	badgeVariant={items.length > 0 ? 'warning' : 'success'}
	drilldownUrl="/approvals"
	drilldownLabel="Inbox Persetujuan"
	{colSpan}
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Tidak ada tindakan mendesak yang menunggu. Seluruh tugas selesai!</p>
		</div>
	{:else}
		<div class="action-item-list">
			{#each items as item}
				<div class="action-item-row" id="act-{item.id}">
					<div class="action-item-main">
						<div class="action-item-header">
							<Badge variant={item.badgeColor} text={item.badge} size="sm" />
							<span class="action-item-title">{item.title}</span>
						</div>
						<p class="action-item-desc">{item.desc}</p>
					</div>

					<div class="action-item-cta">
						<Button variant="secondary" size="sm" href={item.actionUrl}>
							{item.actionLabel}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
