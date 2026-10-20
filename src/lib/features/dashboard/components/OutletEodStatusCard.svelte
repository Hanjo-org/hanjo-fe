<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatDate } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { OutletEodStatusCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<OutletEodStatusCardData>('outlet_eod_status'));
	const data = $derived(cardState.data);
	const outlets = $derived(data?.outlets || []);
	const completedCount = $derived(data?.completed_count || 0);
	const totalCount = $derived(data?.total_count || 0);
</script>

<DashboardCardFrame
	cardKey="outlet_eod_status"
	title="Status Tutup Hari (EOD) per Outlet"
	icon="moon"
	subtitle="Monitoring penyelesaian tutup kas laci & rekap operasional harian"
	badgeText="{completedCount}/{totalCount} Gerai Tutup"
	badgeVariant={completedCount === totalCount ? 'success' : 'warning'}
	drilldownUrl="/reports"
	drilldownLabel="Laporan Harian"
	colSpan="col-12 col-lg-6"
>
	{#if outlets.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Tidak ada data status EOD untuk tanggal bisnis ini.</p>
		</div>
	{:else}
		<div class="card-table-wrap">
			<table class="dash-table">
				<thead>
					<tr>
						<th>Outlet</th>
						<th>Status EOD</th>
						<th>Kas Laci</th>
						<th>Waste</th>
						<th>Waktu Selesai</th>
					</tr>
				</thead>
				<tbody>
					{#each outlets as out}
						<tr>
							<td>
								<div class="font-bold" style="color: var(--text-main);">{out.outlet_name}</div>
								{#if out.organization_name}
									<div class="text-[11px]" style="color: var(--brand-primary); font-weight: 600;">{out.organization_name}</div>
								{/if}
							</td>
							<td>
								{#if out.eod_status === 'completed'}
									<span class="pill-status completed flex items-center gap-1">
										<Icon name="check-circle" size={13} />
										<span>Sudah Tutup</span>
									</span>
								{:else}
									<span class="pill-status pending flex items-center gap-1">
										<Icon name="clock" size={13} />
										<span>Belum Tutup</span>
									</span>
								{/if}
							</td>
							<td>
								<span class="text-xs flex items-center gap-1" style={out.cash_drawer_counted ? 'color: var(--brand-primary); font-weight: 700;' : 'color: var(--text-subtle);'}>
									{#if out.cash_drawer_counted}
										<Icon name="check" size={13} />
										<span>Dihitung</span>
									{:else}
										<span>Belum</span>
									{/if}
								</span>
							</td>
							<td>
								<span class="text-xs flex items-center gap-1" style={out.waste_recorded ? 'color: var(--brand-primary); font-weight: 700;' : 'color: var(--text-subtle);'}>
									{#if out.waste_recorded}
										<Icon name="check" size={13} />
										<span>Dicatat</span>
									{:else}
										<span>Belum</span>
									{/if}
								</span>
							</td>
							<td class="text-xs" style="color: var(--text-muted);">
								{#if out.completed_at}
									{formatDate(out.completed_at, true)} ({out.completed_by_name || 'Kasir'})
								{:else}
									<span style="color: var(--text-subtle);">Dalam operasional</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</DashboardCardFrame>
