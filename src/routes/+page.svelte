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

	// Komponen Khusus Cockpit Ringkasan Owner & HQ Admin
	import OwnerPulseStrip from '#lib/features/dashboard/components/OwnerPulseStrip.svelte';
	import OwnerLiveTrafficCard from '#lib/features/dashboard/components/OwnerLiveTrafficCard.svelte';
	import OwnerAlertRadarCard from '#lib/features/dashboard/components/OwnerAlertRadarCard.svelte';
	import OwnerQuickLinksBar from '#lib/features/dashboard/components/OwnerQuickLinksBar.svelte';

	// Komponen Khusus Cockpit Finansial
	import FinancePulseStrip from '#lib/features/dashboard/components/FinancePulseStrip.svelte';
	import FinanceQuickLinksBar from '#lib/features/dashboard/components/FinanceQuickLinksBar.svelte';
	import Icon from '#lib/components/data/Icon.svelte';

	// Label Peran Pengguna
	const roleLabels: Record<string, string> = {
		owner: 'Owner & Pimpinan',
		hq_admin: 'Admin Pusat (HQ)',
		finance: 'Finance & Akuntansi',
		store_manager: 'Store Manager Gerai',
		cashier: 'Kasir POS'
	};

	const currentRole = $derived(session.role || 'owner');
	const roleTitle = $derived(roleLabels[currentRole] || 'Pengguna');
	const userName = $derived(session.user?.name || 'Pengguna Hanjo');

	const isStoreManager = $derived(session.role === 'store_manager' || session.role === 'cashier');

	// Daftar outlet yang boleh dipilih pengguna (disaring per organisasi terpilih)
	const selectableOutlets = $derived.by(() => {
		if (isStoreManager) {
			const assignedIds = session.user?.outlet_ids || [];
			return DEMO_OUTLETS.filter((o) => assignedIds.includes(o.id));
		}
		if (dashboardStore.organizationId && dashboardStore.organizationId !== '*') {
			return DEMO_OUTLETS.filter((o) => o.organization_id === dashboardStore.organizationId);
		}
		return DEMO_OUTLETS;
	});

	function normalizeScope(id: string | null | undefined): string {
		if (!id || id === 'all') return '*';
		return id;
	}

	const selectedOutletValue = $derived(normalizeScope(dashboardStore.outletId));

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


	function handleOutletChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const val = normalizeScope(target.value);
		dashboardStore.setOutlet(val);
		session.setOutlet(val);
	}

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

			<!-- Pemilih Outlet (AC-01.2: SM terkunci hanya ke outlet tugas) -->
			<div class="filter-group group-outlet">
				<label for="dash-outlet-filter" class="filter-label">Outlet</label>
				<select
					id="dash-outlet-filter"
					class="filter-select select-outlet"
					value={selectedOutletValue}
					disabled={isStoreManager && selectableOutlets.length <= 1}
					onchange={handleOutletChange}
				>
					{#if !isStoreManager}
						<option value="*">Semua Outlet (Konsolidasi)</option>
					{/if}
					{#each selectableOutlets as out}
						<option value={out.id}>{out.name} ({out.city})</option>
					{/each}
				</select>
			</div>

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
					<option value="today">Hari Ini</option>
					<option value="7days">7 Hari Terakhir</option>
					<option value="month">Bulan Ini</option>
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
			<OwnerPulseStrip />
			<OwnerLiveTrafficCard />
			<OwnerAlertRadarCard />
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

		{:else if currentRole === 'store_manager'}
			<!-- 4. DASHBOARD STORE MANAGER (T-01.9, T-01.14 & AC-01.1) -->
			<ActionCenterCard />
			<SmEodStatusCard />
			<SmStockMinCard />
			<SmCountScheduleCard />
			<SmPettyCashCard />
			<SmProposalsCard />

		{:else}
			<!-- Fallback Kasir / Default -->
			<ActionCenterCard />
			<div class="col-12 p-8 text-center rounded-xl" style="background: var(--bg-panel); border: 1px solid var(--border-panel);">
				<p class="font-semibold" style="color: var(--text-muted);">
					Selamat bertugas, kasir! Gunakan menu POS untuk input transaksi penjualan hari ini.
				</p>
			</div>
		{/if}
	</main>
</div>
