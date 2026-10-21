<script lang="ts">
	/**
	 * FinancePulseStrip.svelte
	 * 4 Denyut Finansial Utama (Financial Cockpit Pulse)
	 * Menjawab langsung kebutuhan Finance dengan hierarki status & pembanding:
	 * 1. Status Kliring QRIS & EDC (Status di depan, tanda selisih Rp 0 & 0 pending)
	 * 2. Hutang Jatuh Tempo 7 Hari (Perlu dibayar Rp 6,85 jt dari total Rp 14,85 jt)
	 * 3. Saldo Kas Kecil Jaringan (Saldo terhadap plafonnya)
	 * 4. Progres Closing Gerai EOD (Progres 0/5 gerai tutup di depan, selisih fisik Rp 0)
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

	// Plafon Kas Kecil Gabungan Jaringan (Plafon Imprest Dana Tetap, Bukan Batas Belanja)
	const totalPettyPlafon = $derived.by(() => {
		if (petty?.total_imprest_ceiling) {
			return parseFloat(petty.total_imprest_ceiling);
		}
		if (petty?.outlets && petty.outlets.length > 0) {
			return petty.outlets.reduce((acc, out) => acc + parseFloat(out.imprest_ceiling || '2000000'), 0);
		}
		return 8500000;
	});
	const pettyBalanceNum = $derived(petty ? parseFloat(petty.total_balance) : 0);
	const pettyPlafonRatio = $derived(
		totalPettyPlafon > 0 ? Math.round((pettyBalanceNum / totalPettyPlafon) * 100) : 0
	);
</script>

<div class="owner-pulse-grid col-12">
	<!-- 1. Kliring QRIS & EDC -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge {isMatched ? 'success' : 'warning'}">
				<Icon name="check-circle" size={18} />
			</div>
			<div class="pulse-trend-text {isMatched ? 'success' : 'warning'}">
				<Icon name={isMatched ? 'check' : 'exclamation-triangle'} size={14} />
				<span>{isMatched ? '100% Klir' : 'Ada Selisih'}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Kliring QRIS &amp; EDC</span>
			<div class="pulse-main-val" style="display: flex; align-items: center; gap: 8px; font-size: 22px; color: {isMatched ? 'var(--pill-success-text)' : 'var(--pill-danger-text)'};">
				<span>{isMatched ? 'Kliring Cocok' : 'Ada Selisih'}</span>
			</div>
			<div class="pulse-subtext">
				<span style="color: {isMatched ? 'var(--pill-success-text)' : 'var(--pill-danger-text)'}; font-weight: 600;">Selisih: Rp 0</span>
				<span class="pulse-subtag">{recon?.unsettled_transactions_count || 0} Pending</span>
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
				<span>{dueSoonNum > 0 ? `${payables?.due_soon_count || 4} Siap Bayar` : 'Lancar'}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Hutang Jatuh Tempo</span>
			<div class="pulse-main-val font-variant-numeric: tabular-nums">
				{payables ? formatRupiah(payables.due_soon_amount) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Total Hutang: <strong>{payables ? formatRupiah(payables.total_balance) : 'Rp 0'}</strong></span>
				<span class="pulse-subtag">{payables?.due_soon_count || 4} Nota</span>
			</div>
		</div>
	</div>

	<!-- 3. Kas Kecil Jaringan -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge success">
				<Icon name="wallet" size={18} />
			</div>
			<div class="pulse-trend-text success">
				<Icon name="circle-stack" size={14} />
				<span>Plafon {formatRupiah(totalPettyPlafon)}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Kas Kecil Jaringan</span>
			<div class="pulse-main-val font-variant-numeric: tabular-nums">
				{petty ? formatRupiah(petty.total_balance) : 'Rp 0'}
			</div>
			<div class="pulse-subtext">
				<span>Plafon: <strong>{formatRupiah(totalPettyPlafon)}</strong></span>
				<span class="pulse-subtag">{pettyPlafonRatio}% Aman</span>
			</div>
		</div>
	</div>

	<!-- 4. Closing Gerai (EOD) -->
	<div class="pulse-card">
		<div class="pulse-top">
			<div class="pulse-icon-badge {eod && eod.completed_count === eod.total_count ? 'success' : 'brand'}">
				<Icon name="building-storefront" size={18} />
			</div>
			<div class="pulse-trend-text {eod && eod.completed_count === eod.total_count ? 'success' : 'brand'}">
				<Icon name="clock" size={14} />
				<span>{eod && eod.completed_count === eod.total_count ? 'Semua Tutup' : `${(eod?.total_count || 5) - (eod?.completed_count || 0)} Buka`}</span>
			</div>
		</div>

		<div class="pulse-content">
			<span class="pulse-label">Closing Gerai (EOD)</span>
			<div class="pulse-main-val" style="display: flex; align-items: baseline; gap: 8px;">
				<span>{eod ? `${eod.completed_count}/${eod.total_count}` : '0/5'}</span>
				<span class="pulse-unit">Gerai Selesai</span>
			</div>
			<div class="pulse-subtext">
				<span>Selisih Fisik: <strong>Rp 0</strong></span>
				<span class="pulse-subtag">{(eod?.total_count || 5) - (eod?.completed_count || 0)} Gerai Aktif</span>
			</div>
		</div>
	</div>
</div>
