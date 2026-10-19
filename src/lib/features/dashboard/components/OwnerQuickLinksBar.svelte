<script lang="ts">
	/**
	 * OwnerQuickLinksBar.svelte
	 * Pintasan Laporan Lengkap Tanpa Menumpuk di Dashboard Utama
	 */
	import Icon from '../../../components/data/Icon.svelte';
</script>

<div class="owner-quick-links-bar col-12">
	<div class="quick-links-lead">
		<span class="quick-links-title">Laporan &amp; Data Mendalam</span>
		<span class="quick-links-desc">Akses cepat ke modul lengkap jika Anda membutuhkan analisis tabel detail</span>
	</div>

	<div class="quick-links-items">
		<a href="/reports" class="quick-link-btn">
			<Icon name="chart-pie" size={15} />
			<span>Laba Rugi (P&amp;L)</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/outlets" class="quick-link-btn">
			<Icon name="building-office" size={15} />
			<span>Kinerja per Outlet</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/finance" class="quick-link-btn">
			<Icon name="document-text" size={15} />
			<span>Hutang Pemasok</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/inventory" class="quick-link-btn">
			<Icon name="cube" size={15} />
			<span>Inventaris &amp; Mutasi</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>
	</div>
</div>
