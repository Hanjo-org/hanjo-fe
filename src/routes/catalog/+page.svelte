<script lang="ts">
	/**
	 * Halaman Utama Master Katalog Bahan, Satuan, Konversi & Pemasok (MS-03)
	 * Referensi: PRD §8, MILESTONE.md §MS-03, AGENTS.md Golden Rules 1, 2, 4, 8, 10, 12, 14, 15
	 */
	import { onMount } from 'svelte';
	import { catalogStore } from '#lib/features/catalog/stores/catalog.svelte.js';
	import { session } from '#lib/auth/session.svelte.js';
	import { can } from '#lib/auth/can.js';
	import { formatRupiah } from '#lib/utils/format.js';
	import '#lib/features/catalog/catalog.css';

	import Icon from '#lib/components/data/Icon.svelte';
	import StatusBadge from '#lib/components/data/StatusBadge.svelte';
	import Skeleton from '#lib/components/feedback/Skeleton.svelte';
	import EmptyState from '#lib/components/feedback/EmptyState.svelte';
	import ErrorState from '#lib/components/feedback/ErrorState.svelte';
	import ActionMenu from '#lib/components/feedback/ActionMenu.svelte';
	import Pagination from '#lib/components/data/Pagination.svelte';

	import StockItemFormModal from '#lib/features/catalog/components/StockItemFormModal.svelte';
	import StockItemDetailDrawer from '#lib/features/catalog/components/StockItemDetailDrawer.svelte';
	import CategoryFormModal from '#lib/features/catalog/components/CategoryFormModal.svelte';
	import UnitFormModal from '#lib/features/catalog/components/UnitFormModal.svelte';
	import ConversionFormModal from '#lib/features/catalog/components/ConversionFormModal.svelte';
	import SupplierFormModal from '#lib/features/catalog/components/SupplierFormModal.svelte';
	import SupplierDetailModal from '#lib/features/catalog/components/SupplierDetailModal.svelte';
	import CsvImportModal from '#lib/features/catalog/components/CsvImportModal.svelte';

	import { menuStore } from '#lib/features/menu/stores/menu.svelte.js';
	import '#lib/features/menu/menu.css';
	import MenuItemDetailDrawer from '#lib/features/menu/components/MenuItemDetailDrawer.svelte';
	import MenuItemFormModal from '#lib/features/menu/components/MenuItemFormModal.svelte';
	import RecipeEditorModal from '#lib/features/menu/components/RecipeEditorModal.svelte';
	import ModifierGroupFormModal from '#lib/features/menu/components/ModifierGroupFormModal.svelte';
	import PricingCalculatorModal from '#lib/features/menu/components/PricingCalculatorModal.svelte';
	import HppSimulationPanel from '#lib/features/menu/components/HppSimulationPanel.svelte';

	import type { StockItem, Supplier, MenuItem } from '#lib/api/contract/types.js';
	import { calculateChannelPrice } from '#lib/domain/pricing.js';
	import { DEMO_OUTLETS } from '#lib/auth/scope.js';

	let itemViewMode = $state<'grid' | 'table'>('table');
	let itemsPage = $state(1);
	let itemsPerPage = $state(10);

	let menuViewMode = $state<'grid' | 'table'>('table');
	let menuPage = $state(1);
	let menuPerPage = $state(10);

	// Reset halaman saat query pencarian atau filter bahan baku berubah
	$effect(() => {
		const _ = `${catalogStore.itemSearchQuery}|${catalogStore.selectedCategoryFilter}|${catalogStore.selectedProducibleFilter}|${catalogStore.selectedExternalFilter}|${catalogStore.selectedStatusFilter}`;
		itemsPage = 1;
	});

	// Reset halaman saat filter menu berubah
	$effect(() => {
		const _ = `${menuStore.searchQuery}|${menuStore.selectedCategoryFilter}|${menuStore.selectedScopeFilter}|${menuStore.selectedStatusFilter}`;
		menuPage = 1;
	});

	const totalFilteredItems = $derived(catalogStore.filteredItems.length);
	const paginatedItems = $derived.by(() => {
		const start = (itemsPage - 1) * itemsPerPage;
		return catalogStore.filteredItems.slice(start, start + itemsPerPage);
	});

	const totalFilteredMenus = $derived(menuStore.filteredMenuItems.length);
	const paginatedMenus = $derived.by(() => {
		const start = (menuPage - 1) * menuPerPage;
		return menuStore.filteredMenuItems.slice(start, start + menuPerPage);
	});

	onMount(() => {
		catalogStore.loadAll();
		menuStore.loadAll();
		try {
			const saved = localStorage.getItem('hanjo_catalog_view_mode');
			if (saved === 'grid' || saved === 'table') {
				itemViewMode = saved;
			}
			const hash = window.location.hash.replace('#', '');
			if (hash && ['items', 'menus', 'recipes', 'modifiers', 'pricing', 'availability', 'categories', 'units', 'suppliers'].includes(hash)) {
				catalogStore.activeTab = hash as any;
			}
		} catch {}
	});

	function setItemViewMode(mode: 'grid' | 'table') {
		itemViewMode = mode;
		try {
			localStorage.setItem('hanjo_catalog_view_mode', mode);
		} catch {}
	}

	const userRole = $derived(session.user?.role || 'owner');
	const isStoreManager = $derived(userRole === 'store_manager' || userRole === 'cashier');
	const canManageCatalog = $derived(!isStoreManager && userRole !== 'finance');

	function getItemStockLevel(item: StockItem): 'out_of_stock' | 'low_stock' | 'normal' {
		if (item.status === 'archived') return 'normal';
		const total = parseFloat(item.current_stock || '0');
		if (total <= 0) return 'out_of_stock';

		if (item.stock_by_outlet && Object.keys(item.stock_by_outlet).length > 0) {
			const entries = Object.values(item.stock_by_outlet);
			const hasLow = entries.some((d) => {
				const curr = parseFloat(d.current || '0');
				const min = parseFloat(d.min || '0');
				return min > 0 && curr <= min;
			});
			if (hasLow) return 'low_stock';
		}

		return 'normal';
	}
</script>

