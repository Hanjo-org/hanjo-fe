<script lang="ts">
	/**
	 * Outlets & Master Organisasi Page (MS-02)
	 * Referensi: PRD 8.1, MILESTONE.md §MS-02
	 *
	 * Mengelola Hierarki Organisasi Induk, Multi-Outlet, Grup Wilayah,
	 * Penugasan Store Manager, dan Kepemilikan Mitra / Investor.
	 */
	import { onMount } from 'svelte';
	import { outletsStore } from '#lib/features/outlets/stores/outlets.svelte.js';
	import { session } from '#lib/auth/session.svelte.js';
	import '#lib/features/outlets/outlets.css';

	import Icon from '#lib/components/data/Icon.svelte';
	import StatusBadge from '#lib/components/data/StatusBadge.svelte';
	import Skeleton from '#lib/components/feedback/Skeleton.svelte';
	import ActionMenu from '#lib/components/feedback/ActionMenu.svelte';

	import OrganizationListCard from '#lib/features/outlets/components/OrganizationListCard.svelte';
	import OrganizationModal from '#lib/features/outlets/components/OrganizationModal.svelte';
	import OutletFormModal from '#lib/features/outlets/components/OutletFormModal.svelte';
	import OutletDetailDrawer from '#lib/features/outlets/components/OutletDetailDrawer.svelte';
	import DeactivationConflictModal from '#lib/features/outlets/components/DeactivationConflictModal.svelte';
	import OutletGroupsSection from '#lib/features/outlets/components/OutletGroupsSection.svelte';
	import PartnerOwnersSection from '#lib/features/outlets/components/PartnerOwnersSection.svelte';

	import type { Organization, Outlet } from '#lib/api/contract/types.js';

	// Modal states
	let showOrgModal = $state(false);
	let editingOrg = $state<Organization | null>(null);

	let showOutletModal = $state(false);
	let editingOutlet = $state<Outlet | null>(null);

	let showDetailDrawer = $state(false);
	let detailedOutlet = $state<Outlet | null>(null);

	let conflictTargetName = $state('Entitas');

	onMount(() => {
		outletsStore.loadAll();
	});

	// Aksi Organisasi
	function handleOpenCreateOrg() {
		editingOrg = null;
		showOrgModal = true;
	}

	function handleEditOrg(org: Organization) {
		editingOrg = org;
		showOrgModal = true;
	}

	async function handleSaveOrg(data: Partial<Organization>) {
		if (editingOrg) {
			await outletsStore.updateOrganization(editingOrg.id, data);
		} else {
			await outletsStore.createOrganization(data);
		}
	}

	async function handleToggleOrgStatus(org: Organization) {
		if (org.active !== false) {
			conflictTargetName = `Organisasi ${org.name}`;
			await outletsStore.deactivateOrganization(org.id);
		} else {
			await outletsStore.activateOrganization(org.id);
		}
	}

	// Aksi Outlet
	function handleOpenCreateOutlet() {
		editingOutlet = null;
		showOutletModal = true;
	}

	function handleEditOutlet(out: Outlet) {
		editingOutlet = out;
		showOutletModal = true;
	}

	async function handleSaveOutlet(data: Partial<Outlet>) {
		if (editingOutlet) {
			await outletsStore.updateOutlet(editingOutlet.id, data);
		} else {
			await outletsStore.createOutlet(data);
		}
	}

	async function handleToggleOutletStatus(out: Outlet) {
		if (out.active !== false) {
			conflictTargetName = `Outlet ${out.name}`;
			await outletsStore.deactivateOutlet(out.id);
		} else {
			await outletsStore.activateOutlet(out.id);
		}
	}

	async function handleOpenDetail(out: Outlet) {
		detailedOutlet = out;
		await outletsStore.loadOutletOwnerships(out.id);
		showDetailDrawer = true;
	}
</script>

<svelte:head>
	<title>Master Organisasi &amp; Outlet | HANJO ERP</title>
</svelte:head>

