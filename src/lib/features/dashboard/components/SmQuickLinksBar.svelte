<script lang="ts">
	/**
	 * SmQuickLinksBar.svelte
	 * Pintasan Operasional Store Manager (Single-Outlet Cockpit)
	 *
	 * Memudahkan Store Manager menjangkau tugas harian tanpa berpindah-pindah menu:
	 * 1. Buka Mesin Kasir POS
	 * 2. Buat Permintaan Barang (PO)
	 * 3. Catat Kas Kecil Gerai
	 * 4. Checklist Tutup Kas Laci (EOD)
	 */
	import Icon from '../../../components/data/Icon.svelte';

	function scrollToEod() {
		const el = document.getElementById('card-sm_eod_status');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.classList.remove('card-highlight-pulse');
			void el.offsetWidth;
			el.classList.add('card-highlight-pulse');
			setTimeout(() => el.classList.remove('card-highlight-pulse'), 2500);
		}
	}
</script>

<div class="owner-quick-links-bar col-12" id="sm-quick-actions">
	<div class="quick-links-lead">
		<span class="quick-links-title">Pintasan Operasional Gerai</span>
		<span class="quick-links-desc">Aksi cepat Store Manager: transaksi kasir, pengadaan stok, kas kecil &amp; tutup hari</span>
	</div>

	<div class="quick-links-items">
		<!-- 1. Buka POS Kasir -->
		<a href="/pos" class="quick-link-btn" title="Buka antarmuka kasir penjualan POS">
			<Icon name="shopping-cart" size={15} class="text-primary" />
			<span>Buka Mesin Kasir POS</span>
		</a>

		<!-- 2. Buat PO Pengadaan -->
		<a href="/procurement" class="quick-link-btn" title="Buat permintaan pengadaan bahan baku ke gudang / supplier">
			<Icon name="plus" size={15} class="text-primary" />
			<span>Buat Permintaan Barang (PO)</span>
		</a>

		<!-- 3. Catat Kas Kecil -->
		<a href="/petty-cash" class="quick-link-btn" title="Catat nota belanja operasional harian gerai">
			<Icon name="wallet" size={15} class="text-primary" />
			<span>Catat Kas Kecil</span>
		</a>

		<!-- 4. Checklist EOD -->
		<button type="button" class="quick-link-btn cursor-pointer" onclick={scrollToEod} title="Menuju checklist tutup hari kas laci">
			<Icon name="moon" size={15} class="text-primary" />
			<span>Checklist Tutup Hari (EOD)</span>
		</button>
	</div>
</div>
