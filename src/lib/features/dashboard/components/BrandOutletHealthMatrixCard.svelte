<script lang="ts">
	/**
	 * BrandOutletHealthMatrixCard.svelte
	 * Peta Kesehatan Outlet (Hero Dashboard Brand Manager)
	 *
	 * Baris = Outlet
	 * Kolom = Omzet vs Target, Stok Kritis, Waktu Saji KDS, Kas Kecil, Status Sinkronisasi
	 * Tiap sel dilengkapi teks, angka, status warna, dan IKON visual.
	 * Klik baris untuk membuka detail operasional gerai & grafik jam per jam.
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';

	export interface OutletHealthData {
		id: string;
		name: string;
		city: string;
		type: string;
		omzet: string;
		target_omzet: string;
		target_pct: number;
		target_status: 'success' | 'warning' | 'danger';
		critical_stock_count: number;
		critical_stock_item?: string;
		critical_stock_status: 'success' | 'danger';
		kds_avg_minutes: number;
		kds_status: 'success' | 'warning';
		petty_cash_spent: string;
		petty_cash_limit: string;
		petty_cash_pct: number;
		petty_cash_status: 'success' | 'warning';
		sync_status: 'online' | 'delayed';
		sync_last_seen: string;
	}

	interface Props {
		onSelectOutlet?: (outlet: OutletHealthData) => void;
	}

	let { onSelectOutlet }: Props = $props();

	// Data Peta Kesehatan 3 Gerai Seduhan Kopi Jodi (s/d 21:00 WIB)
	const outletsHealth: OutletHealthData[] = [
		{
			id: 'out-jkt-01',
			name: 'Jodi Senopati',
			city: 'Jakarta Selatan',
			type: 'Flagship Store',
			omzet: '4820000.00',
			target_omzet: '4500000.00',
			target_pct: 107.1,
			target_status: 'success',
			critical_stock_count: 0,
			critical_stock_status: 'success',
			kds_avg_minutes: 4.2,
			kds_status: 'success',
			petty_cash_spent: '85000.00',
			petty_cash_limit: '300000.00',
			petty_cash_pct: 28.3,
			petty_cash_status: 'success',
			sync_status: 'online',
			sync_last_seen: '2m lalu'
		},
		{
			id: 'out-bdg-01',
			name: 'Jodi Dago',
			city: 'Bandung',
			type: 'Outlet Mandiri',
			omzet: '2430000.00',
			target_omzet: '2500000.00',
			target_pct: 97.2,
			target_status: 'warning',
			critical_stock_count: 1,
			critical_stock_item: 'Fresh Milk 8L',
			critical_stock_status: 'danger',
			kds_avg_minutes: 7.8,
			kds_status: 'warning',
			petty_cash_spent: '150000.00',
			petty_cash_limit: '300000.00',
			petty_cash_pct: 50.0,
			petty_cash_status: 'warning',
			sync_status: 'online',
			sync_last_seen: '4m lalu'
		},
		{
			id: 'out-sub-01',
			name: 'Jodi Gubeng',
			city: 'Surabaya',
			type: 'Outlet Kemitraan',
			omzet: '1200000.00',
			target_omzet: '1500000.00',
			target_pct: 80.0,
			target_status: 'danger',
			critical_stock_count: 0,
			critical_stock_status: 'success',
			kds_avg_minutes: 3.9,
			kds_status: 'success',
			petty_cash_spent: '95000.00',
			petty_cash_limit: '250000.00',
			petty_cash_pct: 38.0,
			petty_cash_status: 'success',
			sync_status: 'delayed',
			sync_last_seen: 'Delay 15m'
		}
	];
</script>

<DashboardCardFrame
	cardKey="outlet_comparison"
	customContent={true}
	title="Peta Kesehatan Outlet (Hero)"
	icon="building-storefront"
	subtitle="Pantauan real-time performa, stok kritis, kecepatan saji KDS, dan kas laci seluruh gerai brand"
	badgeText="3 Gerai Aktif"
	badgeVariant="info"
	colSpan="col-12 col-lg-7"
>
	<!-- Petunjuk Interaktif -->
	<div class="flex items-center justify-between mb-2 text-xs text-muted flex-wrap gap-2">
		<span>Indikator komprehensif kesehatan operasional seluruh outlet di bawah naungan brand Anda</span>
		<span class="text-primary font-semibold text-[11px]">&bull; Klik baris untuk detail operasional &amp; grafik</span>
	</div>

	<!-- Tabel Matriks Responsif -->
	<div class="overflow-x-auto rounded-lg border" style="border-color: var(--border-panel); background: var(--bg-panel-sub);">
		<table class="w-full text-left text-xs border-collapse">
			<thead>
				<tr class="border-b font-semibold" style="border-color: var(--border-panel); color: var(--text-muted); background: rgba(0,0,0,0.12);">
					<th class="py-2.5 px-3">Gerai / Lokasi</th>
					<th class="py-2.5 px-3">Omzet vs Target</th>
					<th class="py-2.5 px-3">Stok Kritis</th>
					<th class="py-2.5 px-3">Saji KDS</th>
					<th class="py-2.5 px-3">Kas Kecil</th>
					<th class="py-2.5 px-3 text-center">Sync POS</th>
					<th class="py-2.5 px-2 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y" style="border-color: var(--border-panel);">
				{#each outletsHealth as out}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<tr
						class="hover:bg-panel cursor-pointer transition-colors group"
						onclick={() => onSelectOutlet?.(out)}
						title="Klik untuk membuka detail operasional {out.name}"
					>
						<!-- 1. Outlet & Tipe -->
						<td class="py-3 px-3">
							<div class="font-bold text-xs group-hover:text-primary transition-colors" style="color: var(--text-main);">
								{out.name}
							</div>
							<div class="text-[10px]" style="color: var(--text-muted);">
								{out.city} &bull; <span class="font-medium">{out.type}</span>
							</div>
						</td>

						<!-- 2. Omzet vs Target (Warna + Ikon) -->
						<td class="py-3 px-3 font-mono">
							<div class="flex items-center gap-1.5 font-bold text-xs">
								{#if out.target_status === 'success'}
									<Icon name="check-circle" size={13} class="text-success" />
									<span style="color: #34d399;">{out.target_pct}%</span>
								{:else if out.target_status === 'warning'}
									<Icon name="arrow-trending-up" size={13} class="text-warning" />
									<span style="color: #fbbf24;">{out.target_pct}%</span>
								{:else}
									<Icon name="arrow-trending-down" size={13} class="text-danger" />
									<span style="color: #f87171;">{out.target_pct}%</span>
								{/if}
							</div>
							<div class="text-[10.5px]" style="color: var(--text-muted);">
								{formatRupiah(out.omzet)} <span class="text-[9.5px]">/ {formatRupiah(out.target_omzet)}</span>
							</div>
						</td>

						<!-- 3. Stok Kritis (Warna + Ikon) -->
						<td class="py-3 px-3">
							{#if out.critical_stock_status === 'success'}
								<span
									class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
									style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25);"
								>
									<Icon name="check" size={12} />
									<span>Aman (0)</span>
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded"
									style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35);"
									title="Bahan kritis: {out.critical_stock_item}"
								>
									<Icon name="exclamation-triangle" size={12} />
									<span>{out.critical_stock_count} Kritis</span>
								</span>
								<div class="text-[10px] text-danger font-medium mt-0.5 truncate max-w-[90px]">
									{out.critical_stock_item}
								</div>
							{/if}
						</td>

						<!-- 4. Kecepatan Saji KDS (Warna + Ikon) -->
						<td class="py-3 px-3">
							<div class="flex items-center gap-1.5 font-bold font-mono text-xs">
								{#if out.kds_status === 'success'}
									<Icon name="bolt" size={13} class="text-success" />
									<span style="color: #34d399;">{out.kds_avg_minutes} mnt</span>
								{:else}
									<Icon name="clock" size={13} class="text-warning" />
									<span style="color: #fbbf24;">{out.kds_avg_minutes} mnt</span>
								{/if}
							</div>
							<div class="text-[10px]" style="color: var(--text-muted);">
								{out.kds_status === 'success' ? 'Cepat' : 'Perhatian'}
							</div>
						</td>

						<!-- 5. Kas Kecil (Warna + Ikon) -->
						<td class="py-3 px-3 font-mono">
							<div class="flex items-center gap-1 text-[11.5px] font-bold">
								{#if out.petty_cash_status === 'warning'}
									<Icon name="exclamation-circle" size={12} class="text-warning" />
									<span style="color: #fbbf24;">{out.petty_cash_pct}%</span>
								{:else}
									<Icon name="check" size={12} class="text-success" />
									<span style="color: var(--text-main);">{out.petty_cash_pct}%</span>
								{/if}
							</div>
							<div class="text-[10px]" style="color: var(--text-muted);">
								{formatRupiah(out.petty_cash_spent)}
							</div>
						</td>

						<!-- 6. Status Sinkronisasi POS (Warna + Ikon) -->
						<td class="py-3 px-3 text-center">
							{#if out.sync_status === 'online'}
								<span
									class="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
									style="background: rgba(16, 185, 129, 0.12); color: #34d399;"
								>
									<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
									{out.sync_last_seen}
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full animate-pulse"
									style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);"
								>
									<Icon name="exclamation-circle" size={11} />
									{out.sync_last_seen}
								</span>
							{/if}
						</td>

						<!-- 7. Tombol Aksi Detail -->
						<td class="py-3 px-2 text-right">
							<button
								type="button"
								class="text-xs text-primary font-bold hover:underline p-1"
								onclick={(e) => {
									e.stopPropagation();
									onSelectOutlet?.(out);
								}}
							>
								Detail &rarr;
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Ringkasan Cepat di Footer Card -->
	<div class="flex items-center justify-between pt-2.5 mt-2 border-t text-xs text-muted flex-wrap gap-2" style="border-color: var(--border-panel);">
		<span>Total Omzet Brand Terkonsolidasi: <strong style="color: var(--text-main);">Rp 8.450.000</strong></span>
		<span>Waktu Saji Rata-rata Brand: <strong style="color: #34d399;">5.3 menit</strong> (Target: &le; 6.0 mnt)</span>
	</div>
</DashboardCardFrame>
