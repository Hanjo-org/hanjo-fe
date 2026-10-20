<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { PaymentReconciliationCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<PaymentReconciliationCardData>('payment_reconciliation'));
	const data = $derived(cardState.data);

	// Simulasi State untuk Pengujian Finance: Normal (Happy) vs Ada Selisih (Unhappy)
	let isSimulatingDiscrepancy = $state(false);

	const isMatched = $derived(!isSimulatingDiscrepancy && data?.status === 'matched');
	const currentDiscrepancy = $derived(isSimulatingDiscrepancy ? '125000.00' : (data?.discrepancy_amount || '0.00'));
	const pendingCount = $derived(isSimulatingDiscrepancy ? 2 : (data?.unsettled_transactions_count || 0));

	const settlementHistory = [
		{ date: '12 Okt 2026', pos: '13920000.00', payout: '13822560.00', fee: '97440.00', bank: 'BCA (0882)', status: 'matched' },
		{ date: '11 Okt 2026', pos: '15400000.00', payout: '15292200.00', fee: '107800.00', bank: 'Mandiri (412)', status: 'matched' },
		{ date: '10 Okt 2026', pos: '12100000.00', payout: '12015300.00', fee: '84700.00', bank: 'BCA (0882)', status: 'matched' }
	];
</script>

<DashboardCardFrame
	cardKey="payment_reconciliation"
	title="Rekonsiliasi Pembayaran Digital (QRIS & EDC)"
	icon="credit-card"
	subtitle="Kesesuaian omzet kasir POS vs pencairan rekening bank & payment gateway (Siklus T+1)"
	badgeText="Settlement T+1"
	badgeVariant="info"
	drilldownUrl="/finance"
	drilldownLabel="Audit Bank"
	colSpan="col-12 col-lg-6"
>
	{#snippet headerAction()}
		<button
			type="button"
			class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5"
			style={isSimulatingDiscrepancy
				? 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);'
				: 'background: var(--bg-panel-sub); color: var(--text-muted); border-color: var(--border-panel);'}
			onclick={() => (isSimulatingDiscrepancy = !isSimulatingDiscrepancy)}
			title="Uji visualisasi saat gateway mengalami selisih atau pending transaksi"
		>
			<Icon name="bolt" size={12} />
			<span>{isSimulatingDiscrepancy ? 'Reset Normal' : 'Simulasi Selisih'}</span>
		</button>
	{/snippet}

	{#if data}
		<!-- Status di Depan sebagai Jawaban Utama bagi Finance -->
		<div class="sales-kpi-headline flex items-center justify-between flex-wrap gap-2">
			<div class="flex items-center gap-2">
				<span class="headline-val flex items-center gap-2" style="font-size: 22px; color: {isMatched ? 'var(--pill-success-text)' : 'var(--pill-danger-text)'};">
					<Icon name={isMatched ? 'check-circle' : 'exclamation-triangle'} size={24} />
					{isMatched ? 'Kliring Cocok 100%' : 'Perhatian: Ada Selisih Kliring'}
				</span>
			</div>
			<Badge
				variant={isMatched ? 'success' : 'danger'}
				text={isMatched ? 'Selisih Rp 0 • 0 Pending' : `Selisih ${formatRupiah(currentDiscrepancy)} • ${pendingCount} Pending`}
				size="md"
			/>
		</div>

		<!-- Satu Baris Pembanding: POS Kasir vs Payout Gateway -->
		<div class="text-xs pb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5" style="color: var(--text-muted);">
			<span>Transaksi Hari Ini (13 Okt):</span>
			<span>POS Kasir <strong class="mono" style="color: var(--text-main);">{formatRupiah(data.erp_non_cash_total)}</strong></span>
			<span class="dot-sep">•</span>
			<span>Est. Cair Gateway <strong class="mono" style="color: var(--brand-primary);">{formatRupiah(data.midtrans_settlement_total)}</strong></span>
			<span class="dot-sep">•</span>
			<span>Selisih <strong class="mono font-bold" style="color: {isMatched ? 'var(--text-main)' : 'var(--pill-danger-text)'};">{formatRupiah(currentDiscrepancy)}</strong></span>
		</div>

		<div class="sales-subgrid">
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Settlement Gateway</span>
				<span class="sales-subitem-val mono font-bold" style="color: var(--brand-primary);">
					{formatRupiah(data.midtrans_settlement_total)}
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Selisih Rekonsiliasi</span>
				<span class="sales-subitem-val mono font-bold" style={isMatched ? 'color: var(--text-main);' : 'color: var(--pill-danger-text);'}>
					{formatRupiah(currentDiscrepancy)}
				</span>
			</div>
			<div class="sales-subitem">
				<span class="sales-subitem-lbl">Transaksi Tertunda</span>
				<span class="sales-subitem-val mono font-semibold" style={pendingCount > 0 ? 'color: var(--pill-danger-text);' : 'color: var(--text-main);'}>
					{pendingCount} transaksi
				</span>
			</div>
		</div>

		<!-- Riwayat Settlement 3 Hari Terakhir (Mengisi Ruang Kosong dengan Nilai Tambah) -->
		<div class="dash-subbox p-4 rounded-xl flex flex-col gap-3">
			<div class="flex items-center justify-between flex-wrap gap-1">
				<span class="text-xs font-bold" style="color: var(--text-main);">Riwayat Settlement Payment Gateway (3 Hari Terakhir)</span>
				<span class="text-[11px]" style="color: var(--text-subtle);">Siklus Settlement H+1 Pagi</span>
			</div>

			<table class="w-full text-xs" style="border-collapse: collapse;">
				<thead>
					<tr class="text-left font-semibold" style="color: var(--text-muted); border-bottom: 1px solid var(--border-panel);">
						<th class="py-2.5 px-3">Tanggal</th>
						<th class="py-2.5 px-3">Omzet POS</th>
						<th class="py-2.5 px-3 text-right">Cair Bank</th>
						<th class="py-2.5 px-3 text-right">MDR Fee</th>
						<th class="py-2.5 px-3 text-center">Rekening</th>
						<th class="py-2.5 px-3 text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each settlementHistory as hist}
						<tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
							<td class="py-2.5 px-3 font-medium" style="color: var(--text-main);">{hist.date}</td>
							<td class="py-2.5 px-3 mono" style="color: var(--text-muted);">{formatRupiah(hist.pos)}</td>
							<td class="py-2.5 px-3 mono font-semibold text-right" style="color: var(--brand-primary);">{formatRupiah(hist.payout)}</td>
							<td class="py-2.5 px-3 mono text-right" style="color: var(--text-subtle);">{formatRupiah(hist.fee)}</td>
							<td class="py-2.5 px-3 text-center text-[11px]" style="color: var(--text-muted);">{hist.bank}</td>
							<td class="py-2.5 px-3 text-center">
								<Badge variant="success" text="Klir 100%" size="sm" />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="dash-banner {isMatched ? 'dash-banner-success' : 'dash-banner-warning'} text-xs">
			{#if isMatched}
				<span>Siklus QRIS T+1: Transaksi tanggal <strong>{data.settlement_date}</strong> terverifikasi cocok. Dana dijadwalkan masuk rekening operasional BCA besok pukul 09:00 WIB.</span>
			{:else}
				<span style="color: var(--pill-danger-text);">Ditemukan selisih sebesar <strong>{formatRupiah(currentDiscrepancy)}</strong> pada 2 transaksi QRIS Senopati. Segera cek log webhook Midtrans atau lakukan audit perbandingan struk kasir.</span>
			{/if}
		</div>
	{/if}
</DashboardCardFrame>
