<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import ProgressBar from '../../../components/feedback/ProgressBar.svelte';
	import type { PettyCashCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<PettyCashCardData>('petty_cash'));
	const data = $derived(cardState.data);
	const outlets = $derived(data?.outlets || []);
</script>

<DashboardCardFrame
	cardKey="petty_cash"
	title="Saldo Kas Kecil & Batas Harian"
	icon="wallet"
	subtitle="Monitoring saldo laci kas kecil per outlet dan pengeluaran harian"
	drilldownUrl="/petty-cash"
	drilldownLabel="Audit Kas Kecil"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.total_balance)}</span>
			<span class="headline-trend" style="color: var(--pill-warning-text); background: var(--pill-warning-bg); border: 1px solid var(--pill-warning-border);">
				{data.pending_verification_count} nota verifikasi ({formatRupiah(data.pending_verification_amount)})
			</span>
		</div>

		<div class="flex flex-col gap-3 pt-2">
			{#each outlets as out}
				{@const spentNum = parseFloat(out.daily_spent)}
				{@const limitNum = parseFloat(out.daily_limit)}
				{@const pct = limitNum > 0 ? Math.min(Math.round((spentNum / limitNum) * 100), 100) : 0}

				<div class="dash-subbox flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<div>
							<span class="font-bold text-sm" style="color: var(--text-main);">{out.outlet_name}</span>
							<span class="text-xs ml-2" style="color: var(--text-subtle);">Saldo: <strong>{formatRupiah(out.current_balance)}</strong></span>
						</div>
						<span class="text-xs font-semibold" style={pct > 80 ? 'color: var(--pill-danger-text);' : 'color: var(--text-muted);'}>
							{formatRupiah(out.daily_spent)} / {formatRupiah(out.daily_limit)} ({pct}%)
						</span>
					</div>

					<ProgressBar
						value={pct}
						max={100}
						variant={pct > 80 ? 'danger' : pct > 50 ? 'warning' : 'primary'}
						height={6}
					/>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