<div class="outlets-page-container">
	<!-- 1. Header & Quick Metrics -->
	<header class="outlets-page-header">
		<div class="page-header-lead">
			<div class="page-header-icon" aria-hidden="true">
				<Icon name="building-office-2" size={24} />
			</div>
			<div class="page-header-text">
				<h1 class="page-title">Master Organisasi, Gerai &amp; Mitra</h1>
				<p class="page-subtitle">Pengelolaan hierarki multi-organisasi, jaringan outlet gerai, dan kepemilikan investor.</p>
			</div>
		</div>
	</header>

	<!-- Stat Counters Strip -->
	<div class="outlets-header-stats">
		<div class="stat-box">
			<span class="stat-box-title">Organisasi Induk</span>
			<span class="stat-box-value">{outletsStore.organizations.length}</span>
			<span class="stat-box-sub">Entitas bisnis terdaftar</span>
		</div>
		<div class="stat-box">
			<span class="stat-box-title">Total Gerai Aktif</span>
			<span class="stat-box-value" style="color: var(--brand-primary, #10b981);">
				{outletsStore.outlets.filter((o) => o.active !== false).length}
			</span>
			<span class="stat-box-sub">Dari {outletsStore.outlets.length} total cabang</span>
		</div>
		<div class="stat-box">
			<span class="stat-box-title">Gerai Mandiri vs Mitra</span>
			<span class="stat-box-value">
				{outletsStore.outlets.filter((o) => o.owner_type !== 'partner').length} / {outletsStore.outlets.filter((o) => o.owner_type === 'partner').length}
			</span>
			<span class="stat-box-sub">Internal vs Investor Mitra</span>
		</div>
		<div class="stat-box">
			<span class="stat-box-title">Grup Wilayah Operasional</span>
			<span class="stat-box-value">{outletsStore.groups.length}</span>
			<span class="stat-box-sub">Regional &amp; Area Manager</span>
		</div>
	</div>

	<!-- 2. Navigasi Tab Utama (PG-org-outlets, PG-org-list, PG-org-groups, PG-org-owners) -->
	<nav class="outlets-tabs-nav" aria-label="Tab Menu Organisasi">
		<button
			type="button"
			class="outlets-tab-btn {outletsStore.activeTab === 'outlets' ? 'active' : ''}"
			onclick={() => (outletsStore.activeTab = 'outlets')}
		>
			<Icon name="building-storefront" size={16} />
			<span>Daftar Gerai / Outlet ({outletsStore.outlets.length})</span>
		</button>

		<button
			type="button"
			class="outlets-tab-btn {outletsStore.activeTab === 'organizations' ? 'active' : ''}"
			onclick={() => (outletsStore.activeTab = 'organizations')}
		>
			<Icon name="building-office" size={16} />
			<span>Organisasi Induk ({outletsStore.organizations.length})</span>
		</button>

		<button
			type="button"
			class="outlets-tab-btn {outletsStore.activeTab === 'groups' ? 'active' : ''}"
			onclick={() => (outletsStore.activeTab = 'groups')}
		>
			<Icon name="map-pin" size={16} />
			<span>Grup Wilayah ({outletsStore.groups.length})</span>
		</button>

		{#if outletsStore.isPartnerOwnershipEnabled}
			<button
				type="button"
				class="outlets-tab-btn {outletsStore.activeTab === 'owners' ? 'active' : ''}"
				onclick={() => (outletsStore.activeTab = 'owners')}
			>
				<Icon name="users" size={16} />
				<span>Mitra &amp; Investor ({outletsStore.owners.length})</span>
			</button>
		{/if}
	</nav>

	<!-- TAB 1: DAFTAR OUTLET / GERAI (PG-org-outlets) -->
	{#if outletsStore.activeTab === 'outlets'}
		<!-- Toolbar Filter Outlet -->
		<div class="outlets-toolbar">
			<div class="toolbar-left">
				<!-- Pencarian -->
				<div class="toolbar-search">
					<Icon name="magnifying-glass" size={15} class="toolbar-search-icon" />
					<input
						type="text"
						class="toolbar-search-input"
						placeholder="Cari nama gerai, kode, atau kota..."
						bind:value={outletsStore.searchQuery}
					/>
				</div>

				<!-- Filter Organisasi Induk -->
				<select
					class="toolbar-select"
					bind:value={outletsStore.selectedOrgFilter}
					aria-label="Filter Organisasi Induk"
				>
					<option value="*">Semua Organisasi Induk</option>
					{#each outletsStore.organizations as org}
						<option value={org.id}>{org.name}</option>
					{/each}
				</select>

				<!-- Filter Model Kepemilikan -->
				<select
					class="toolbar-select"
					bind:value={outletsStore.selectedOwnerTypeFilter}
					aria-label="Filter Model Kepemilikan"
				>
					<option value="all">Semua Jenis Kepemilikan</option>
					<option value="own_company">Milik Sendiri</option>
					<option value="partner">Kemitraan Investor</option>
				</select>

				<!-- Filter Status -->
				<select
					class="toolbar-select"
					bind:value={outletsStore.selectedStatusFilter}
					aria-label="Filter Status Operasional"
				>
					<option value="all">Semua Status</option>
					<option value="active">Gerai Aktif</option>
					<option value="inactive">Nonaktif</option>
				</select>

				<!-- Filter Grup Wilayah -->
				<select
					class="toolbar-select"
					bind:value={outletsStore.selectedGroupFilter}
					aria-label="Filter Grup Wilayah"
				>
					<option value="all">Semua Grup Wilayah</option>
					{#each outletsStore.groups as grp}
						<option value={grp.id}>{grp.name}</option>
					{/each}
				</select>
			</div>

			<div class="toolbar-right">
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleOpenCreateOutlet}
					id="btn-tambah-outlet"
				>
					<Icon name="plus" size={16} />
					<span>Tambah Outlet Baru</span>
				</button>
			</div>
		</div>

		<!-- Grid Daftar Outlet -->
		{#if outletsStore.isLoading}
			<div class="py-8">
				<Skeleton count={4} variant="card" />
			</div>
		{:else}
			<div class="outlets-grid">
				{#each outletsStore.filteredOutlets as out}
					{@const parent = outletsStore.organizations.find((o) => o.id === out.organization_id)}
					<div class="outlet-item-card" id="outlet-card-{out.id}">
						<div class="outlet-card-top">
							<div class="outlet-name-block">
								<span class="outlet-code-badge">{out.code}</span>
								<h3 class="outlet-title">{out.name}</h3>
								<span class="outlet-org-subtitle">
									<Icon name="building-office" size={13} />
									<span>{parent?.name || 'Organisasi Terdaftar'}</span>
								</span>
							</div>

							<div class="outlet-card-top-right">
								<StatusBadge
									status={out.active !== false ? 'active' : 'inactive'}
								/>
								<ActionMenu
									items={[
										{
											label: 'Detail & Pemilik',
											icon: 'eye',
											onclick: () => handleOpenDetail(out)
										},
										{
											label: 'Ubah Data Gerai',
											icon: 'pencil-square',
											onclick: () => handleEditOutlet(out)
										},
										{
											divider: true,
											label: out.active !== false ? 'Nonaktifkan Gerai' : 'Aktifkan Gerai',
											icon: out.active !== false ? 'lock-closed' : 'check-circle',
											variant: out.active !== false ? 'danger' : 'success',
											onclick: () => handleToggleOutletStatus(out)
										}
									]}
								/>
							</div>
						</div>

						<div class="outlet-info-grid">
							<div class="info-item">
								<span class="info-label">Kota / Lokasi</span>
								<span class="info-val">{out.city}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Model Gerai</span>
								<span class="info-val">
									{out.owner_type === 'partner' ? 'Kemitraan Mitra' : 'Milik Sendiri'}
								</span>
							</div>
							<div class="info-item">
								<span class="info-label">Pajak PBJT</span>
								<span class="info-val">{Math.round((out.tax_rate || 0.1) * 100)}%</span>
							</div>
							<div class="info-item">
								<span class="info-label">Batas Kas Kecil</span>
								<span class="info-val font-mono">{out.petty_cash_limit || 'Rp 300.000'}</span>
							</div>
						</div>
					</div>
				{/each}

				{#if outletsStore.filteredOutlets.length === 0}
					<div class="col-span-full p-8 text-center bg-panel border rounded-xl" style="border-color: var(--border-panel);">
						<p class="text-muted font-medium text-xs">Tidak ada outlet yang sesuai dengan filter pencarian.</p>
					</div>
				{/if}
			</div>
		{/if}

	<!-- TAB 2: ORGANISASI INDUK (PG-org-list, T-02.0) -->
	{:else if outletsStore.activeTab === 'organizations'}
		<OrganizationListCard
			organizations={outletsStore.organizations}
			onEdit={handleEditOrg}
			onAdd={handleOpenCreateOrg}
			onToggleStatus={handleToggleOrgStatus}
			onSelectOrgFilter={(orgId) => {
				outletsStore.selectedOrgFilter = orgId;
				outletsStore.activeTab = 'outlets';
			}}
		/>

	<!-- TAB 3: GRUP WILAYAH (PG-org-groups, T-02.8) -->
	{:else if outletsStore.activeTab === 'groups'}
		<OutletGroupsSection
			groups={outletsStore.groups}
			outlets={outletsStore.outlets}
			onCreateGroup={async (data) => {
				await outletsStore.createGroup(data);
			}}
		/>

	<!-- TAB 4: MITRA & INVESTOR (PG-org-owners, T-02.6, Flag: partner_ownership) -->
	{:else if outletsStore.activeTab === 'owners'}
		<PartnerOwnersSection owners={outletsStore.owners} />
	{/if}
</div>

<!-- MODAL: Form Tambah/Ubah Organisasi Induk -->
<OrganizationModal
	open={showOrgModal}
	organization={editingOrg}
	onClose={() => (showOrgModal = false)}
	onSave={handleSaveOrg}
/>

<!-- MODAL: Form Tambah/Ubah Outlet -->
<OutletFormModal
	open={showOutletModal}
	outlet={editingOutlet}
	organizations={outletsStore.organizations}
	groups={outletsStore.groups}
	defaultOrgId={outletsStore.selectedOrgFilter}
	onClose={() => (showOutletModal = false)}
	onSave={handleSaveOutlet}
/>

<!-- MODAL / DRAWER: Detail Outlet Bertab & Editor Kepemilikan -->
<OutletDetailDrawer
	open={showDetailDrawer}
	outlet={detailedOutlet}
	organizations={outletsStore.organizations}
	ownerships={outletsStore.outletOwnerships}
	isPartnerEnabled={outletsStore.isPartnerOwnershipEnabled}
	onClose={() => (showDetailDrawer = false)}
	onSaveOwnerships={async (ownerships) => {
		if (detailedOutlet) {
			await outletsStore.saveOwnerships(detailedOutlet.id, ownerships);
		}
	}}
/>

<!-- MODAL: Konflik Deaktivasi (AC-02.2) -->
<DeactivationConflictModal
	open={outletsStore.blockingConflict !== null}
	conflict={outletsStore.blockingConflict}
	targetName={conflictTargetName}
	onClose={() => (outletsStore.blockingConflict = null)}
/>
