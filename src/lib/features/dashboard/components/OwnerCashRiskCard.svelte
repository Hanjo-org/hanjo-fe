<script lang="ts">
	/**
	 * OwnerCashRiskCard.svelte
	 * Saldo Kas, Likuiditas Bank & Pengawasan Void
	 * Menampilkan posisi kas lancar, pemantauan pembatalan transaksi (void), dan proyeksi EOD
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Badge from '../../../components/data/Badge.svelte';

	// Data Likuiditas Kas & Bank (Konsisten dengan modul Keuangan)
	const liquidityAccounts = [
		{ name: 'BCA Giro HQ', type: 'Rekening Utama', balance: '122000000.00' },
		{ name: 'Mandiri Operasional', type: 'Rekening Kliring QRIS', balance: '56000000.00' },
		{ name: 'Kas Laci (5 Gerai)', type: 'Kas Kecil Kasir', balance: '6550000.00' }
	];

	const totalLiquidity = 184550000;
</script>

<DashboardCardFrame
	cardKey="petty_cash"
	customContent={true}
	title="Saldo Kas & Pengawasan Void"
	icon="banknotes"
	subtitle="Posisi kas likuid, saldo bank, dan audit pembatalan transaksi"
	badgeText="Audit Bersih"
	badgeVariant="success"
	drilldownUrl="/reports"
	drilldownLabel="Audit Keuangan & Mutasi"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2.5">
		<!-- 1. Total Likuiditas Kas & Bank -->
		<div class="dash-subbox p-3 flex flex-col gap-2">
			<div class="flex items-center justify-between text-xs">
				<span class="font-semibold" style="color: var(--text-muted);">Total Kas &amp; Bank:</span>
				<span class="font-mono font-bold text-sm" style="color: #34d399;">
					{formatRupiah(totalLiquidity)}
				</span>
			</div>

			<div class="flex flex-col gap-1.5 pt-1 border-t" style="border-color: var(--border-panel);">
				{#each liquidityAccounts as acc}
					<div class="flex items-center justify-between text-[11px]">
						<div class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full" style="background: #10b981;"></span>
							<span style="color: var(--text-main); font-weight: 500;">{acc.name}</span>
						</div>
						<span class="font-mono font-bold" style="color: var(--text-muted);">{formatRupiah(acc.balance)}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 2. Pengawasan Risiko & Void Kasir Hari Ini -->
		<div class="dash-subbox p-2.5 flex flex-col gap-1.5" style="border-left: 3px solid #10b981;">
			<div class="flex items-center justify-between text-xs">
				<div class="flex items-center gap-1.5">
					<Icon name="shield-check" size={14} class="text-primary" />
					<span class="font-bold" style="color: var(--text-main);">Void &amp; Pembatalan POS:</span>
				</div>
				<Badge variant="success" text="Aman (0.27%)" size="sm" />
			</div>

			<div class="text-[11px] leading-relaxed" style="color: var(--text-muted);">
				Hari ini terdapat <strong style="color: var(--text-main);">1 transaksi void</strong> ({formatRupiah('38500.00')}) di <span class="font-semibold" style="color: var(--text-main);">Jodi Dago</span> karena salah pilih sirup rasa. Diotorisasi oleh Store Manager.
			</div>
		</div>

		<!-- 3. Proyeksi Tutup Kas (EOD Est.) -->
		<div class="dash-subbox p-2.5 flex items-center justify-between text-xs" style="background: rgba(0, 0, 0, 0.12);">
			<div class="flex items-center gap-2">
				<Icon name="moon" size={14} />
				<div>
					<div class="font-semibold" style="color: var(--text-main);">Proyeksi Tutup Hari (EOD)</div>
					<div class="text-[10px]" style="color: var(--text-muted);">Target Rp 15,0 jt &bull; Est. Selesai 23:00</div>
				</div>
			</div>
			<div class="text-right font-mono">
				<div class="font-bold text-xs" style="color: #60a5fa;">Rp 15,20 jt</div>
				<div class="text-[10px] font-semibold" style="color: #34d399;">101.3% Target</div>
			</div>
		</div>
	</div>
</DashboardCardFrame>
