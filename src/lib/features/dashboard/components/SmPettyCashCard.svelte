<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import ProgressBar from '../../../components/feedback/ProgressBar.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SmPettyCashCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SmPettyCashCardData>('sm_petty_cash'));
	const data = $derived(cardState.data);
	const spentPct = $derived(data ? parseFloat(data.spent_pct) : 0);
</script>

<DashboardCardFrame
	cardKey="sm_petty_cash"
	title="Kas Kecil Gerai & Batas Bebas"
	icon="wallet"
	subtitle="Penggunaan dana operasional harian gerai terhadap batas bebas"
	drilldownUrl="/petty-cash"
	drilldownLabel="Kelola Kas Kecil"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.current_balance)}</span>
			<span class="headline-trend" style="color: var(--text-muted); background: var(--bg-panel-sub); border: 1px solid var(--border-panel);">
				Saldo di Laci Gerai
			</span>
		</div>

		<div class="dash-subbox p-4 flex flex-col gap-3">
			<div class="flex items-center justify-between text-xs font-semibold">
				<span style="color: var(--text-muted);">Terpakai Hari Ini: <strong style="color: var(--text-main);">{formatRupiah(data.daily_spent)}</strong></span>
				<span style="color: var(--text-subtle);">Batas Harian: {formatRupiah(data.daily_limit)} ({spentPct}%)</span>
			</div>

			<ProgressBar
				value={spentPct}
				max={100}
				variant={spentPct > 80 ? 'danger' : spentPct > 50 ? 'warning' : 'primary'}
				height={8}
			/>

			<div class="flex items-center justify-between text-xs pt-1" style="border-top: 1px solid var(--border-subtle);">
				<span style="color: var(--text-subtle);">
					Sisa batas bebas tanpa approval Owner: <strong style="color: var(--brand-primary);">{formatRupiah(data.remaining_today)}</strong>
				</span>

				<Button variant="secondary" size="sm" href="/petty-cash">
					<Icon name="plus" size={13} />
					<span>Catat Pengeluaran</span>
				</Button>
			</div>
		</div>
	{/if}
</DashboardCardFrame>
