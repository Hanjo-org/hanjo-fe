<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah, formatNumber } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import type { OutletComparisonCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<OutletComparisonCardData>('outlet_comparison'));
	const data = $derived(cardState.data);
	const rows = $derived(data?.rows || []);
	const isFullMode = $derived(data?.mode === 'full');
</script>

<DashboardCardFrame
	cardKey="outlet_comparison"
	title="Perbandingan Kinerja Antar Outlet"
	icon="building-office"
	subtitle={isFullMode
		? 'Konsolidasi omzet, margin laba kotor, dan beban operasional antar cabang'
		: 'Pemantauan operasional, volume penjualan, dan kepatuhan stok cabang'}
	drilldownUrl="/outlets"
	drilldownLabel="Kelola Outlet"
	colSpan="col-12"
>
	{#if rows.length === 0}
		<div class="p-6 text-center text-muted">
			<p>Tidak ada data outlet yang cocok dengan filter aktif.</p>
		</div>
	{:else}
		<div class="card-table-wrap">
			<table class="dash-table">
				<thead>
					<tr>
						<th>Outlet</th>
						<th>Kepemilikan</th>
						<th class="text-right">Omzet Hari Ini</th>
						<th class="text-right">Item Terjual</th>
						{#if isFullMode}
							<th class="text-right">HPP Bahan</th>
							<th class="text-right">Laba Kotor</th>
							<th class="text-right">Margin %</th>
							<th class="text-right">Biaya Ops</th>
						{/if}
						<th class="text-right">Selisih Stok</th>
						<th class="text-right">Waste %</th>
						<th>Status Sinkron</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row}
						<tr>
							<td>
								<div class="font-bold" style="color: var(--text-main);">{row.outlet_name}</div>
								<div class="text-xs" style="color: var(--brand-primary); font-weight: 600;">
									{row.organization_name || 'Seduhan Kopi Jodi'} · <span class="mono" style="color: var(--text-subtle);">{row.outlet_id}</span>
								</div>
							</td>
							<td>
								<Badge
									variant={row.owner_type === 'own_company' ? 'success' : 'info'}
									text={row.owner_type === 'own_company' ? 'Milik Sendiri' : 'Mitra Investor'}
									size="sm"
								/>
							</td>
							<td class="text-right mono font-bold" style="color: var(--text-main);">
								{formatRupiah(row.omzet)}
							</td>
							<td class="text-right mono" style="color: var(--text-main);">
								{formatNumber(row.cups)} item
							</td>
							{#if isFullMode}
								<td class="text-right mono" style="color: var(--text-muted);">
									{formatRupiah(row.cogs)}
								</td>
								<td class="text-right mono font-semibold" style="color: var(--brand-primary);">
									{formatRupiah(row.gross_profit)}
								</td>
								<td class="text-right mono font-bold" style="color: var(--brand-primary);">
									{row.margin_pct}%
								</td>
								<td class="text-right mono" style="color: var(--text-subtle);">
									{formatRupiah(row.operational_costs)}
								</td>
							{/if}
							<td class="text-right mono" style={parseFloat(row.stock_diff_pct) > 0.5 ? 'color: var(--pill-warning-text); font-weight: 700;' : 'color: var(--text-subtle);'}>
								{row.stock_diff_pct}%
							</td>
							<td class="text-right mono" style={parseFloat(row.waste_pct) > 1.5 ? 'color: var(--pill-danger-text); font-weight: 700;' : 'color: var(--text-subtle);'}>
								{row.waste_pct}%
							</td>
							<td>
								<div class="flex items-center gap-1.5">
									<span class="pill-status online">
										<span class="w-1.5 h-1.5 rounded-full" style="background: var(--brand-primary);"></span>
										{row.sync_status}
									</span>
									<span class="text-xs" style="color: var(--text-subtle);">({row.last_sync})</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</DashboardCardFrame>
