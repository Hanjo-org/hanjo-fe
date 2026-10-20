<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import ProgressBar from '../../../components/feedback/ProgressBar.svelte';
	import type { PettyCashCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<PettyCashCardData>('petty_cash'));
	const data = $derived(cardState.data);
	const outlets = $derived(data?.outlets || []);

	const totalCeiling = $derived(data?.total_imprest_ceiling ? parseFloat(data.total_imprest_ceiling) : 8500000);
	const balanceNum = $derived(data ? parseFloat(data.total_balance) : 0);
	const imprestRatio = $derived(
		totalCeiling > 0 ? Math.min(Math.round((balanceNum / totalCeiling) * 100), 100) : 0
	);
	const totalSpent = $derived(data?.total_daily_spent ? parseFloat(data.total_daily_spent) : 420000);
	const totalLimit = $derived(data?.total_daily_limit ? parseFloat(data.total_daily_limit) : 1300000);
	const spendingRatio = $derived(
		totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0
	);
</script>

<DashboardCardFrame
	cardKey="petty_cash"
	title="Kas Kecil: Saldo Imprest & Batas Harian"
	icon="wallet"
	subtitle="Monitoring saldo dana tetap imprest gerai dan realisasi belanja harian"
	badgeText="Jendela Mandiri Kas"
	badgeVariant="info"
	drilldownUrl="/petty-cash"
	drilldownLabel="Audit Kas Kecil"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline flex items-center justify-between flex-wrap gap-2">
			<div>
				<span class="headline-val font-bold mono">{formatRupiah(data.total_balance)}</span>
				<span class="text-xs ml-2 font-medium" style="color: var(--text-muted);">
					(Plafon Imprest: {formatRupiah(totalCeiling)})
				</span>
			</div>
			<span class="headline-trend" style="color: var(--pill-warning-text); background: var(--pill-warning-bg); border: 1px solid var(--pill-warning-border);">
				{data.pending_verification_count} nota verifikasi ({formatRupiah(data.pending_verification_amount)})
			</span>
		</div>

		<!-- Dua Baris Pembanding: Saldo Imprest vs Belanja Hari Ini -->
		<div class="flex flex-col gap-1.5 pb-2 text-xs" style="color: var(--text-muted);">
			<div>
				<span>Saldo Kas Imprest: <strong class="mono" style="color: var(--text-main);">{formatRupiah(data.total_balance)}</strong> dari total plafon <strong class="mono" style="color: var(--text-main);">{formatRupiah(totalCeiling)}</strong> ({imprestRatio}% aman terisi)</span>
			</div>
			<div>
				<span>Belanja Hari Ini: <strong class="mono" style="color: var(--text-main);">{formatRupiah(totalSpent)}</strong> dari batas harian <strong class="mono" style="color: var(--text-main);">{formatRupiah(totalLimit)}</strong> ({spendingRatio}% terpakai)</span>
			</div>
		</div>

		<div class="flex flex-col gap-3.5 pt-1">
			{#each outlets as out}
				{@const spentNum = parseFloat(out.daily_spent)}
				{@const limitNum = parseFloat(out.daily_limit)}
				{@const pct = limitNum > 0 ? Math.min(Math.round((spentNum / limitNum) * 100), 100) : 0}
				{@const ceilingNum = out.imprest_ceiling ? parseFloat(out.imprest_ceiling) : 2000000}
				{@const balancePct = ceilingNum > 0 ? Math.round((parseFloat(out.current_balance) / ceilingNum) * 100) : 0}

				<div class="dash-subbox flex flex-col gap-2.5">
					<div class="flex items-center justify-between flex-wrap gap-1.5">
						<div>
							<span class="font-bold text-sm" style="color: var(--text-main);">{out.outlet_name}</span>
							<span class="text-xs ml-2 font-medium" style="color: var(--text-subtle);">
								Saldo Laci: <strong>{formatRupiah(out.current_balance)}</strong> / {formatRupiah(ceilingNum)} ({balancePct}%)
							</span>
						</div>
						<span class="text-xs font-semibold" style={pct > 80 ? 'color: var(--pill-danger-text);' : 'color: var(--text-muted);'}>
							Terpakai hari ini: {formatRupiah(out.daily_spent)} / {formatRupiah(out.daily_limit)} ({pct}%)
						</span>
					</div>

					<ProgressBar
						value={pct}
						max={100}
						variant={pct > 80 ? 'danger' : pct > 50 ? 'warning' : 'primary'}
						height={7}
					/>
				</div>
			{/each}
		</div>
	{/if}
</DashboardCardFrame>
