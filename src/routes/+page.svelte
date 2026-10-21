<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '#lib/auth/session.svelte.js';
	import { dashboardStore } from '#lib/features/dashboard/stores/dashboard.svelte.js';
	import { DEMO_OUTLETS } from '#lib/auth/scope.js';
	import '#lib/features/dashboard/dashboard.css';

	// Kartu-kartu Proyeksi Dashboard (Component-First)
	import ActionCenterCard from '#lib/features/dashboard/components/ActionCenterCard.svelte';
	import SalesSummaryCard from '#lib/features/dashboard/components/SalesSummaryCard.svelte';
	import GrossProfitCard from '#lib/features/dashboard/components/GrossProfitCard.svelte';
	import OutletComparisonCard from '#lib/features/dashboard/components/OutletComparisonCard.svelte';
	import StockIssuesCard from '#lib/features/dashboard/components/StockIssuesCard.svelte';
	import HqPayablesCard from '#lib/features/dashboard/components/HqPayablesCard.svelte';
	import PettyCashCard from '#lib/features/dashboard/components/PettyCashCard.svelte';
	import OutletOpsStatusCard from '#lib/features/dashboard/components/OutletOpsStatusCard.svelte';
	import OutletEodStatusCard from '#lib/features/dashboard/components/OutletEodStatusCard.svelte';
	import PaymentReconciliationCard from '#lib/features/dashboard/components/PaymentReconciliationCard.svelte';
	import TrueUpPendingCard from '#lib/features/dashboard/components/TrueUpPendingCard.svelte';
	import SmStockMinCard from '#lib/features/dashboard/components/SmStockMinCard.svelte';
	import SmCountScheduleCard from '#lib/features/dashboard/components/SmCountScheduleCard.svelte';
	import SmPettyCashCard from '#lib/features/dashboard/components/SmPettyCashCard.svelte';
	import SmProposalsCard from '#lib/features/dashboard/components/SmProposalsCard.svelte';
	import SmEodStatusCard from '#lib/features/dashboard/components/SmEodStatusCard.svelte';
	import SmQuickLinksBar from '#lib/features/dashboard/components/SmQuickLinksBar.svelte';

	// Komponen Khusus Cockpit Ringkasan Owner & HQ Admin
	import OwnerPulseStrip from '#lib/features/dashboard/components/OwnerPulseStrip.svelte';
	import OwnerLiveTrafficCard from '#lib/features/dashboard/components/OwnerLiveTrafficCard.svelte';
	import OwnerAlertRadarCard from '#lib/features/dashboard/components/OwnerAlertRadarCard.svelte';
	import OwnerOutletRankCard from '#lib/features/dashboard/components/OwnerOutletRankCard.svelte';
	import OwnerTopProductsCard from '#lib/features/dashboard/components/OwnerTopProductsCard.svelte';
	import OwnerCashRiskCard from '#lib/features/dashboard/components/OwnerCashRiskCard.svelte';
	import OwnerQuickLinksBar from '#lib/features/dashboard/components/OwnerQuickLinksBar.svelte';

	// Komponen Khusus Cockpit Finansial
	import FinancePulseStrip from '#lib/features/dashboard/components/FinancePulseStrip.svelte';
	import FinanceQuickLinksBar from '#lib/features/dashboard/components/FinanceQuickLinksBar.svelte';

	// Komponen Khusus Cockpit Brand & Area Manager
	import BrandPulseStrip from '#lib/features/dashboard/components/BrandPulseStrip.svelte';
	import BrandOutletHealthMatrixCard, { type OutletHealthData } from '#lib/features/dashboard/components/BrandOutletHealthMatrixCard.svelte';
	import BrandTaskActionRadarCard from '#lib/features/dashboard/components/BrandTaskActionRadarCard.svelte';
	import BrandMenuPerformanceCard from '#lib/features/dashboard/components/BrandMenuPerformanceCard.svelte';
	import BrandPromoConsistencyCard from '#lib/features/dashboard/components/BrandPromoConsistencyCard.svelte';
	import BrandOutletComparisonCard from '#lib/features/dashboard/components/BrandOutletComparisonCard.svelte';
	import BrandOutletDetailModal from '#lib/features/dashboard/components/BrandOutletDetailModal.svelte';
	import BrandQuickLinksBar from '#lib/features/dashboard/components/BrandQuickLinksBar.svelte';

	import Icon from '#lib/components/data/Icon.svelte';

	// Label Peran Pengguna
	const roleLabels: Record<string, string> = {
		owner: 'Owner & Pimpinan',
		hq_admin: 'Admin Pusat (HQ)',
		finance: 'Finance & Akuntansi',
		brand_manager: 'Brand & Organisasi Manager',
		store_manager: 'Store Manager (Gerai)',
		cashier: 'Kasir POS'
	};

	let selectedOutletDetail = $state<OutletHealthData | null>(null);

	const currentRole = $derived(session.role || 'owner');
	const roleTitle = $derived(roleLabels[currentRole] || 'Pengguna');
	const userName = $derived(session.user?.name || 'Pengguna Hanjo');

	const isStoreManager = $derived(session.role === 'store_manager' || session.role === 'cashier');



	function normalizeScope(id: string | null | undefined): string {
		if (!id || id === 'all') return '*';
		return id;
	}

	// Inisialisasi data dashboard saat komponen dimuat atau sesi berubah
	onMount(() => {
		if (session.activeOrganizationId) {
			dashboardStore.organizationId = normalizeScope(session.activeOrganizationId);
		}
		if (session.activeOutletId) {
			dashboardStore.outletId = normalizeScope(session.activeOutletId);
		}
		dashboardStore.refreshAll();
	});

	$effect(() => {
		// Sinkronisasi jika peran, organisasi, atau outlet sesi berubah dari menu Dev / Header
		const normalizedOrg = normalizeScope(session.activeOrganizationId);
		const normalizedOutlet = normalizeScope(session.activeOutletId);

		let needsRefresh = false;
		if (normalizedOrg && dashboardStore.organizationId !== normalizedOrg) {
			dashboardStore.organizationId = normalizedOrg;
			if (normalizedOrg !== '*') {
				const outletsInOrg = DEMO_OUTLETS.filter((o) => o.organization_id === normalizedOrg);
				if (!outletsInOrg.some((o) => o.id === dashboardStore.outletId)) {
					dashboardStore.setOutlet('*');
					session.setOutlet('*');
				}
			}
			needsRefresh = true;
		}
		if (normalizedOutlet && dashboardStore.outletId !== normalizedOutlet) {
			dashboardStore.outletId = normalizedOutlet;
			needsRefresh = true;
		}
		if (needsRefresh) {
			dashboardStore.refreshAll();
		}
	});



	function handleOwnerTypeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		dashboardStore.setOwnerType(target.value as any);
	}

	function handleDateRangeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		dashboardStore.setDateRange(target.value as any);
	}
