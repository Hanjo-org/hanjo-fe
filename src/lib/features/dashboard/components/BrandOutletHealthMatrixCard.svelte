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
	<div class="flex items-center justify-between mb-2.5 text-xs flex-wrap gap-2">
		<span style="color: var(--text-muted);">Indikator komprehensif kesehatan operasional seluruh outlet di bawah naungan brand Anda</span>
		<span class="text-primary font-semibold text-[11px]">&bull; Klik baris untuk detail operasional &amp; grafik</span>
	</div>

	<!-- Tabel Matriks Responsif -->
	<div class="health-matrix-container">
		<table class="health-matrix-table">
			<thead>
				<tr>
					<th style="width: 22%;">Gerai / Lokasi</th>
					<th style="width: 20%;">Omzet vs Target</th>
					<th style="width: 14%;">Stok Kritis</th>
					<th style="width: 14%;">Saji KDS</th>
					<th style="width: 14%;">Kas Kecil</th>
					<th class="text-center" style="width: 10%;">Sync POS</th>
					<th class="text-right" style="width: 6%;">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each outletsHealth as out}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<tr
						class="group"
						onclick={() => onSelectOutlet?.(out)}
						title="Klik untuk membuka detail operasional {out.name}"
					>
						<!-- 1. Outlet & Tipe -->
						<td>
							<div class="outlet-title group-hover:text-primary transition-colors">
								{out.name}
							</div>
							<div class="outlet-subtitle">
								{out.city} &bull; <span class="font-medium">{out.type}</span>
							</div>
						</td>

						<!-- 2. Omzet vs Target (Warna + Ikon) -->
						<td class="font-mono">
							<div class="flex items-center gap-1.5 font-bold text-xs">
								{#if out.target_status === 'success'}
									<Icon name="check-circle" size={13} class="text-success" />
									<span style="color: var(--pill-success-text);">{out.target_pct}%</span>
								{:else if out.target_status === 'warning'}
									<Icon name="arrow-trending-up" size={13} class="text-warning" />
									<span style="color: var(--pill-warning-text);">{out.target_pct}%</span>
								{:else}
									<Icon name="arrow-trending-down" size={13} class="text-danger" />
									<span style="color: var(--pill-danger-text);">{out.target_pct}%</span>
								{/if}
							</div>
							<div class="metric-subtext">
								{formatRupiah(out.omzet)} <span style="opacity: 0.8;">/ {formatRupiah(out.target_omzet)}</span>
							</div>
						</td>

						<!-- 3. Stok Kritis (Warna + Ikon) -->
						<td>
							{#if out.critical_stock_status === 'success'}
								<span
									class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
									style="background: var(--pill-success-bg); color: var(--pill-success-text); border: 1px solid var(--pill-success-border);"
								>
									<Icon name="check" size={12} />
									<span>Aman (0)</span>
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded"
									style="background: var(--pill-danger-bg); color: var(--pill-danger-text); border: 1px solid var(--pill-danger-border);"
									title="Bahan kritis: {out.critical_stock_item}"
								>
									<Icon name="exclamation-triangle" size={12} />
									<span>{out.critical_stock_count} Kritis</span>
								</span>
								<div class="text-[10px] font-medium mt-1 truncate max-w-[95px]" style="color: var(--pill-danger-text);">
									{out.critical_stock_item}
								</div>
							{/if}
						</td>

						<!-- 4. Kecepatan Saji KDS (Warna + Ikon) -->
						<td>
							<div class="flex items-center gap-1.5 font-bold font-mono text-xs">
								{#if out.kds_status === 'success'}
									<Icon name="bolt" size={13} class="text-success" />
									<span style="color: var(--pill-success-text);">{out.kds_avg_minutes} mnt</span>
								{:else}
									<Icon name="clock" size={13} class="text-warning" />
									<span style="color: var(--pill-warning-text);">{out.kds_avg_minutes} mnt</span>
								{/if}
							</div>
							<div class="metric-subtext">
								{out.kds_status === 'success' ? 'Cepat' : 'Perhatian'}
							</div>
						</td>

						<!-- 5. Kas Kecil (Warna + Ikon) -->
						<td class="font-mono">
							<div class="flex items-center gap-1 text-[11.5px] font-bold">
								{#if out.petty_cash_status === 'warning'}
									<Icon name="exclamation-circle" size={12} class="text-warning" />
									<span style="color: var(--pill-warning-text);">{out.petty_cash_pct}%</span>
								{:else}
									<Icon name="check" size={12} class="text-success" />
									<span style="color: var(--text-main);">{out.petty_cash_pct}%</span>
								{/if}
							</div>
							<div class="metric-subtext">
								{formatRupiah(out.petty_cash_spent)}
							</div>
						</td>

						<!-- 6. Status Sinkronisasi POS (Warna + Ikon) -->
						<td class="text-center">
							{#if out.sync_status === 'online'}
								<span
									class="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
									style="background: var(--pill-success-bg); color: var(--pill-success-text); border: 1px solid var(--pill-success-border);"
								>
									<span class="w-1.5 h-1.5 rounded-full" style="background: var(--color-success, #10b981);"></span>
									{out.sync_last_seen}
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full animate-pulse"
									style="background: var(--pill-warning-bg); color: var(--pill-warning-text); border: 1px solid var(--pill-warning-border);"
								>
									<Icon name="exclamation-circle" size={11} />
									{out.sync_last_seen}
								</span>
							{/if}
						</td>

						<!-- 7. Tombol Aksi Tunggal (Golden Rule 13: Lihat .btn-view-direct) -->
						<td class="text-right">
							<button
								type="button"
								class="btn-view-direct"
								onclick={(e) => {
									e.stopPropagation();
									onSelectOutlet?.(out);
								}}
								title="Buka rincian operasional gerai {out.name}"
							>
								<Icon name="eye" size={12} />
								<span>Lihat</span>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Ringkasan Cepat di Footer Card -->
	<div class="table-footer-divider flex items-center justify-between pt-3 mt-3 text-xs flex-wrap gap-2">
		<span style="color: var(--text-muted);">Total Omzet Brand Terkonsolidasi: <strong style="color: var(--text-main);">Rp 8.450.000</strong></span>
		<span style="color: var(--text-muted);">Waktu Saji Rata-rata Brand: <strong style="color: var(--pill-success-text);">5.3 menit</strong> (Target: &le; 6.0 mnt)</span>
	</div>
</DashboardCardFrame>

<style>
	.health-matrix-container {
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg, 10px);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.health-matrix-table {
		width: 100%;
		text-align: left;
		font-size: 12px;
		border-collapse: collapse;
	}

	.health-matrix-table thead tr {
		background: var(--bg-panel-sub);
	}

	.health-matrix-table th {
		padding: 12px 16px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-panel);
		white-space: nowrap;
	}

	.health-matrix-table tbody tr {
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.health-matrix-table tbody tr:hover {
		background-color: var(--bg-panel-hover);
	}

	.health-matrix-table td {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border-subtle);
		vertical-align: middle;
		color: var(--text-main);
	}

	.health-matrix-table tbody tr:last-child td {
		border-bottom: none;
	}

	.outlet-title {
		font-weight: 600;
		font-size: 13px;
		color: var(--text-main);
		line-height: 1.3;
	}

	.outlet-subtitle {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 3px;
	}

	.metric-subtext {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 3px;
	}

	.table-footer-divider {
		border-top: 1px solid var(--border-subtle);
	}
</style>
