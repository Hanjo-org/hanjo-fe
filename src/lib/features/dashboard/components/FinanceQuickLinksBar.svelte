<script lang="ts">
	/**
	 * FinanceQuickLinksBar.svelte
	 * Pintasan Modul Finansial & Akuntansi
	 */
	import Icon from '../../../components/data/Icon.svelte';
</script>

<div class="owner-quick-links-bar col-12">
	<div class="quick-links-lead">
		<span class="quick-links-title">Modul Finansial &amp; Rekonsiliasi</span>
		<span class="quick-links-desc">Akses cepat ke laporan keuangan, rekonsiliasi payment gateway, dan audit kas kecil</span>
	</div>

	<div class="quick-links-items">
		<a href="/reports" class="quick-link-btn">
			<Icon name="chart-pie" size={15} />
			<span>Laba Rugi (P&amp;L)</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/finance" class="quick-link-btn">
			<Icon name="credit-card" size={15} />
			<span>Rekonsiliasi Bank &amp; Midtrans</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/payables" class="quick-link-btn">
			<Icon name="document-text" size={15} />
			<span>Buku Hutang Supplier (AP)</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>

		<a href="/petty-cash" class="quick-link-btn">
			<Icon name="wallet" size={15} />
			<span>Klaim &amp; Audit Kas Kecil</span>
			<Icon name="arrow-right" size={13} class="opacity-60" />
		</a>
	</div>
</div>
