<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { ActionCenterCardData, ActionCenterItem } from '../../../api/contract/types.js';

	interface Props {
		colSpan?: string;
	}

	let { colSpan = 'col-12 col-lg-6' }: Props = $props();

	const cardState = $derived(dashboardStore.getCardState<ActionCenterCardData>('action_center'));
	const items = $derived(cardState.data?.items || []);

	function getTargetWidgetId(item: ActionCenterItem): string | null {
		if (item.id === 'act-fin-1') return 'card-true_up_pending';
		if (item.id === 'act-fin-2') return 'card-petty_cash';
		if (item.id === 'act-fin-3') return 'card-hq_payables';
		if (item.id === 'act-fin-4') return 'finance-quick-actions';
		if (item.id === 'act-sm-1') return 'card-sm_stock_min';
		if (item.id === 'act-sm-2') return 'card-sm_petty_cash';
		if (item.id === 'act-sm-eod') return 'card-sm_eod_status';
		return null;
	}

	function handleActionItemClick(event: MouseEvent, item: ActionCenterItem) {
		if (item.id === 'act-fin-4') {
			event.preventDefault();
			window.dispatchEvent(new CustomEvent('open-close-period-modal'));
			const quickEl = document.getElementById('finance-quick-actions');
			if (quickEl) {
				quickEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		const targetWidgetId = getTargetWidgetId(item);
		if (targetWidgetId) {
			const targetEl = document.getElementById(targetWidgetId);
			if (targetEl) {
				event.preventDefault();
				targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
				targetEl.classList.remove('card-highlight-pulse');
				void targetEl.offsetWidth;
				targetEl.classList.add('card-highlight-pulse');
				setTimeout(() => targetEl.classList.remove('card-highlight-pulse'), 2500);
			}
		}
	}
</script>

<DashboardCardFrame
	cardKey="action_center"
	title="Notifikasi & Tindakan Menunggu"
	icon="bell"
	subtitle="Daftar tugas terpusat: klik item untuk langsung menuju modul atau kartu terkait"
	badgeText="{items.length} Tugas Aktif"
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
				{@const targetId = getTargetWidgetId(item)}
				<div
					class="action-item-row"
					id="act-{item.id}"
					role="button"
					tabindex="0"
					onclick={(e) => handleActionItemClick(e, item)}
					onkeydown={(e) => { if (e.key === 'Enter') handleActionItemClick(e as any, item); }}
					style="cursor: pointer; transition: background 0.15s ease;"
				>
					<div class="action-item-main">
						<div class="action-item-header">
							<Badge variant={item.badgeColor} text={item.badge} size="sm" />
							<span class="action-item-title">{item.title}</span>
						</div>
						<p class="action-item-desc">{item.desc}</p>
					</div>

					<div class="action-item-cta">
						{#if targetId}
							<button
								type="button"
								class="btn-action-jump"
								onclick={(e) => { e.stopPropagation(); handleActionItemClick(e, item); }}
							>
								<Icon name="eye" size={13} />
								<span>Lihat</span>
							</button>
						{:else}
							<Button variant="secondary" size="sm" href={item.actionUrl}>
								{item.actionLabel}
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
