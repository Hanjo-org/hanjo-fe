<script lang="ts">
	/**
	 * FinancePulseStrip.svelte
	 * 4 Denyut Finansial Utama (Financial Cockpit Pulse)
	 * Menjawab langsung kebutuhan Finance:
	 * 1. Arus Kas Digital (Net Inflow / Settlement Midtrans)
	 * 2. Hutang Supplier Jatuh Tempo (AP Due Soon)
	 * 3. Saldo Kas Kecil Jaringan (Petty Cash Pool)
	 * 4. Status Rekonsiliasi & EOD Kasir Gerai
	 */
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import type {
		PaymentReconciliationCardData,
		HqPayablesCardData,
		PettyCashCardData,
		OutletEodStatusCardData
	} from '../../../api/contract/types.js';

	const reconState = $derived(dashboardStore.getCardState<PaymentReconciliationCardData>('payment_reconciliation'));
	const payablesState = $derived(dashboardStore.getCardState<HqPayablesCardData>('hq_payables'));
	const pettyState = $derived(dashboardStore.getCardState<PettyCashCardData>('petty_cash'));
	const eodState = $derived(dashboardStore.getCardState<OutletEodStatusCardData>('outlet_eod_status'));

	const recon = $derived(reconState.data);
	const payables = $derived(payablesState.data);
	const petty = $derived(pettyState.data);
	const eod = $derived(eodState.data);

	const isMatched = $derived(recon?.status === 'matched');
	const dueSoonNum = $derived(payables ? parseFloat(payables.due_soon_amount) : 0);
</script>

<div class="owner-pulse-grid col-12">
	<!-- 1. Arus Kas Masuk & Settlement Gateway -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge brand">
				<Icon name="credit-card" size={18} />
			</div>
			<div class="pulse-trend-text {isMatched ? 'success' : 'warning'}">
				<Icon name="check-circle" size={14} />
				<span>{isMatched ? 'Kliring Cocok' : 'Ada Selisih'}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Penerimaan Digital (QRIS)</span>
			<div class="pulse-main-val">
				{recon ? formatRupiah(recon.midtrans_settlement_total) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>POS: <strong>{recon ? formatRupiah(recon.erp_non_cash_total) : 'Rp 0'}</strong></span>
				<span class="dot-sep">•</span>
				<span>{recon?.unsettled_transactions_count || 0} pending</span>
			</div>
		</div>
	</div>

	<!-- 2. Hutang Supplier Jatuh Tempo -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge {dueSoonNum > 0 ? 'warning' : 'success'}">
				<Icon name="clock" size={18} />
			</div>
			<div class="pulse-trend-text {dueSoonNum > 0 ? 'warning' : 'success'}">
				<Icon name={dueSoonNum > 0 ? 'exclamation-triangle' : 'check'} size={14} />
				<span>{dueSoonNum > 0 ? 'Perlu Dibayar' : 'Semua Lancar'}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Jatuh Tempo 7 Hari (AP)</span>
			<div class="pulse-main-val">
				{payables ? formatRupiah(payables.due_soon_amount) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Total Tagihan: <strong>{payables ? formatRupiah(payables.total_balance) : 'Rp 0'}</strong></span>
			</div>
		</div>
	</div>

	<!-- 3. Saldo Kas Kecil Jaringan -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="wallet" size={18} />
			</div>
			<div class="pulse-trend-text {petty && petty.pending_verification_count > 0 ? 'warning' : 'success'}">
				<Icon name="circle-stack" size={14} />
				<span>{petty ? `${petty.pending_verification_count} Nota Klaim` : '0 Klaim'}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Saldo Kas Kecil Total</span>
			<div class="pulse-main-val">
				{petty ? formatRupiah(petty.total_balance) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Klaim Pending: <strong>{petty ? formatRupiah(petty.pending_verification_amount) : 'Rp 0'}</strong></span>
			</div>
		</div>
	</div>

	<!-- 4. Status Rekonsiliasi & EOD Kasir -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge {isMatched ? 'success' : 'danger'}">
				<Icon name="check-circle" size={18} />
			</div>
			<div class="pulse-trend-text success">
				<Icon name="lock-closed" size={14} />
				<span>Buku Okt 2026</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Status Tutup Buku &amp; Kas</span>
			<div class="pulse-main-val">
				{recon?.discrepancy_amount === '0.00' || !recon?.discrepancy_amount ? 'Rp 0 Selisih' : formatRupiah(recon.discrepancy_amount)}
			</div>
			<div class="pulse-subtext">
				{#if eod}
					<span>{eod.completed_count}/{eod.total_count} Gerai Tutup Laci</span>
				{:else}
					<span>Status EOD Kasir Selesai</span>
				{/if}
				<span class="dot-sep">•</span>
				<span style="color: var(--brand-primary); font-weight: 600;">Periode Open</span>
			</div>
		</div>
	</div>
</div>
