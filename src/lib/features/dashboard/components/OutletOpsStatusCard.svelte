<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import type { OutletOpsStatusCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<OutletOpsStatusCardData>('outlet_ops_status'));
	const data = $derived(cardState.data);
	const outlets = $derived(data?.outlets || []);
</script>

<DashboardCardFrame
	cardKey="outlet_ops_status"
	title="Kesehatan Sinkronisasi POS"
	icon="signal"
	subtitle="Konektivitas heartbeat mesin kasir offline-first ke server ERP"
	badgeText="{data?.online_count || 0}/{data?.total_outlets || 0} Online"
	badgeVariant="success"
	drilldownUrl="/reports"
	drilldownLabel="Audit POS"
	colSpan="col-12 col-lg-6"
>
	{#if outlets.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Tidak ada data outlet yang terdaftar.</p>
		</div>
	{:else}
		<div class="card-table-wrap">
			<table class="dash-table">
				<thead>
					<tr>
						<th>Outlet</th>
						<th>Status Sinkron</th>
						<th>Heartbeat Terakhir</th>
						<th class="text-right">Keterlambatan</th>
					</tr>
				</thead>
				<tbody>
					{#each outlets as out}
						<tr>
							<td class="font-bold" style="color: var(--text-main);">{out.outlet_name}</td>
							<td>
								<span class="pill-status online">
									<span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--brand-primary);"></span>
									{out.sync_status}
								</span>
							</td>
							<td class="mono" style="color: var(--text-main);">{out.last_sync_time}</td>
							<td class="text-right mono" style="color: var(--text-subtle);">
								{out.last_sync_mins_ago} menit lalu
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</DashboardCardFrame>
