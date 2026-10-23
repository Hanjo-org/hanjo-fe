<script lang="ts">
	/**
	 * FinanceQuickLinksBar.svelte
	 * Aksi Cepat Finansial (Financial Action Bar)
	 * Menggantikan link redundan dengan fungsionalitas aksi cepat langsung:
	 * 1. Ekspor Laporan Keuangan (Excel / PDF)
	 * 2. Tutup Buku Periode Fiskal (September 2026)
	 * 3. Batch Bayar Hutang Supplier (Scroll to #card-hq_payables)
	 * 4. Audit Kas Kecil & True-Up
	 */
	import { onMount } from 'svelte';
	import Icon from '../../../components/data/Icon.svelte';

	let exportStatus = $state<string | null>(null);
	let showClosePeriodModal = $state(false);
	let periodCloseStatus = $state<string | null>(null);

	onMount(() => {
		const handleOpenModal = () => {
			showClosePeriodModal = true;
		};
		window.addEventListener('open-close-period-modal', handleOpenModal);
		return () => {
			window.removeEventListener('open-close-period-modal', handleOpenModal);
		};
	});

	function handleExport() {
		exportStatus = 'Menyiapkan berkas Excel Laporan Keuangan...';
		setTimeout(() => {
			exportStatus = 'Laporan Keuangan Konsolidasi (Okt 2026.xlsx) berhasil diunduh.';
			setTimeout(() => {
				exportStatus = null;
			}, 3500);
		}, 1000);
	}

	function scrollToPayables() {
		const el = document.getElementById('card-hq_payables');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.classList.add('card-highlight-pulse');
			setTimeout(() => el.classList.remove('card-highlight-pulse'), 2500);
		}
	}
</script>

<div class="owner-quick-links-bar col-12" id="finance-quick-actions">
	<div class="quick-links-lead">
		<span class="quick-links-title">Aksi Cepat Finansial</span>
		<span class="quick-links-desc">Aksi operasional keuangan: ekspor data fiskal, penutupan periode buku, &amp; alokasi hutang</span>
	</div>

	<div class="quick-links-items">
		<button type="button" class="quick-link-btn" onclick={handleExport}>
			<Icon name="document-text" size={15} />
			<span>Ekspor Laporan (Excel)</span>
		</button>

		<button type="button" class="quick-link-btn" onclick={() => (showClosePeriodModal = true)}>
			<Icon name="lock-closed" size={15} />
			<span>Tutup Buku September</span>
		</button>

		<button type="button" class="quick-link-btn" onclick={scrollToPayables}>
			<Icon name="credit-card" size={15} />
			<span>Batch Bayar Hutang</span>
		</button>

		<a href="/petty-cash" class="quick-link-btn">
			<Icon name="wallet" size={15} />
			<span>Audit Kas &amp; True-Up</span>
		</a>
	</div>
</div>

{#if exportStatus}
	<div class="col-12 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border" style="background: var(--pill-info-bg); border-color: var(--pill-info-border); color: var(--pill-info-text);">
		<Icon name="check-circle" size={18} />
		<span>{exportStatus}</span>
	</div>
{/if}

{#if periodCloseStatus}
	<div class="col-12 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: var(--pill-success-text);">
		<Icon name="check-circle" size={18} />
		<span>{periodCloseStatus}</span>
	</div>
{/if}

<!-- Modal Konfirmasi Tutup Periode Fiskal September 2026 -->
{#if showClosePeriodModal}
	<div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px);">
		<div class="modal-box w-full max-w-md p-6 rounded-xl flex flex-col gap-5 shadow-xl border" style="background: var(--bg-panel); border-color: var(--border-panel);">
			<div class="flex items-center gap-3">
				<div class="p-2.5 rounded-xl" style="background: rgba(245, 158, 11, 0.12); color: var(--pill-warning-text);">
					<Icon name="lock-closed" size={24} />
				</div>
				<div>
					<h4 class="font-bold text-base" style="color: var(--text-main);">Tutup Periode Fiskal September 2026?</h4>
					<p class="text-xs" style="color: var(--text-muted);">Verifikasi kesiapan pembukuan sebelum penguncian mutasi</p>
				</div>
			</div>

			<div class="text-xs flex flex-col gap-2.5 p-4 rounded-xl" style="background: var(--bg-panel-sub); border: 1px solid var(--border-panel);">
				<div class="flex items-center justify-between">
					<span>Rekonsiliasi Bank &amp; QRIS September:</span>
					<strong class="font-bold" style="color: var(--pill-success-text);">Cocok 100%</strong>
				</div>
				<div class="flex items-center justify-between">
					<span>Jurnal Penjualan Kasir POS:</span>
					<strong class="font-bold" style="color: var(--pill-success-text);">Telah Masuk Semua</strong>
				</div>
				<div class="flex items-center justify-between">
					<span>Antrean True-Up Tertunda:</span>
					<strong class="font-bold" style="color: var(--pill-warning-text);">3 Nota Belum Final</strong>
				</div>
			</div>

			<p class="text-xs leading-relaxed" style="color: var(--pill-warning-text);">
				<strong>Perhatian:</strong> Menutup periode fiskal akan mengunci seluruh posting jurnal September 2026. Anda disarankan menyelesaikan 3 nota True-Up terlebih dahulu agar HPP definitif terkunci.
			</p>

			<div class="section-footer-action">
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
					style="background: var(--bg-panel-sub); color: var(--text-muted); border: 1px solid var(--border-panel);"
					onclick={() => (showClosePeriodModal = false)}
				>
					Batal
				</button>
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
					style="background: #2563eb;"
					onclick={() => {
						showClosePeriodModal = false;
						periodCloseStatus = 'Periode Fiskal September 2026 berhasil ditutup definitif. Buku terkunci dari mutasi kas baru.';
						setTimeout(() => (periodCloseStatus = null), 4000);
					}}
				>
					Lanjutkan Tutup Periode
				</button>
			</div>
		</div>
	</div>
{/if}
