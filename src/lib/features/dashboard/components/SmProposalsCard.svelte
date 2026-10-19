<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SmProposalsCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SmProposalsCardData>('sm_proposals'));
	const data = $derived(cardState.data);
	const items = $derived(data?.items || []);
</script>

<DashboardCardFrame
	cardKey="sm_proposals"
	title="Usulan Menu Lokal Gerai"
	icon="light-bulb"
	subtitle="Pelacakan inovasi menu dan resep racikan gerai yang diajukan ke pusat"
	drilldownUrl="/catalog"
	drilldownLabel="Usulan Katalog"
	colSpan="col-12 col-lg-6"
>
	{#if items.length === 0}
		<div class="p-6 text-center text-muted flex flex-col items-center gap-3">
			<p>Belum ada usulan menu lokal yang diajukan.</p>
			<Button variant="secondary" size="sm" href="/catalog">
				<Icon name="plus" size={13} />
				<span>Buat Usulan Resep Baru</span>
			</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each items as item}
				<div class="dash-subbox flex items-center justify-between">
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm" style="color: var(--text-main);">{item.recipe_name}</span>
							<Badge
								variant={item.status === 'approved' ? 'success' : item.status === 'revision_needed' ? 'danger' : 'info'}
								text={item.status === 'approved' ? 'Disetujui Pusat' : item.status === 'submitted' ? 'Menunggu Kurasi HQ' : 'Perlu Revisi'}
								size="sm"
							/>
						</div>
						<span class="text-xs" style="color: var(--text-subtle);">
							{item.feedback || 'Resep sedang dianalisis margin & standarisasi bahan oleh HQ Admin.'}
						</span>
					</div>

					<Button variant="secondary" size="sm" href="/catalog">
						Lihat Resep
					</Button>
				</div>
			{/each}

			<div class="flex justify-end pt-1">
				<Button variant="secondary" size="sm" href="/catalog">
					<Icon name="plus" size={13} />
					<span>Ajukan Menu Baru</span>
				</Button>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
