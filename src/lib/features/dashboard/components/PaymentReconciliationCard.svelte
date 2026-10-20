<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import type { PaymentReconciliationCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<PaymentReconciliationCardData>('payment_reconciliation'));
	const data = $derived(cardState.data);
</script>

<DashboardCardFrame
	cardKey="payment_reconciliation"
	title="Rekonsiliasi Pembayaran Digital (QRIS)"
	icon="credit-card"
	subtitle="Kesesuaian omzet non-tunai kasir ERP vs payout settlement payment gateway"
	drilldownUrl="/finance"
	drilldownLabel="Rekonsiliasi Bank"
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="sales-kpi-headline">
			<span class="headline-val">{formatRupiah(data.erp_non_cash_total)}</span>
			<Badge
				variant={data.status === 'matched' ? 'success' : 'danger'}
				text={data.status === 'matched' ? 'Cocok 100%' : 'Ada Selisih'}
				size="md"
			/>
		</div>

		<div class="sales-subgrid">
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Settlement Gateway</span>
				<span class="sales-subitem-val" style="color: var(--brand-primary);">
					{formatRupiah(data.midtrans_settlement_total)}
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Selisih Rekonsiliasi</span>
				<span class="sales-subitem-val mono font-bold" style={data.status === 'matched' ? 'color: var(--text-main);' : 'color: var(--pill-danger-text);'}>
					{formatRupiah(data.discrepancy_amount)}
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Transaksi Tertunda</span>
				<span class="sales-subitem-val">
					{data.unsettled_transactions_count} transaksi
				</span>
			</div>
		</div>

		<div class="dash-banner dash-banner-success">
			Seluruh transaksi non-tunai (QRIS & EDC) tanggal <strong>{data.settlement_date}</strong> telah terverifikasi kliring tanpa selisih pending.
		</div>
	{/if}
</DashboardCardFrame>
