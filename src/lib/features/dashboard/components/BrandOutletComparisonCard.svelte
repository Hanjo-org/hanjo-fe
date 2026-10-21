<script lang="ts">
	/**
	 * BrandOutletComparisonCard.svelte
	 * Komparasi 2 Gerai Berdampingan & Status Tim / Shift Barista
	 *
	 * 1. Pemilih 2 gerai berdampingan (misal Jodi Senopati vs Jodi Dago)
	 * 2. Perbandingan metrik utama (Omzet, Waktu Saji, Struk, Top Produk)
	 * 3. Indikator absensi / kecukupan orang di shift aktif
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Badge from '../../../components/data/Badge.svelte';

	let outletA = $state<string>('out-jkt-01'); // Senopati
	let outletB = $state<string>('out-bdg-01'); // Dago

	const outletData: Record<string, { name: string; omzet: string; cups: number; kds: string; aov: string; topMenu: string }> = {
		'out-jkt-01': { name: 'Jodi Senopati', omzet: '4820000.00', cups: 238, kds: '4.2 mnt', aov: '38.870', topMenu: 'Kopi Susu Aren' },
		'out-bdg-01': { name: 'Jodi Dago', omzet: '2430000.00', cups: 122, kds: '7.8 mnt', aov: '37.960', topMenu: 'Pandan Latte' },
		'out-sub-01': { name: 'Jodi Gubeng', omzet: '1200000.00', cups: 52, kds: '3.9 mnt', aov: '23.070', topMenu: 'Americano' }
	};

	const dataA = $derived(outletData[outletA]);
	const dataB = $derived(outletData[outletB]);
</script>

<DashboardCardFrame
	cardKey="outlet_comparison"
	customContent={true}
	title="Komparasi Gerai & Tim Shift"
	icon="users"
	subtitle="Bandingkan 2 gerai berdampingan & pantau kecukupan tim kasir / barista"
	badgeText="17/18 Barista"
	badgeVariant="info"
	colSpan="col-12 col-md-6 col-lg-4"
>
	<div class="flex flex-col gap-2.5">
		<!-- 1. Pemilih 2 Gerai Berdampingan -->
		<div class="dash-subbox p-2.5 flex flex-col gap-2">
			<div class="flex items-center justify-between gap-2">
				<select
					class="filter-select text-xs py-1 px-2 flex-1"
					bind:value={outletA}
					aria-label="Pilih Gerai A"
				>
					<option value="out-jkt-01">Jodi Senopati</option>
					<option value="out-bdg-01">Jodi Dago</option>
					<option value="out-sub-01">Jodi Gubeng</option>
				</select>
				<span class="text-xs font-bold text-muted">VS</span>
				<select
					class="filter-select text-xs py-1 px-2 flex-1"
					bind:value={outletB}
					aria-label="Pilih Gerai B"
				>
					<option value="out-bdg-01">Jodi Dago</option>
					<option value="out-jkt-01">Jodi Senopati</option>
					<option value="out-sub-01">Jodi Gubeng</option>
				</select>
			</div>

			<!-- Tabel Komparasi Berdampingan -->
			<div class="flex flex-col gap-1.5 pt-1 text-xs">
				<div class="flex items-center justify-between py-1 border-b" style="border-color: var(--border-panel);">
					<span class="font-mono font-bold" style="color: var(--brand-primary);">{formatRupiah(dataA.omzet)}</span>
					<span class="text-[10.5px] text-muted">Omzet Hari Ini</span>
					<span class="font-mono font-bold" style="color: var(--pill-info-text);">{formatRupiah(dataB.omzet)}</span>
				</div>
				<div class="flex items-center justify-between py-1 border-b" style="border-color: var(--border-panel);">
					<span class="font-mono font-semibold" style="color: var(--text-main);">{dataA.cups} cup</span>
					<span class="text-[10.5px] text-muted">Volume Transaksi</span>
					<span class="font-mono font-semibold" style="color: var(--text-main);">{dataB.cups} cup</span>
				</div>
				<div class="flex items-center justify-between py-1 border-b" style="border-color: var(--border-panel);">
					<span class="font-mono font-bold" style="color: var(--pill-success-text);">{dataA.kds}</span>
					<span class="text-[10.5px] text-muted">Waktu Saji Rata-rata</span>
					<span class="font-mono font-bold" style="color: var(--pill-warning-text);">{dataB.kds}</span>
				</div>
				<div class="flex items-center justify-between py-1 text-[11px]">
					<span class="truncate max-w-[85px] font-medium" style="color: var(--text-muted);">{dataA.topMenu}</span>
					<span class="text-[10.5px] text-muted">Menu Favorit</span>
					<span class="truncate max-w-[85px] font-medium text-right" style="color: var(--text-muted);">{dataB.topMenu}</span>
				</div>
			</div>
		</div>

		<!-- 2. Status Tim & Shift Kerja Barista -->
		<div class="dash-subbox p-2.5 flex flex-col gap-1.5" style="border-left: 3px solid var(--color-warning, #f59e0b);">
			<div class="flex items-center justify-between text-xs">
				<span class="font-bold" style="color: var(--text-main);">Kecukupan Tim Barista &amp; Shift:</span>
				<Badge variant="warning" text="1 Gerai Kurang Orang" size="sm" />
			</div>
			<div class="text-[11px] leading-relaxed" style="color: var(--text-muted);">
				<strong>Jodi Gubeng:</strong> 1 kasir shift sore izin sakit (sementara didukung SM Dimas). Senopati (8/8) &amp; Dago (6/6) beroperasi kapasitas penuh.
			</div>
		</div>
	</div>
</DashboardCardFrame>