<div class="catalog-page-container">
	<!-- 1. Page Header -->
	<header class="catalog-page-header">
		<div class="page-header-lead">
			<div class="page-header-icon">
				<Icon name="archive-box" size={26} />
			</div>
			<div class="page-header-text">
				<h1 class="page-title">Katalog Bahan, Menu &amp; Resep</h1>
				<p class="page-subtitle">
					Master inventaris bahan baku, formula resep berversi, modifier, penetapan harga channel, dan ketersediaan gerai.
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<span class="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
				<span>Role Aktif: <strong class="text-[var(--text-main)] capitalize">{userRole.replace('_', ' ')}</strong></span>
			</span>
		</div>
	</header>

	<!-- 2. Hero KPI Strip (4 Kolom Responsif) -->
	<div class="catalog-hero-stats">
		<div class="stat-box">
			<span class="stat-box-title">Total Bahan Baku</span>
			<span class="stat-box-val">{catalogStore.items.length}</span>
			<span class="stat-box-sub">BOM &amp; Resep Master</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Menu Siap Jual</span>
			<span class="stat-box-val">{menuStore.menuItems.length}</span>
			<span class="stat-box-sub">{menuStore.totalVariantsCount} Varian Aktif</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Resep Berversi</span>
			<span class="stat-box-val">{menuStore.recipes.length}</span>
			<span class="stat-box-sub">Formula BOM &amp; Override</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Channel &amp; Rekanan</span>
			<span class="stat-box-val">{menuStore.channels.length} Channel</span>
			<span class="stat-box-sub">{catalogStore.suppliers.length} Mitra Pemasok</span>
		</div>
	</div>

	<!-- 3. Navigasi Tab Utama (Contextual Tab Navigation) -->
	<nav class="catalog-tabs-nav" aria-label="Tab Menu Master Katalog">
		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'items' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'items')}
			id="tab-bahan-baku"
		>
			<Icon name="cube" size={16} />
			<span>Bahan Baku ({catalogStore.items.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'menus' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'menus')}
			id="tab-menu-siap-jual"
		>
			<Icon name="book-open" size={16} />
			<span>Menu &amp; Varian ({menuStore.menuItems.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'recipes' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'recipes')}
			id="tab-resep-berversi"
		>
			<Icon name="clipboard-document-list" size={16} />
			<span>Resep &amp; HPP ({menuStore.recipes.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'modifiers' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'modifiers')}
			id="tab-modifier"
		>
			<Icon name="sparkles" size={16} />
			<span>Modifier &amp; Efek ({menuStore.modifierGroups.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'pricing' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'pricing')}
			id="tab-harga-channel"
		>
			<Icon name="calculator" size={16} />
			<span>Harga &amp; Channel ({menuStore.channels.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'availability' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'availability')}
			id="tab-ketersediaan"
		>
			<Icon name="building-storefront" size={16} />
			<span>Ketersediaan Gerai</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'categories' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'categories')}
			id="tab-kategori"
		>
			<Icon name="tag" size={16} />
			<span>Kategori ({catalogStore.categories.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'units' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'units')}
			id="tab-satuan"
		>
			<Icon name="scale" size={16} />
			<span>Satuan ({catalogStore.units.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'suppliers' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'suppliers')}
			id="tab-pemasok"
		>
			<Icon name="truck" size={16} />
			<span>Pemasok ({catalogStore.suppliers.length})</span>
		</button>
	</nav>

	<!-- TAB 1: DAFTAR BAHAN BAKU (PG-cat-items) -->
	{#if catalogStore.activeTab === 'items'}
		<!-- Toolbar Filter & Tombol Aksi Kontekstual di Bawah Tab (Golden Rule 15) -->
		<div class="catalog-toolbar">
			<div class="toolbar-left">
				<!-- Pencarian -->
				<div class="toolbar-search">
					<Icon name="magnifying-glass" size={15} class="toolbar-search-icon" />
					<input
						type="text"
						class="toolbar-search-input"
						placeholder="Cari nama bahan, kode SKU, atau ref HQ..."
						bind:value={catalogStore.itemSearchQuery}
						id="input-search-items"
					/>
				</div>

				<!-- Filter Kategori -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedCategoryFilter}
					aria-label="Filter Kategori"
					id="select-cat-filter"
				>
					<option value="all">Semua Kategori ({catalogStore.categories.length})</option>
					{#each catalogStore.categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>

				<!-- Filter Olahan -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedProducibleFilter}
					aria-label="Filter Olahan"
				>
					<option value="all">Semua Tipe Bahan</option>
					<option value="true">Bahan Olahan Gerai</option>
					<option value="false">Bahan Baku Siap Pakai</option>
				</select>

				<!-- Filter Beli Luar -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedExternalFilter}
					aria-label="Filter Beli Luar"
				>
					<option value="all">Semua Izin Beli</option>
					<option value="true">Boleh Beli Luar (PO)</option>
					<option value="false">Hanya Gudang HQ</option>
				</select>

				<!-- Filter Status -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedStatusFilter}
					aria-label="Filter Status Bahan"
				>
					<option value="active">Bahan Aktif</option>
					<option value="archived">Diarsipkan</option>
					<option value="all">Semua Status</option>
				</select>
			</div>

			<!-- Tombol Aksi Kontekstual di Bawah Tab (Golden Rule 15) -->
			<div class="toolbar-right">
				<!-- Toggle Pilihan Tampilan (Grid / Tabel) -->
				<div class="view-mode-toggle" role="group" aria-label="Mode Tampilan Bahan">
					<button
						type="button"
						class="view-toggle-btn {itemViewMode === 'grid' ? 'active' : ''}"
						onclick={() => setItemViewMode('grid')}
						title="Tampilan Grid Kartu"
						id="btn-view-grid"
					>
						<Icon name="squares-2x2" size={15} />
						<span class="hidden sm:inline">Grid</span>
					</button>
					<button
						type="button"
						class="view-toggle-btn {itemViewMode === 'table' ? 'active' : ''}"
						onclick={() => setItemViewMode('table')}
						title="Tampilan Tabel Data"
						id="btn-view-table"
					>
						<Icon name="table-cells" size={15} />
						<span class="hidden sm:inline">Tabel</span>
					</button>
				</div>

				{#if canManageCatalog}
					<button
						type="button"
						class="btn btn-secondary"
						onclick={() => catalogStore.openCsvModal()}
						id="btn-import-csv"
					>
						<Icon name="arrow-up-tray" size={16} />
						<span>Impor CSV</span>
					</button>

					<button
						type="button"
						class="btn btn-primary"
						onclick={() => catalogStore.openCreateItem()}
						id="btn-tambah-bahan"
					>
						<Icon name="plus" size={16} />
						<span>Tambah Bahan Baru</span>
					</button>
				{/if}
			</div>
		</div>

		<!-- 4 Screen States Wajib (Golden Rule 8) -->
		{#if catalogStore.isLoading}
			<div class="py-8">
				<Skeleton count={6} variant="card" />
			</div>
		{:else if catalogStore.error}
			<ErrorState
				title="Gagal Memuat Katalog Bahan"
				message={catalogStore.error}
				onretry={() => catalogStore.loadAll()}
			/>
		{:else if catalogStore.filteredItems.length === 0}
			<EmptyState
				title="Tidak Ada Bahan Baku Ditemukan"
				description="Cobalah menyesuaikan kriteria filter atau tambahkan bahan baku baru ke dalam katalog."
			/>
		{:else if itemViewMode === 'grid'}
			<!-- Grid Daftar Bahan Baku (Responsive 4-Tier) -->
			<div class="items-grid">
				{#each paginatedItems as item}
					{@const stockLevel = getItemStockLevel(item)}
					<div
						class="item-card {stockLevel === 'out_of_stock' ? 'card-out-of-stock' : stockLevel === 'low_stock' ? 'card-low-stock' : ''}"
						id="item-card-{item.id}"
					>
						<div class="item-card-top">
							<div class="item-identity">
								<span class="item-code-badge">{item.code}</span>
								<h3 class="item-title">{item.name}</h3>
								<span class="item-category-tag">
									<Icon name="tag" size={13} />
									<span>{item.category_name || 'Umum'}</span>
								</span>
							</div>

							<div class="flex items-center gap-1.5">
								<StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} />
								<ActionMenu
									items={[
										{
											label: 'Lihat Detail & Stok',
											icon: 'eye',
											onclick: () => catalogStore.openItemDetail(item)
										},
										...(canManageCatalog
											? [
													{
														label: 'Ubah Data Bahan',
														icon: 'pencil-square',
														onclick: () => catalogStore.openEditItem(item)
													},
													{
														divider: true,
														label: item.status === 'active' ? 'Arsipkan Bahan' : 'Aktifkan Kembali',
														icon: item.status === 'active' ? 'archive-box' : 'arrow-path',
														variant: item.status === 'active' ? ('danger' as const) : ('success' as const),
														onclick: () =>
															item.status === 'active'
																? catalogStore.archiveItem(item)
																: catalogStore.restoreItem(item)
													}
												]
											: [])
									]}
								/>
							</div>
						</div>

						<div class="item-badges-row">
							{#if item.is_producible}
								<span class="pill-badge pill-info">Bahan Olahan Gerai</span>
							{/if}
							{#if !item.can_buy_external}
								<span class="pill-badge pill-warning">Hanya Suplai HQ</span>
							{/if}
							{#if item.storage_temperature === 'chilled'}
								<span class="pill-badge pill-info">Kulkas (Chilled)</span>
							{:else if item.storage_temperature === 'frozen'}
								<span class="pill-badge pill-danger">Freezer (Beku)</span>
							{/if}
						</div>

						{#if item.description}
							<p class="item-desc">{item.description}</p>
						{/if}

						<!-- Sub-box Metrik Cepat -->
						<div class="item-metrics-subbox">
							<div class="metric-col">
								<span class="metric-label">Satuan Dasar</span>
								<span class="metric-val font-mono">{item.base_unit_symbol}</span>
							</div>
							<div class="metric-col">
								<span class="metric-label">Harga Ref. HQ</span>
								<span class="metric-val text-xs">{formatRupiah(item.hq_ref_price || 0)}</span>
							</div>
						</div>

						<div class="item-card-footer">
							<span class="text-xs text-[var(--text-subtle)]">
								Dipakai di <strong>{item.recipes_using_count || 0} resep</strong>
							</span>
							<button
								type="button"
								class="btn btn-secondary text-xs"
								style="min-height: 32px; padding: 4px 12px;"
								onclick={() => catalogStore.openItemDetail(item)}
							>
								<span>Lihat Stok</span>
								<Icon name="arrow-right" size={13} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Tabel Daftar Bahan Baku (High-Density Data Table) -->
			<div class="data-table-container">
				<table class="data-table items-table">
					<thead>
						<tr>
							<th class="w-32">Kode SKU</th>
							<th>Nama Bahan Baku</th>
							<th>Kategori</th>
							<th>Tipe &amp; Karakteristik</th>
							<th class="text-center">Satuan Dasar</th>
							<th class="text-right">Harga Ref. HQ</th>
							<th class="text-center">Resep</th>
							<th class="text-center">Status</th>
							<th class="text-right w-20">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedItems as item}
							{@const stockLevel = getItemStockLevel(item)}
							<tr
								id="item-row-{item.id}"
								class={stockLevel === 'out_of_stock' ? 'row-out-of-stock' : stockLevel === 'low_stock' ? 'row-low-stock' : ''}
								title={stockLevel === 'out_of_stock' ? 'Stok Habis (0)' : stockLevel === 'low_stock' ? 'Stok Menipis (di bawah batas minimum gerai)' : undefined}
							>
								<td>
									<span class="item-code-badge">{item.code}</span>
								</td>
								<td>
									<div class="flex flex-col gap-0.5">
										<button
											type="button"
											class="text-left font-bold text-[var(--text-main)] hover:text-emerald-400 transition cursor-pointer"
											onclick={() => catalogStore.openItemDetail(item)}
										>
											{item.name}
										</button>
										{#if item.description}
											<span class="text-xs text-[var(--text-muted)] line-clamp-1 max-w-sm" title={item.description}>
												{item.description}
											</span>
										{/if}
									</div>
								</td>
								<td>
									<span class="item-category-tag">
										<Icon name="tag" size={12} />
										<span>{item.category_name || 'Umum'}</span>
									</span>
								</td>
								<td>
									<div class="flex flex-wrap gap-1.5 items-center">
										{#if item.is_producible}
											<span class="pill-badge pill-info">Olahan Gerai</span>
										{/if}
										{#if !item.can_buy_external}
											<span class="pill-badge pill-warning">Hanya Suplai HQ</span>
										{:else}
											<span class="pill-badge pill-success">Boleh Beli Luar</span>
										{/if}
										{#if item.storage_temperature === 'chilled'}
											<span class="pill-badge pill-info">Kulkas</span>
										{:else if item.storage_temperature === 'frozen'}
											<span class="pill-badge pill-danger">Freezer</span>
										{/if}
									</div>
								</td>
								<td class="text-center">
									<span class="font-mono font-semibold px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs">
										{item.base_unit_symbol}
									</span>
								</td>
								<td class="text-right">
									<span class="font-mono font-bold text-emerald-400">
										{formatRupiah(item.hq_ref_price || 0)}
									</span>
								</td>
								<td class="text-center">
									<span class="text-xs text-[var(--text-muted)] font-mono">
										{item.recipes_using_count || 0} resep
									</span>
								</td>
								<td class="text-center">
									<StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} />
								</td>
								<td class="text-right">
									<div class="flex items-center justify-end">
										<ActionMenu
											items={[
												{
													label: 'Lihat Detail & Stok',
													icon: 'eye',
													onclick: () => catalogStore.openItemDetail(item)
												},
												...(canManageCatalog
													? [
															{
																label: 'Ubah Data Bahan',
																icon: 'pencil-square',
																onclick: () => catalogStore.openEditItem(item)
															},
															{
																divider: true,
																label: item.status === 'active' ? 'Arsipkan Bahan' : 'Aktifkan Kembali',
																icon: item.status === 'active' ? 'archive-box' : 'arrow-path',
																variant: item.status === 'active' ? ('danger' as const) : ('success' as const),
																onclick: () =>
																	item.status === 'active'
																		? catalogStore.archiveItem(item)
																		: catalogStore.restoreItem(item)
															}
														]
													: [])
											]}
										/>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Komponen Pagination Terpadu (Client-side & SSR Ready) -->
		{#if catalogStore.filteredItems.length > 0}
			<div class="mt-4">
				<Pagination
					page={itemsPage}
					perPage={itemsPerPage}
					total={totalFilteredItems}
					perPageOptions={[10, 25, 50]}
					hrefBuilder={(p, pp) => `?tab=items&page=${p}&per_page=${pp}`}
					onpagechange={(newPage) => (itemsPage = newPage)}
					onperpagechange={(newSize) => {
						itemsPerPage = newSize;
						itemsPage = 1;
					}}
				/>
			</div>
		{/if}

	<!-- TAB 2: MENU & VARIAN SIAP JUAL (PG-cat-menus, T-04.5) -->
	{:else if catalogStore.activeTab === 'menus'}
		<div class="catalog-toolbar">
			<div class="toolbar-left">
				<!-- Pencarian Menu -->
				<div class="toolbar-search">
					<Icon name="magnifying-glass" size={15} class="toolbar-search-icon" />
					<input
						type="text"
						class="toolbar-search-input"
						placeholder="Cari nama menu, kode, varian SKU..."
						bind:value={menuStore.searchQuery}
						id="input-search-menus"
					/>
				</div>

				<!-- Filter Kategori -->
				<select
					class="toolbar-select"
					bind:value={menuStore.selectedCategoryFilter}
					aria-label="Filter Kategori Menu"
					id="select-menu-cat-filter"
				>
					<option value="all">Semua Kategori Menu ({menuStore.categories.length})</option>
					{#each menuStore.categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>

				<!-- Filter Cakupan Gerai -->
				<select
					class="toolbar-select"
					bind:value={menuStore.selectedScopeFilter}
					aria-label="Filter Cakupan Gerai"
					id="select-menu-scope-filter"
				>
					<option value="all">Semua Cakupan</option>
					<option value="all_outlets">Seluruh Gerai (Nasional)</option>
					<option value="outlet_set">Khusus Gerai Tertentu</option>
				</select>

				<!-- Filter Status Menu -->
				<select
					class="toolbar-select"
					bind:value={menuStore.selectedStatusFilter}
					aria-label="Filter Status Menu"
					id="select-menu-status-filter"
				>
					<option value="active">Menu Aktif</option>
					<option value="archived">Diarsipkan</option>
					<option value="all">Semua Status</option>
				</select>
			</div>

			<div class="toolbar-right">
				<!-- Toggle Pilihan Tampilan (Grid / Tabel) -->
				<div class="view-mode-toggle" role="group" aria-label="Mode Tampilan Menu">
					<button
						type="button"
						class="view-toggle-btn {menuViewMode === 'grid' ? 'active' : ''}"
						onclick={() => (menuViewMode = 'grid')}
						title="Tampilan Grid Kartu"
						id="btn-menu-view-grid"
					>
						<Icon name="squares-2x2" size={15} />
						<span class="hidden sm:inline">Grid</span>
					</button>
					<button
						type="button"
						class="view-toggle-btn {menuViewMode === 'table' ? 'active' : ''}"
						onclick={() => (menuViewMode = 'table')}
						title="Tampilan Tabel Data"
						id="btn-menu-view-table"
					>
						<Icon name="table-cells" size={15} />
						<span class="hidden sm:inline">Tabel</span>
					</button>
				</div>

				{#if canManageCatalog}
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => {
							menuStore.editingMenuItem = null;
							menuStore.isMenuModalOpen = true;
						}}
						id="btn-tambah-menu"
					>
						<Icon name="plus" size={16} />
						<span>Tambah Menu Baru</span>
					</button>
				{/if}
			</div>
		</div>

		{#if menuStore.isLoading}
			<div class="py-8">
				<Skeleton count={6} variant="card" />
			</div>
		{:else if menuStore.error}
			<ErrorState
				title="Gagal Memuat Katalog Menu"
				message={menuStore.error}
				onretry={() => menuStore.loadAll()}
			/>
		{:else if menuStore.filteredMenuItems.length === 0}
			<EmptyState
				title="Tidak Ada Menu Ditemukan"
				description="Cobalah ubah kata kunci pencarian atau buat menu baru ke dalam katalog."
			/>
		{:else if menuViewMode === 'grid'}
			<div class="menu-grid">
				{#each paginatedMenus as menu}
					<div class="menu-card" id="menu-card-{menu.id}">
						<div class="menu-card-header">
							<div class="menu-card-title-group">
								<div class="flex items-center gap-2 mb-1">
									<span class="menu-card-code">{menu.code}</span>
									<span class="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
										{menu.category_name || 'Kopi'}
									</span>
								</div>
								<h3 class="menu-card-title">{menu.name}</h3>
							</div>

							<div class="flex items-center gap-1.5">
								<StatusBadge status={menu.status === 'active' ? 'active' : 'inactive'} />
								<ActionMenu
									items={[
										{
											label: 'Lihat Detail & Resep',
											icon: 'eye',
											onclick: () => menuStore.openDetailDrawer(menu, 'info')
										},
										...(canManageCatalog
											? [
													{
														label: 'Ubah Data Menu',
														icon: 'pencil-square',
														onclick: () => {
															menuStore.editingMenuItem = menu;
															menuStore.isMenuModalOpen = true;
														}
													},
													{
														label: 'Kalkulator Channel',
														icon: 'calculator',
														onclick: () => {
															if (menu.variants?.[0]?.id) {
																menuStore.calcVariantId = menu.variants[0].id;
															}
															menuStore.isPricingCalculatorOpen = true;
														}
													}
												]
											: [])
									]}
								/>
							</div>
						</div>

						{#if menu.description}
							<p class="menu-card-desc">{menu.description}</p>
						{/if}

						<div class="mb-3 flex flex-wrap gap-1.5">
							{#if menu.scope_type === 'all_outlets'}
								<span class="pill-badge pill-info">Seluruh Gerai (Nasional)</span>
							{:else}
								<span class="pill-badge pill-warning">Khusus {menu.target_outlet_ids?.length || 0} Gerai</span>
							{/if}
							{#if menu.is_time_limited}
								<span class="pill-badge pill-danger">Promo Terbatas</span>
							{/if}
						</div>

						<!-- Varian & Harga Dasar -->
						<div class="menu-card-variants">
							<span class="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider mb-1">
								Varian &amp; Harga Dasar
							</span>
							{#each menu.variants as v}
								<div class="menu-variant-row">
									<span class="menu-variant-name">
										<span>{v.name}</span>
										<code class="text-[11px] text-[var(--text-muted)] font-mono">{v.sku}</code>
									</span>
									<span class="menu-variant-price">{formatRupiah(v.base_price)}</span>
								</div>
							{/each}
						</div>

						<div class="menu-card-footer">
							<span class="text-xs text-[var(--text-subtle)]">
								{menu.modifier_group_ids?.length || 0} grup modifier
							</span>
							<button
								type="button"
								class="btn btn-secondary text-xs"
								style="min-height: 32px; padding: 4px 12px;"
								onclick={() => menuStore.openDetailDrawer(menu, 'info')}
							>
								<span>Lihat Detail</span>
								<Icon name="arrow-right" size={13} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="data-table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th class="w-32">Kode Menu</th>
							<th>Nama Menu</th>
							<th>Kategori</th>
							<th>Cakupan Gerai</th>
							<th>Varian &amp; Harga Dasar</th>
							<th class="text-center">Status</th>
							<th class="text-right w-20">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedMenus as menu}
							<tr id="menu-row-{menu.id}">
								<td>
									<span class="item-code-badge">{menu.code}</span>
								</td>
								<td>
									<div class="flex flex-col gap-0.5">
										<button
											type="button"
											class="text-left font-bold text-[var(--text-main)] hover:text-indigo-400 transition cursor-pointer"
											onclick={() => menuStore.openDetailDrawer(menu, 'info')}
										>
											{menu.name}
										</button>
										{#if menu.description}
											<span class="text-xs text-[var(--text-muted)] line-clamp-1 max-w-sm" title={menu.description}>
												{menu.description}
											</span>
										{/if}
									</div>
								</td>
								<td>
									<span class="item-category-tag">
										<Icon name="tag" size={12} />
										<span>{menu.category_name || 'Umum'}</span>
									</span>
								</td>
								<td>
									{#if menu.scope_type === 'all_outlets'}
										<span class="pill-badge pill-info">Seluruh Gerai</span>
									{:else}
										<span class="pill-badge pill-warning">Khusus {menu.target_outlet_ids?.length || 0} Gerai</span>
									{/if}
								</td>
								<td>
									<div class="flex flex-wrap gap-1.5">
										{#each menu.variants as v}
											<span class="text-xs px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] font-mono">
												<strong class="text-[var(--text-main)]">{v.name}:</strong>
												<span class="text-sky-400 font-semibold">{formatRupiah(v.base_price)}</span>
											</span>
										{/each}
									</div>
								</td>
								<td class="text-center">
									<StatusBadge status={menu.status === 'active' ? 'active' : 'inactive'} />
								</td>
								<td class="text-right">
									<ActionMenu
										items={[
											{
												label: 'Lihat Detail & Resep',
												icon: 'eye',
												onclick: () => menuStore.openDetailDrawer(menu, 'info')
											},
											...(canManageCatalog
												? [
														{
															label: 'Ubah Menu',
															icon: 'pencil-square',
															onclick: () => {
																menuStore.editingMenuItem = menu;
																menuStore.isMenuModalOpen = true;
															}
														},
														{
															label: 'Kalkulator Harga',
															icon: 'calculator',
															onclick: () => {
																if (menu.variants?.[0]?.id) {
																	menuStore.calcVariantId = menu.variants[0].id;
																}
																menuStore.isPricingCalculatorOpen = true;
															}
														}
													]
												: [])
										]}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if menuStore.filteredMenuItems.length > 0}
			<div class="mt-4">
				<Pagination
					page={menuPage}
					perPage={menuPerPage}
					total={totalFilteredMenus}
					perPageOptions={[10, 25, 50]}
					hrefBuilder={(p, pp) => `?tab=menus&page=${p}&per_page=${pp}`}
					onpagechange={(newPage) => (menuPage = newPage)}
					onperpagechange={(newSize) => {
						menuPerPage = newSize;
						menuPage = 1;
					}}
				/>
			</div>
		{/if}

	<!-- TAB 3: RESEP BERVERSI & HPP (PG-cat-recipes, T-04.7) -->
	{:else if catalogStore.activeTab === 'recipes'}
		<div class="flex flex-col gap-6">
			<div class="catalog-toolbar">
				<div class="toolbar-left">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-sm font-bold text-[var(--text-main)]">Master Formula Resep Berversi (BOM) &amp; Penentuan HPP</h3>
						<span class="text-xs text-[var(--text-subtle)]">
							Mendukung resep berversi, audit riwayat versi, dan penimpaan (override) khusus gerai tertentu (PRD §6.2).
						</span>
					</div>
				</div>

				<div class="toolbar-right">
					{#if canManageCatalog}
						<button
							type="button"
							class="btn btn-primary"
							onclick={() => {
								menuStore.editingRecipe = null;
								menuStore.isRecipeModalOpen = true;
							}}
							id="btn-tambah-resep"
						>
							<Icon name="plus" size={16} />
							<span>Rilis Versi Resep Baru</span>
						</button>
					{/if}
				</div>
			</div>

			<div class="data-table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>Varian Menu</th>
							<th>Versi</th>
							<th>Cakupan Formula</th>
							<th>Tanggal Efektif</th>
							<th>Bahan Baku BOM</th>
							<th>Catatan Rilis</th>
							<th>Status</th>
							<th class="w-36 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each menuStore.recipes as r}
							<tr>
								<td>
									<div class="flex flex-col">
										<strong class="text-[var(--text-main)]">{r.variant_name || r.variant_id}</strong>
										<span class="text-[11px] text-[var(--text-subtle)] font-mono">{r.variant_id}</span>
									</div>
								</td>
								<td>
									<span class="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
										v{r.version_number}
									</span>
								</td>
								<td>
									{#if r.scope_type === 'standard'}
										<span class="pill-badge pill-info">Standar Nasional</span>
									{:else}
										<span class="badge-override">
											<Icon name="building-storefront" size={12} />
											<span>Override: {DEMO_OUTLETS.find((o) => o.id === r.outlet_id)?.name || r.outlet_id}</span>
										</span>
									{/if}
								</td>
								<td class="text-xs font-mono">
									{r.effective_from ? r.effective_from.split('T')[0] : '2026-01-01'}
									{#if r.effective_until}
										s/d {r.effective_until.split('T')[0]}
									{:else}
										<span class="text-emerald-400 font-semibold">(Sekarang)</span>
									{/if}
								</td>
								<td>
									<div class="flex flex-wrap gap-1">
										{#each r.ingredients as ing}
											<span class="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
												{ing.stock_item_name} ({parseFloat(ing.quantity).toLocaleString('id-ID')} {ing.serving_unit})
											</span>
										{/each}
									</div>
								</td>
								<td class="text-xs text-[var(--text-muted)] max-w-xs truncate">
									{r.notes || '-'}
								</td>
								<td>
									{#if r.is_active}
										<span class="pill-badge pill-success">Aktif</span>
									{:else}
										<span class="pill-badge pill-neutral">Arsip</span>
									{/if}
								</td>
								<td class="text-right">
									<div class="flex items-center justify-end gap-1.5">
										<button
											type="button"
											class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-sky-400 hover:text-sky-300 transition"
											onclick={() => {
												menuStore.simVariantId = r.variant_id;
												if (r.outlet_id) menuStore.simOutletId = r.outlet_id;
												menuStore.refreshHppSimulation();
											}}
											title="Simulasikan HPP untuk varian ini"
										>
											Simulasi HPP
										</button>
										{#if canManageCatalog}
											<button
												type="button"
												class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
												onclick={() => {
													menuStore.editingRecipe = {
														variant_id: r.variant_id,
														scope_type: r.scope_type,
														outlet_id: r.outlet_id,
														ingredients: [...r.ingredients],
														notes: `Turunan dari v${r.version_number}`
													};
													menuStore.isRecipeModalOpen = true;
												}}
												title="Buat versi baru berdasarkan resep ini"
											>
												Revisi
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Simulator HPP Interaktif Terintegrasi -->
			<div class="mt-4">
				<HppSimulationPanel />
			</div>
		</div>

	<!-- TAB 4: MODIFIER & EFEK RESEP (PG-cat-modifiers, T-04.6) -->
	{:else if catalogStore.activeTab === 'modifiers'}
		<div class="flex flex-col gap-6">
			<div class="catalog-toolbar">
				<div class="toolbar-left">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-sm font-bold text-[var(--text-main)]">Grup Modifier &amp; Efek Resep BOM</h3>
						<span class="text-xs text-[var(--text-subtle)]">
							Aturan batasan pilihan (Min/Max) dan efek resep dinamis (substitusi replace, adisi add, multiplikasi multiply) (PRD §6.3, AC-04.4).
						</span>
					</div>
				</div>

				<div class="toolbar-right">
					{#if canManageCatalog}
						<button
							type="button"
							class="btn btn-primary"
							onclick={() => {
								menuStore.editingModifierGroup = null;
								menuStore.isModifierModalOpen = true;
							}}
							id="btn-tambah-modifier"
						>
							<Icon name="plus" size={16} />
							<span>Tambah Grup Modifier</span>
						</button>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each menuStore.modifierGroups as g}
					<div class="p-5 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-col justify-between hover:border-indigo-500/40 transition">
						<div>
							<div class="flex items-start justify-between gap-3 mb-2">
								<div>
									<span class="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
										{g.code}
									</span>
									<h4 class="text-base font-bold text-[var(--text-main)] mt-1.5">{g.name}</h4>
								</div>
								{#if canManageCatalog}
									<button
										type="button"
										class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
										onclick={() => {
											menuStore.editingModifierGroup = g;
											menuStore.isModifierModalOpen = true;
										}}
									>
										Ubah
									</button>
								{/if}
							</div>

							{#if g.description}
								<p class="text-xs text-[var(--text-muted)] mb-3">{g.description}</p>
							{/if}

							<div class="flex items-center gap-2 mb-4">
								<span class="text-xs px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
									Min: {g.min_select} &bull; Max: {g.max_select}
								</span>
								{#if g.min_select > 0}
									<span class="pill-badge pill-danger">Wajib Pilih</span>
								{:else}
									<span class="pill-badge pill-neutral">Opsional</span>
								{/if}
							</div>

							<!-- Daftar Pilihan Modifier -->
							<div class="space-y-2">
								<span class="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider block">
									Pilihan &amp; Efek Resep ({g.options.length})
								</span>
								{#each g.options as opt}
									<div class="p-2.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1.5">
										<div class="flex items-center justify-between text-xs">
											<span class="font-medium text-[var(--text-main)] flex items-center gap-1.5">
												<span>{opt.name}</span>
												{#if opt.is_default}
													<span class="text-[10px] text-emerald-400 font-semibold">(Default)</span>
												{/if}
											</span>
											<span class="font-mono font-bold {parseFloat(opt.price_delta) > 0 ? 'text-sky-400' : 'text-[var(--text-muted)]'}">
												{parseFloat(opt.price_delta) > 0 ? `+${formatRupiah(opt.price_delta)}` : 'Rp 0'}
											</span>
										</div>

										{#if opt.recipe_effects && opt.recipe_effects.length > 0}
											<div class="flex flex-wrap gap-1 mt-0.5">
												{#each opt.recipe_effects as eff}
													<span class="text-[10px] px-2 py-0.5 rounded {eff.type === 'replace' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : eff.type === 'add' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'}">
														{eff.type === 'replace' ? 'Ganti (Replace)' : eff.type === 'add' ? 'Tambah (Add)' : 'Kali (Multiply)'}:
														{eff.target_stock_item_name || eff.target_stock_item_id}
													</span>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

	<!-- TAB 5: HARGA CHANNEL & PEMBULATAN (PG-cat-pricing, T-04.8) -->
	{:else if catalogStore.activeTab === 'pricing'}
		<div class="flex flex-col gap-6">
			<div class="catalog-toolbar">
				<div class="toolbar-left">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-sm font-bold text-[var(--text-main)]">Penetapan Harga per Channel &amp; Aturan Pembulatan</h3>
						<span class="text-xs text-[var(--text-subtle)]">
							Perhitungan otomatis harga jual per channel berdasarkan formula resmi (§6.1, AC-04.1).
						</span>
					</div>
				</div>

				<div class="toolbar-right">
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => (menuStore.isPricingCalculatorOpen = true)}
						id="btn-buka-kalkulator-harga"
					>
						<Icon name="calculator" size={16} />
						<span>Buka Simulator Harga Channel</span>
					</button>
				</div>
			</div>

			<!-- Strip Konfigurasi Channel Penjualan -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--text-main)] flex items-center gap-2">
							<Icon name="building-storefront" size={18} class="text-emerald-400" />
							<span>Kasir Langsung (POS)</span>
						</span>
						<span class="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold">
							Markup 0%
						</span>
					</div>
					<p class="text-xs text-[var(--text-muted)]">
						Sesuai harga dasar master tanpa penyesuaian markup aplikasi.
					</p>
					<span class="text-[11px] text-[var(--text-subtle)] font-mono">
						Pembulatan: Tidak ada pembulatan
					</span>
				</div>

				<div class="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--text-main)] flex items-center gap-2">
							<Icon name="device-phone-mobile" size={18} class="text-sky-400" />
							<span>Aplikasi Online (App)</span>
						</span>
						<span class="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono font-bold">
							Markup +5%
						</span>
					</div>
					<p class="text-xs text-[var(--text-muted)]">
						Dikenakan biaya platform digital in-house dengan pembulatan kelipatan 500 terdekat.
					</p>
					<span class="text-[11px] text-[var(--text-subtle)] font-mono">
						Pembulatan: Nearest 500
					</span>
				</div>

				<div class="p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--text-main)] flex items-center gap-2">
							<Icon name="shopping-bag" size={18} class="text-amber-400" />
							<span>Marketplace (GoFood/Grab/Shopee)</span>
						</span>
						<span class="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold">
							Markup +20%
						</span>
					</div>
					<p class="text-xs text-[var(--text-muted)]">
						Kompensasi komisi merchant agregator dengan pembulatan kelipatan 1.000 terdekat.
					</p>
					<span class="text-[11px] text-[var(--text-subtle)] font-mono">
						Pembulatan: Nearest 1000
					</span>
				</div>
			</div>

			<!-- Matriks Perbandingan Harga Jual Lintas Channel -->
			<div class="data-table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>Menu &amp; Varian</th>
							<th>SKU</th>
							<th class="text-right">Harga Dasar</th>
							<th class="text-right">POS Kasir (0%)</th>
							<th class="text-right">Aplikasi (+5%, Rnd 500)</th>
							<th class="text-right">Marketplace (+20%, Rnd 1k)</th>
							<th class="text-right w-28">Simulasi</th>
						</tr>
					</thead>
					<tbody>
						{#each menuStore.menuItems as m}
							{#each m.variants as v}
								{@const posPrice = calculateChannelPrice({ basePrice: v.base_price, markupPct: 0 }).finalPrice}
								{@const appPrice = calculateChannelPrice({ basePrice: v.base_price, markupPct: 5, roundingMode: 'nearest', roundingStep: 500 }).finalPrice}
								{@const mktPrice = calculateChannelPrice({ basePrice: v.base_price, markupPct: 20, roundingMode: 'nearest', roundingStep: 1000 }).finalPrice}
								<tr>
									<td>
										<div class="flex flex-col">
											<strong class="text-[var(--text-main)]">{m.name}</strong>
											<span class="text-xs text-[var(--text-muted)]">{v.name}</span>
										</div>
									</td>
									<td class="font-mono text-xs text-[var(--text-subtle)]">{v.sku}</td>
									<td class="text-right font-mono font-bold text-[var(--text-muted)]">
										{formatRupiah(v.base_price)}
									</td>
									<td class="text-right font-mono font-bold text-emerald-400">
										{formatRupiah(posPrice)}
									</td>
									<td class="text-right font-mono font-bold text-sky-400">
										{formatRupiah(appPrice)}
									</td>
									<td class="text-right font-mono font-bold text-amber-400">
										{formatRupiah(mktPrice)}
									</td>
									<td class="text-right">
										<button
											type="button"
											class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-indigo-300 hover:text-indigo-200 transition"
											onclick={() => {
												menuStore.calcVariantId = v.id;
												menuStore.isPricingCalculatorOpen = true;
											}}
										>
											Kalkulator
										</button>
									</td>
								</tr>
							{/each}
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	<!-- TAB 6: KETERSEDIAAN MENU PER GERAI (PG-cat-availability, T-04.5) -->
	{:else if catalogStore.activeTab === 'availability'}
		<div class="flex flex-col gap-6">
			<div class="catalog-toolbar">
				<div class="toolbar-left">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-sm font-bold text-[var(--text-main)]">Matriks Ketersediaan Menu per Gerai &amp; Channel</h3>
						<span class="text-xs text-[var(--text-subtle)]">
							Kontrol menu yang habis (sold-out) tanpa menghapus master data (AC-04.5).
						</span>
					</div>

					<select
						class="toolbar-select ml-2"
						bind:value={menuStore.selectedOutletFilter}
						onchange={() => menuStore.loadAll()}
						aria-label="Pilih Gerai Ketersediaan"
					>
						{#each DEMO_OUTLETS as out}
							<option value={out.id}>{out.name} ({out.code})</option>
						{/each}
					</select>
				</div>

				<div class="toolbar-right">
					<span class="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
						Terpantau: {menuStore.availability.length} Status Gerai
					</span>
				</div>
			</div>

			<div class="data-table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>Menu &amp; Varian</th>
							<th>Gerai</th>
							<th>Channel Penjualan</th>
							<th>Status Ketersediaan</th>
							<th>Alasan / Keterangan</th>
							<th>Waktu Update</th>
							<th class="w-36 text-right">Aksi Cepat</th>
						</tr>
					</thead>
					<tbody>
						{#each menuStore.availability as a}
							<tr>
								<td>
									<div class="flex flex-col">
										<strong class="text-[var(--text-main)]">{a.menu_item_name}</strong>
										<span class="text-xs text-[var(--text-muted)] font-mono">{a.variant_id || 'Semua Varian'}</span>
									</div>
								</td>
								<td>
									<span class="font-medium text-xs text-[var(--text-main)]">
										{DEMO_OUTLETS.find((o) => o.id === a.outlet_id)?.name || a.outlet_id}
									</span>
								</td>
								<td>
									<span class="uppercase text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
										{a.channel_code}
									</span>
								</td>
								<td>
									{#if a.is_available}
										<span class="pill-badge pill-success">Tersedia Siap Jual</span>
									{:else}
										<span class="pill-badge pill-danger">HABIS (Sold Out)</span>
									{/if}
								</td>
								<td class="text-xs text-[var(--text-muted)]">
									{a.sold_out_reason || '-'}
								</td>
								<td class="text-xs text-[var(--text-subtle)] font-mono">
									{a.updated_at ? new Date(a.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
								</td>
								<td class="text-right">
									<button
										type="button"
										class="px-2.5 py-1 text-xs rounded font-medium transition {a.is_available ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'}"
										onclick={() => menuStore.toggleMenuAvailability(a, 'Stok habis sementara')}
									>
										{a.is_available ? 'Tandai Habis' : 'Pulihkan Tersedia'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

	<!-- TAB 7: MASTER KATEGORI (PG-cat-categories) -->
	{:else if catalogStore.activeTab === 'categories'}
		<div class="catalog-toolbar">
			<div class="toolbar-left">
				<span class="text-xs text-[var(--text-muted)] font-medium">
					Kelola klasifikasi bahan baku untuk pelaporan dan pengaturan POS.
				</span>
			</div>
			<div class="toolbar-right">
				{#if canManageCatalog}
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => catalogStore.openCreateCategory()}
						id="btn-tambah-kategori"
					>
						<Icon name="plus" size={16} />
						<span>Tambah Kategori Baru</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="data-table-container">
			<table class="data-table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama Kategori</th>
						<th>Deskripsi</th>
						<th>Jumlah Bahan Terdaftar</th>
						{#if canManageCatalog}
							<th class="w-24 text-right">Aksi</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each catalogStore.categories as cat}
						<tr>
							<td class="font-mono font-bold text-emerald-400">{cat.code}</td>
							<td><strong class="text-[var(--text-main)]">{cat.name}</strong></td>
							<td class="text-xs text-[var(--text-muted)]">{cat.description || '-'}</td>
							<td>
								<span class="pill-badge pill-info font-mono">{cat.item_count || 0} bahan</span>
							</td>
							{#if canManageCatalog}
								<td class="text-right">
									<button
										type="button"
										class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
										onclick={() => catalogStore.openEditCategory(cat)}
									>
										Ubah
									</button>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

	<!-- TAB 3: SATUAN UKURAN & KONVERSI (PG-cat-units) -->
	{:else if catalogStore.activeTab === 'units'}
		<div class="flex flex-col gap-6">
			<!-- Section 1: Master Satuan Ukuran -->
			<div class="flex flex-col gap-3">
				<div class="catalog-toolbar">
					<div class="toolbar-left">
						<h3 class="text-sm font-bold text-[var(--text-main)]">Master Satuan Ukuran (Units of Measurement)</h3>
					</div>
					<div class="toolbar-right">
						{#if canManageCatalog}
							<button
								type="button"
								class="btn btn-secondary text-xs"
								style="min-height: 36px;"
								onclick={() => catalogStore.openCreateUnit()}
								id="btn-tambah-satuan"
							>
								<Icon name="plus" size={14} />
								<span>Tambah Satuan</span>
							</button>
						{/if}
					</div>
				</div>

				<div class="data-table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th>Simbol Satuan</th>
								<th>Nama Lengkap</th>
								<th>Tipe Besaran</th>
								<th>Status Sistem</th>
							</tr>
						</thead>
						<tbody>
							{#each catalogStore.units as u}
								<tr>
									<td class="font-mono font-bold text-emerald-400">{u.symbol}</td>
									<td><strong class="text-[var(--text-main)]">{u.name}</strong></td>
									<td><span class="capitalize text-xs text-[var(--text-muted)]">{u.type}</span></td>
									<td>
										{#if u.is_system}
											<span class="pill-badge pill-info">Baku Sistem</span>
										{:else}
											<span class="pill-badge pill-success">Kustom</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Section 2: Aturan Konversi Satuan (Bebas Siklus AC-03.2) -->
			<div class="flex flex-col gap-3">
				<div class="catalog-toolbar">
					<div class="toolbar-left">
						<div class="flex flex-col gap-0.5">
							<h3 class="text-sm font-bold text-[var(--text-main)]">Aturan Konversi Antar-Satuan (Bebas Siklus)</h3>
							<span class="text-xs text-[var(--text-subtle)]">Konversi terverifikasi mencegah siklus rekursif (AC-03.2)</span>
						</div>
					</div>
					<div class="toolbar-right">
						{#if canManageCatalog}
							<button
								type="button"
								class="btn btn-primary text-xs"
								style="min-height: 36px;"
								onclick={() => catalogStore.openCreateConversion()}
								id="btn-tambah-konversi"
							>
								<Icon name="plus" size={14} />
								<span>Tambah Aturan Konversi</span>
							</button>
						{/if}
					</div>
				</div>

				<div class="data-table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th>Dari Satuan</th>
								<th>Ke Satuan</th>
								<th>Faktor Pengali</th>
								<th>Formula Hubungan</th>
								{#if canManageCatalog}
									<th class="w-24 text-right">Aksi</th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each catalogStore.conversions as conv}
								<tr>
									<td class="font-mono font-bold text-[var(--text-main)]">{conv.from_unit_symbol}</td>
									<td class="font-mono font-bold text-emerald-400">{conv.to_unit_symbol}</td>
									<td class="font-mono font-semibold">{parseFloat(conv.factor).toLocaleString('id-ID')}</td>
									<td class="text-xs text-[var(--text-muted)]">{conv.description}</td>
									{#if canManageCatalog}
										<td class="text-right">
											<button
												type="button"
												class="px-2 py-1 text-xs rounded text-rose-400 hover:bg-rose-500/10 transition"
												onclick={() => catalogStore.deleteConversion(conv.id)}
											>
												Hapus
											</button>
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

	<!-- TAB 4: MASTER PEMASOK (PG-proc-suppliers, AC-03.7) -->
	{:else if catalogStore.activeTab === 'suppliers'}
		<div class="catalog-toolbar">
			<div class="toolbar-left">
				<!-- Pencarian -->
				<div class="toolbar-search">
					<Icon name="magnifying-glass" size={15} class="toolbar-search-icon" />
					<input
						type="text"
						class="toolbar-search-input"
						placeholder="Cari pemasok, kontak, atau kota..."
						bind:value={catalogStore.supplierSearchQuery}
						id="input-search-suppliers"
					/>
				</div>

				<!-- Filter Tipe Pemasok -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedSupplierTypeFilter}
					aria-label="Filter Tipe Pemasok"
				>
					<option value="all">Semua Tipe Pemasok</option>
					<option value="hq_warehouse">Gudang Pusat (HQ Hub)</option>
					<option value="external">Vendor Eksternal</option>
				</select>

				<!-- Filter Status Pemasok -->
				<select
					class="toolbar-select"
					bind:value={catalogStore.selectedSupplierStatusFilter}
					aria-label="Filter Status Pemasok"
				>
					<option value="all">Semua Status</option>
					<option value="active">Pemasok Aktif</option>
					<option value="inactive">Nonaktif</option>
				</select>
			</div>

			<div class="toolbar-right">
				{#if canManageCatalog}
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => catalogStore.openCreateSupplier()}
						id="btn-tambah-pemasok"
					>
						<Icon name="plus" size={16} />
						<span>Tambah Pemasok Baru</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="data-table-container">
			<table class="data-table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama Pemasok</th>
						<th>Tipe Rekanan</th>
						<th>Kontak PIC &amp; Telepon</th>
						<th>Kota</th>
						<th>Syarat Pembayaran</th>
						<th>Status</th>
						<th class="w-24 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each catalogStore.filteredSuppliers as sup}
						<tr>
							<td class="font-mono font-bold text-emerald-400">{sup.code}</td>
							<td>
								<div class="flex flex-col">
									<strong class="text-[var(--text-main)]">{sup.name}</strong>
									{#if sup.has_transactions}
										<span class="text-[10.5px] text-[var(--text-subtle)]">Ada riwayat transaksi</span>
									{/if}
								</div>
							</td>
							<td>
								{#if sup.type === 'hq_warehouse'}
									<span class="pill-badge pill-info font-bold">Gudang Pusat HQ</span>
								{:else}
									<span class="pill-badge pill-success">Vendor Luar</span>
								{/if}
							</td>
							<td>
								<div class="flex flex-col text-xs">
									<span class="text-[var(--text-main)] font-medium">{sup.contact_person || '-'}</span>
									<span class="text-[var(--text-subtle)] font-mono">{sup.phone || '-'}</span>
								</div>
							</td>
							<td class="text-xs">{sup.city || '-'}</td>
							<td>
								<span class="text-xs font-semibold text-emerald-400">
									{sup.payment_terms_days === 0 ? 'COD' : `Net ${sup.payment_terms_days}h`}
								</span>
							</td>
							<td>
								<StatusBadge status={sup.status === 'active' ? 'active' : 'inactive'} />
							</td>
							<td class="text-right">
								<button
									type="button"
									class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
									onclick={() => catalogStore.openSupplierDetail(sup)}
								>
									Detail
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- MODAL DIALOGS -->
<StockItemFormModal
	open={catalogStore.isItemModalOpen}
	item={catalogStore.editingItem}
	categories={catalogStore.categories}
	units={catalogStore.units}
	onclose={() => catalogStore.closeItemModal()}
	onsave={(data) => catalogStore.saveItem(data)}
/>

<StockItemDetailDrawer
	open={catalogStore.isDetailDrawerOpen}
	item={catalogStore.selectedItem}
	costHistory={catalogStore.selectedItemCosts}
	onclose={() => catalogStore.closeItemDetail()}
	onedit={(item) => catalogStore.openEditItem(item)}
	onarchive={(item) => catalogStore.archiveItem(item)}
	onrestore={(item) => catalogStore.restoreItem(item)}
	onupdateminstock={(outId, min) => catalogStore.updateMinStock(outId, min)}
/>

<CategoryFormModal
	open={catalogStore.isCategoryModalOpen}
	category={catalogStore.editingCategory}
	onclose={() => catalogStore.closeCategoryModal()}
	onsave={(data) => catalogStore.saveCategory(data)}
/>

<UnitFormModal
	open={catalogStore.isUnitModalOpen}
	onclose={() => catalogStore.closeUnitModal()}
	onsave={(data) => catalogStore.saveUnit(data)}
/>

<ConversionFormModal
	open={catalogStore.isConversionModalOpen}
	units={catalogStore.units}
	existingConversions={catalogStore.conversions}
	onclose={() => catalogStore.closeConversionModal()}
	onsave={(data) => catalogStore.saveConversion(data)}
/>

<SupplierFormModal
	open={catalogStore.isSupplierModalOpen}
	supplier={catalogStore.editingSupplier}
	onclose={() => catalogStore.closeSupplierModal()}
	onsave={(data) => catalogStore.saveSupplier(data)}
/>

<SupplierDetailModal
	open={!!catalogStore.selectedSupplierDetail}
	supplier={catalogStore.selectedSupplierDetail}
	onclose={() => catalogStore.closeSupplierDetail()}
	onedit={(sup) => catalogStore.openEditSupplier(sup)}
	ondelete={(sup) => catalogStore.deleteSupplier(sup)}
/>

<CsvImportModal
	open={catalogStore.isCsvModalOpen}
	step={catalogStore.csvStep}
	preview={catalogStore.csvPreview}
	commitResult={catalogStore.csvCommitResult}
	isLoading={catalogStore.isCsvLoading}
	onclose={() => catalogStore.closeCsvModal()}
	onrunpreview={() => catalogStore.runCsvPreview()}
	onruncommit={() => catalogStore.runCsvCommit()}
	ondownloaderrors={() => catalogStore.downloadCsvErrors()}
/>

<!-- MS-04 Modal Dialogs & Drawers -->
<MenuItemDetailDrawer />
<MenuItemFormModal />
<RecipeEditorModal />
<ModifierGroupFormModal />
<PricingCalculatorModal />

