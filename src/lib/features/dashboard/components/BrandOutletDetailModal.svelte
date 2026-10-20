<script lang="ts">
	/**
	 * BrandOutletDetailModal.svelte
	 * Layar Operasional Per Outlet (Drilldown dari Peta Kesehatan Outlet)
	 *
	 * Memanfaatkan ulang rancangan layar operasional gerai:
	 * 1. Grafik komparasi jam per jam gerai
	 * 2. Bahan kritis & stok menipis
	 * 3. Status kas kecil & belanja luar
	 * 4. Tutup hari (EOD) & kas laci
	 * 5. KDS & tugas shift
	 */
	import type { OutletHealthData } from './BrandOutletHealthMatrixCard.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Badge from '../../../components/data/Badge.svelte';

	interface Props {
		outlet: OutletHealthData | null;
		onClose: () => void;
	}

	let { outlet, onClose }: Props = $props();

	let activeTab = $state<'traffic' | 'stock' | 'cash' | 'eod'>('traffic');

	// Mock data jam per jam gerai terpilih
	const hourlyData = [
		{ hour: '08:00', omzet: '180000.00', cups: 10 },
		{ hour: '10:00', omzet: '320000.00', cups: 16 },
		{ hour: '12:00', omzet: '580000.00', cups: 28 },
		{ hour: '14:00', omzet: '390000.00', cups: 18 },
		{ hour: '16:00', omzet: '280000.00', cups: 14 },
		{ hour: '18:00', omzet: '420000.00', cups: 20 },
		{ hour: '20:00', omzet: '260000.00', cups: 16 }
	];
</script>

