<script lang="ts">
	/**
	 * OwnerQuickLinksBar.svelte
	 * Pintasan Eksekutif & Tindakan Strategis Owner
	 *
	 * Menggantikan tautan navigasi pasif yang mengulang sidebar menjadi
	 * aksi eksekutif riil dan wawasan cepat yang langsung berguna.
	 */
	import Icon from '../../../components/data/Icon.svelte';

	let actionToast = $state<string | null>(null);

	function triggerDownloadReport() {
		actionToast = 'Laporan Eksekutif Konsolidasi (13 Okt) sedang disiapkan dalam format PDF...';
		setTimeout(() => {
			actionToast = 'Berhasil mengunduh: Hanjo_Executive_Report_20261013.pdf';
			setTimeout(() => (actionToast = null), 3000);
		}, 1200);
	}

	function triggerPosBroadcast() {
		actionToast = 'Membuka dialog broadcast memo ke 5 layar mesin kasir POS aktif...';
		setTimeout(() => (actionToast = null), 2500);
	}
</script>

<div class="owner-quick-links-bar col-12">
	<div class="quick-links-lead">
		<span class="quick-links-title">Aksi Eksekutif &amp; Pengawasan Harian</span>
		<span class="quick-links-desc">Tindakan operasional strategis dan ekspor analitik konsolidasi</span>
	</div>

	{#if actionToast}
		<div class="dash-banner dash-banner-info py-1.5 px-3 text-xs font-semibold animate-fadeIn">
			{actionToast}
		</div>
	{/if}

	<div class="quick-links-items">
		<!-- 1. Ekspor Laporan Eksekutif -->
		<button
			type="button"
			class="quick-link-btn cursor-pointer"
			onclick={triggerDownloadReport}
		>
			<Icon name="arrow-down-tray" size={15} class="text-primary" />
			<span>Unduh Ringkasan Eksekutif (PDF)</span>
		</button>

		<!-- 2. Audit Void & Pembatalan Transaksi -->
		<a href="/reports#sales" class="quick-link-btn" title="Audit 1 pembatalan transaksi di Jodi Senopati">
			<span style="color: #f59e0b; display: inline-flex;"><Icon name="exclamation-circle" size={15} /></span>
			<span>Audit Void &amp; Diskon (1 Kasus)</span>
			<span class="text-[10px] px-1.5 py-0.2 rounded font-bold" style="background: rgba(245, 158, 11, 0.15); color: #fcd34d;">Rp 38.500</span>
		</a>

		<!-- 3. Broadcast Memo ke Mesin Kasir -->
		<button
			type="button"
			class="quick-link-btn cursor-pointer"
			onclick={triggerPosBroadcast}
		>
			<Icon name="megaphone" size={15} class="text-primary" />
			<span>Broadcast Memo ke POS Kasir</span>
		</button>

		<!-- 4. Target Omzet Harian -->
		<a href="/reports#pnl" class="quick-link-btn" title="Pencapaian target omzet hari ini">
			<span style="color: #3b82f6; display: inline-flex;"><Icon name="trophy" size={15} /></span>
			<span>Target Omzet: <strong>96.7%</strong></span>
			<span class="text-[10px] text-muted">(Rp 14,5 jt / 15 jt)</span>
		</a>
	</div>
</div>