</script>

<svelte:head>
	<title>Executive Dashboard ({roleTitle}) | HANJO ERP</title>
</svelte:head>

<div class="dashboard-root">
	<!-- Top Greeting & Contextual Filter Toolbar (PRD 8.1, MILESTONE.md §MS-01) -->
	<header class="dashboard-topbar">
		<div class="topbar-greeting">
			<h1 class="dashboard-user-greeting">Halo, <span>{userName}</span></h1>
		</div>

		<!-- Toolbar Filter Kontekstual Halaman (Lega, Rapi, Fokus Kontrol) -->
		<div class="topbar-filters">



			<!-- Filter Kepemilikan (Khusus Owner / HQ) -->
			{#if !isStoreManager}
				<div class="filter-group group-owner">
					<label for="dash-owner-filter" class="filter-label">Kepemilikan</label>
					<select
						id="dash-owner-filter"
						class="filter-select select-owner"
						value={dashboardStore.ownerType}
						onchange={handleOwnerTypeChange}
					>
						<option value="all">Semua Jenis</option>
						<option value="own_company">Milik Sendiri</option>
						<option value="partner">Mitra Investor</option>
					</select>
				</div>
			{/if}

				<!-- Filter Rentang Waktu -->
				<div class="filter-group group-period">
					<label for="dash-date-filter" class="filter-label">Periode</label>
					<select
						id="dash-date-filter"
						class="filter-select select-period"
						value={dashboardStore.dateRange}
						onchange={handleDateRangeChange}
					>
						<option value="today">Hari Ini (13 Okt)</option>
						<option value="7days">7 Hari Terakhir</option>
						<option value="month">Bulan Ini (Okt 2026)</option>
					</select>
				</div>

				<!-- Tombol Segarkan Kartu (Cukup Icon Reset) -->
				<button
					type="button"
					class="btn-refresh"
					title="Segarkan data seluruh kartu"
					aria-label="Segarkan data seluruh kartu"
					onclick={() => dashboardStore.refreshAll()}
				>
					<Icon name="arrow-path" size={16} />
				</button>
			</div>
		</header>

		<!-- Fluid Responsive Card Grid (T-01.5: Tablet ≥ 768px hingga Desktop) -->
		<main class="dashboard-grid" id="dashboard-cards-container">
		{#if currentRole === 'owner' || currentRole === 'hq_admin'}
			<!-- 1. DASHBOARD OWNER & HQ ADMIN (Cockpit Fokus: Live Omzet, Penjualan Hari Ini vs Kemarin, Notifikasi & Persetujuan, Akses Cepat) -->
			<!-- Row 1: 4 Kartu Pulse Finansial & Operasional -->
			<OwnerPulseStrip />

			<!-- Row 2: Live Traffic Hari Ini vs Kemarin & Notifikasi Otorisasi (Tinggi Seimbang) -->
			<OwnerLiveTrafficCard />
			<OwnerAlertRadarCard />

			<!-- Row 3: Widget Analitik Selebar Penuh (Ranking Gerai, Top Produk, Saldo Kas & Void) -->
			<OwnerOutletRankCard />
			<OwnerTopProductsCard />
			<OwnerCashRiskCard />

			<!-- Row 4: Aksi Eksekutif & Tautan Cepat -->
			<OwnerQuickLinksBar />

		{:else if currentRole === 'finance'}
			<!-- 2. DASHBOARD FINANCE COCKPIT (Financial Pulse, Notifikasi & Rekonsiliasi, AP Aging, Petty Cash & True-Up) -->
			<FinancePulseStrip />
			<ActionCenterCard colSpan="col-12 col-lg-6" />
			<PaymentReconciliationCard />
			<HqPayablesCard />
			<GrossProfitCard />
			<PettyCashCard />
			<TrueUpPendingCard />
			<FinanceQuickLinksBar />

		{:else if currentRole === 'brand_manager'}
			<!-- 3. DASHBOARD BRAND & ORGANISASI MANAGER (Multi-Outlet Cockpit) -->
			<!-- Row 1: KPI Brand (Omzet Brand LFL, Outlet Butuh Perhatian, Estimasi Food Cost %, Kas Gabungan) -->
			<BrandPulseStrip
				onSelectOutletAlert={(name) => {
					selectedOutletDetail = {
						id: name.toLowerCase().includes('dago') ? 'out-bdg-01' : 'out-sub-01',
						name: name,
						city: name.toLowerCase().includes('dago') ? 'Bandung' : 'Surabaya',
						type: name.toLowerCase().includes('dago') ? 'Outlet Mandiri' : 'Outlet Kemitraan',
						omzet: name.toLowerCase().includes('dago') ? '2430000.00' : '1200000.00',
						target_omzet: name.toLowerCase().includes('dago') ? '2500000.00' : '1500000.00',
						target_pct: name.toLowerCase().includes('dago') ? 97.2 : 80.0,
						target_status: name.toLowerCase().includes('dago') ? 'warning' : 'danger',
						critical_stock_count: name.toLowerCase().includes('dago') ? 1 : 0,
						critical_stock_item: name.toLowerCase().includes('dago') ? 'Fresh Milk 8L' : undefined,
						critical_stock_status: name.toLowerCase().includes('dago') ? 'danger' : 'success',
						kds_avg_minutes: name.toLowerCase().includes('dago') ? 7.8 : 3.9,
						kds_status: name.toLowerCase().includes('dago') ? 'warning' : 'success',
						petty_cash_spent: name.toLowerCase().includes('dago') ? '150000.00' : '95000.00',
						petty_cash_limit: name.toLowerCase().includes('dago') ? '300000.00' : '250000.00',
						petty_cash_pct: name.toLowerCase().includes('dago') ? 50.0 : 38.0,
						petty_cash_status: name.toLowerCase().includes('dago') ? 'warning' : 'success',
						sync_status: name.toLowerCase().includes('dago') ? 'online' : 'delayed',
						sync_last_seen: name.toLowerCase().includes('dago') ? '4m lalu' : 'Delay 15m'
					};
				}}
			/>

			<!-- Row 2: Bagian Utama (Peta Kesehatan Outlet Hero & Tugas Brand Manager) -->
			<BrandOutletHealthMatrixCard
				onSelectOutlet={(out) => (selectedOutletDetail = out)}
			/>
			<BrandTaskActionRadarCard />

			<!-- Row 3: Analisis Brand (Performa Menu Inti vs Lokal, Efektivitas Promo, Komparasi Gerai & Tim Shift) -->
			<BrandMenuPerformanceCard />
			<BrandPromoConsistencyCard />
			<BrandOutletComparisonCard />

			<!-- Row 4: Aksi Eksekutif & Alat Kendali Brand Manager -->
			<BrandQuickLinksBar />

		{:else if currentRole === 'store_manager'}
			<!-- 4. DASHBOARD STORE MANAGER (Single-Outlet Operational Cockpit) -->
			<!-- Row 1: Penjualan Gerai & Tindakan Mendesak -->
			<SalesSummaryCard />
			<ActionCenterCard colSpan="col-12 col-lg-4" />

			<!-- Row 2: Stok Kritis & Kas Kecil Gerai -->
			<SmStockMinCard />
			<SmPettyCashCard />

			<!-- Row 3: Tutup Hari (EOD) & Stock Opname Gerai -->
			<SmEodStatusCard />
			<SmCountScheduleCard />

			<!-- Row 4: Usulan Menu Lokal & Status Konektivitas POS Gerai -->
			<SmProposalsCard />
			<OutletOpsStatusCard />

			<!-- Row 5: Pintasan Operasional Store Manager -->
			<SmQuickLinksBar />

		{:else}
			<!-- Fallback Kasir / Workspace POS -->
			<ActionCenterCard />
			<div class="col-12 p-8 text-center rounded-xl flex flex-col items-center justify-center gap-4" style="background: var(--bg-panel); border: 1px solid var(--border-panel); min-height: 240px;">
				<div class="w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-500" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25);">
					<Icon name="device-tablet" size={28} />
				</div>
				<div class="max-w-md">
					<h3 class="text-lg font-bold text-main m-0">Terminal Kasir POS Siap Digunakan</h3>
					<p class="text-sm text-muted mt-1 mb-0">
						Selamat bertugas! Gunakan terminal kasir untuk input pesanan dine-in, takeaway, serta penerimaan pembayaran tunai &amp; QRIS.
					</p>
				</div>
				<a
					href="/pos"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all shadow-sm"
					style="background: var(--primary, #059669); text-decoration: none;"
				>
					<Icon name="arrow-right" size={18} />
					<span>Buka Terminal Kasir (POS)</span>
				</a>
			</div>
		{/if}
	</main>
</div>

<!-- Modal Detail Operasional Per Outlet (Drilldown dari Peta Kesehatan Gerai) -->
{#if selectedOutletDetail}
	<BrandOutletDetailModal
		outlet={selectedOutletDetail}
		onClose={() => (selectedOutletDetail = null)}
	/>
{/if}