{#if outlet}
	<div
		class="contact-modal-backdrop animate-fadeIn"
		role="presentation"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="contact-modal-box max-w-2xl w-full"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			style="max-width: 680px;"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between pb-3 mb-3 border-b" style="border-color: var(--border-panel);">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">
						<Icon name="building-storefront" size={20} />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-base font-bold m-0" style="color: var(--text-main);">{outlet.name}</h3>
							<Badge variant={outlet.target_status} text="{outlet.target_pct}% Target" size="sm" />
						</div>
						<span class="text-xs text-muted">
							{outlet.city} &bull; {outlet.type} &bull; Sinkronisasi: <strong>{outlet.sync_last_seen}</strong>
						</span>
					</div>
				</div>
				<button type="button" class="text-sm text-muted hover:text-main p-1.5 cursor-pointer rounded-lg hover:bg-panel" onclick={onClose}>✕</button>
			</div>

			<!-- Tab Switcher -->
			<div class="dash-tab-switch mb-3">
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeTab === 'traffic'}
					onclick={() => (activeTab = 'traffic')}
				>
					Grafik Jam per Jam
				</button>
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeTab === 'stock'}
					onclick={() => (activeTab = 'stock')}
				>
					Bahan Kritis ({outlet.critical_stock_count})
				</button>
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeTab === 'cash'}
					onclick={() => (activeTab = 'cash')}
				>
					Kas Kecil ({outlet.petty_cash_pct}%)
				</button>
				<button
					type="button"
					class="dash-tab-btn"
					class:active={activeTab === 'eod'}
					onclick={() => (activeTab = 'eod')}
				>
					Tutup Hari (EOD)
				</button>
			</div>

			<!-- Tab Content Body -->
			{#if activeTab === 'traffic'}
				<!-- 1. Grafik Jam per Jam Gerai Ini -->
				<div class="dash-subbox p-3 flex flex-col gap-2.5">
					<div class="flex items-center justify-between text-xs">
						<span class="font-bold" style="color: var(--text-main);">Tren Jam Penjualan Gerai Hari Ini:</span>
						<span class="font-mono font-bold" style="color: #60a5fa;">Total: {formatRupiah(outlet.omzet)}</span>
					</div>

					<!-- Mini Hourly Bar Grid -->
					<div class="flex items-end justify-between gap-2 h-28 pt-2 pb-1 px-2" style="background: rgba(0,0,0,0.15); border-radius: 8px;">
						{#each hourlyData as h}
							{@const val = parseFloat(h.omzet) || 0}
							{@const height = (val / 600000) * 100}
							<div class="flex flex-col items-center flex-1 h-full justify-end gap-1" title="Jam {h.hour}: {formatRupiah(h.omzet)} ({h.cups} cup)">
								<div class="w-full rounded-t transition-all hover:opacity-80" style="height: {height}%; background: #3b82f6;"></div>
								<span class="text-[9px] font-mono text-muted">{h.hour}</span>
							</div>
						{/each}
					</div>

					<div class="flex items-center justify-between text-xs text-muted pt-1 border-t" style="border-color: var(--border-panel);">
						<span>Waktu Saji Rata-rata KDS: <strong style="color: #34d399;">{outlet.kds_avg_minutes} menit</strong></span>
						<span>Status: <strong style="color: var(--text-main);">Operasional Buka</strong></span>
					</div>
				</div>

			{:else if activeTab === 'stock'}
				<!-- 2. Stok Bahan Kritis -->
				<div class="dash-subbox p-3 flex flex-col gap-2">
					{#if outlet.critical_stock_count > 0}
						<div class="dash-banner dash-banner-danger flex items-center justify-between p-2.5">
							<div class="flex items-center gap-2">
								<Icon name="exclamation-triangle" size={16} />
								<div class="text-xs">
									<strong>Peringatan Stok Kritis:</strong> {outlet.critical_stock_item} berada di bawah batas aman.
								</div>
							</div>
							<a href="/inventory#transfer" class="btn-approve-direct text-[11px] py-1 px-2.5" style="background: #2563eb; border-color: #3b82f6;">
								Transfer Stok &rarr;
							</a>
						</div>
						<div class="text-xs text-muted leading-relaxed mt-1">
							Sistem merekomendasikan transfer 15L Fresh Milk dari gerai Jodi Dago yang memiliki stok berlebih hari ini.
						</div>
					{:else}
						<div class="p-6 text-center text-muted">
							<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
							<p class="text-xs font-semibold" style="color: var(--text-main);">Seluruh stok bahan gerai ini aman</p>
							<p class="text-[11px] text-muted m-0">Tidak ada persediaan yang berada di bawah ambang batas minimum.</p>
						</div>
					{/if}
				</div>

			{:else if activeTab === 'cash'}
				<!-- 3. Kas Kecil & Pengeluaran -->
				<div class="dash-subbox p-3 flex flex-col gap-2.5">
					<div class="flex items-center justify-between text-xs">
						<span class="font-bold" style="color: var(--text-main);">Penggunaan Plafon Kas Harian:</span>
						<span class="font-mono font-bold" style="color: #fbbf24;">{outlet.petty_cash_pct}% Terpakai</span>
					</div>

					<div class="w-full h-2 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.06);">
						<div style="width: {outlet.petty_cash_pct}%; background: {outlet.petty_cash_pct > 60 ? '#f59e0b' : '#10b981'}; height: 100%;"></div>
					</div>

					<div class="flex items-center justify-between text-xs text-muted pt-1">
						<span>Terpakai: <strong style="color: var(--text-main);">{formatRupiah(outlet.petty_cash_spent)}</strong></span>
						<span>Batas Harian: <strong>{formatRupiah(outlet.petty_cash_limit)}</strong></span>
					</div>
				</div>

			{:else}
				<!-- 4. Tutup Hari (EOD) -->
				<div class="dash-subbox p-3 flex flex-col gap-2">
					<div class="flex items-center justify-between text-xs">
						<span class="font-bold" style="color: var(--text-main);">Status Tutup Kas Laci (EOD):</span>
						<Badge variant="warning" text="Menunggu Tutup Gerai" size="sm" />
					</div>
					<p class="text-xs text-muted leading-relaxed m-0">
						Tutup kas laci dan sinkronisasi laporan penjualan akhir hari dijadwalkan pukul <strong>22:00 WIB</strong> setelah shift malam selesai bertugas.
					</p>
				</div>
			{/if}

			<!-- Modal Footer -->
			<div class="flex items-center justify-between pt-3 mt-3 border-t text-xs" style="border-color: var(--border-panel);">
				<span class="text-muted">ID Gerai: <strong class="font-mono">{outlet.id}</strong></span>
				<button type="button" class="btn-reject-direct py-1.5 px-4" onclick={onClose}>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
