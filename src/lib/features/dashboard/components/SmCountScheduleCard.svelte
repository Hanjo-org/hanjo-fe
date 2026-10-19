<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatDate } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SmCountScheduleCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SmCountScheduleCardData>('sm_count_schedule'));
	const data = $derived(cardState.data);
</script>

<DashboardCardFrame
	cardKey="sm_count_schedule"
	title="Jadwal Stock Opname Gerai"
	icon="clipboard-document-check"
	subtitle="Agenda penghitungan fisik bahan baku berkala oleh tim gerai"
	drilldownUrl="/inventory"
	drilldownLabel="Riwayat Opname"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="dash-subbox p-4 flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2">
					<span class="text-xs uppercase font-bold" style="color: var(--text-muted);">Jadwal Opname Terdekat</span>
					<Badge
						variant={data.is_overdue ? 'danger' : 'success'}
						text={data.status_label}
						size="sm"
					/>
				</div>
				<div class="text-xl font-bold mono" style="color: var(--text-main);">
					{formatDate(data.next_count_date)}
				</div>
				<span class="text-xs" style="color: var(--text-subtle);">
					Cakupan: <strong>Bahan Baku Kritis & High Value (Susu & Kopi)</strong>
				</span>
			</div>

			<div>
				<Button variant="secondary" size="md" href="/inventory">
					Mulai Hitung Fisik
				</Button>
			</div>
		</div>

		<div class="dash-banner dash-banner-info flex items-center gap-2">
			<Icon name="light-bulb" size={16} />
			<span><strong>Panduan Store Manager:</strong> Opname berkala meminimalkan selisih HPP True-Up. Lakukan perhitungan sebelum gerai buka atau setelah shift tutup.</span>
		</div>
	{/if}
</DashboardCardFrame>
