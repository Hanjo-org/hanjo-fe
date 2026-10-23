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

	import type { StockItem, Supplier } from '#lib/api/contract/types.js';

	let itemViewMode = $state<'grid' | 'table'>('table');
	let itemsPage = $state(1);
	let itemsPerPage = $state(10);

	// Reset halaman saat query pencarian atau filter bahan baku berubah
	$effect(() => {
		const _ = `${catalogStore.itemSearchQuery}|${catalogStore.selectedCategoryFilter}|${catalogStore.selectedProducibleFilter}|${catalogStore.selectedExternalFilter}|${catalogStore.selectedStatusFilter}`;
		itemsPage = 1;
	});

	const totalFilteredItems = $derived(catalogStore.filteredItems.length);
	const paginatedItems = $derived.by(() => {
		const start = (itemsPage - 1) * itemsPerPage;
		return catalogStore.filteredItems.slice(start, start + itemsPerPage);
	});

	onMount(() => {
		catalogStore.loadAll();
		try {
			const saved = localStorage.getItem('hanjo_catalog_view_mode');
			if (saved === 'grid' || saved === 'table') {
				itemViewMode = saved;
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
</script>

<div class="catalog-page-container">
	<!-- 1. Page Header -->
	<header class="catalog-page-header">
		<div class="page-header-lead">
			<div class="page-header-icon">
				<Icon name="archive-box" size={26} />
			</div>
			<div class="page-header-text">
				<h1 class="page-title">Katalog Bahan, Satuan &amp; Pemasok</h1>
				<p class="page-subtitle">
					Master inventaris bahan baku, formula satuan ukuran bebas siklus, dan rekanan pemasok pengadaan.
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
			<span class="stat-box-sub">Semua Kategori Aktif</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Kategori Item</span>
			<span class="stat-box-val">{catalogStore.categories.length}</span>
			<span class="stat-box-sub">Klasifikasi Bahan</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Aturan Konversi</span>
			<span class="stat-box-val">{catalogStore.conversions.length}</span>
			<span class="stat-box-sub">Bebas Siklus (AC-03.2)</span>
		</div>

		<div class="stat-box">
			<span class="stat-box-title">Rekanan Pemasok</span>
			<span class="stat-box-val">{catalogStore.suppliers.length}</span>
			<span class="stat-box-sub">HQ Hub &amp; Eksternal</span>
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
			<span>Satuan &amp; Konversi ({catalogStore.units.length})</span>
		</button>

		<button
			type="button"
			class="catalog-tab-btn {catalogStore.activeTab === 'suppliers' ? 'active' : ''}"
			onclick={() => (catalogStore.activeTab = 'suppliers')}
			id="tab-pemasok"
		>
			<Icon name="truck" size={16} />
			<span>Master Pemasok ({catalogStore.suppliers.length})</span>
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
					<div class="item-card" id="item-card-{item.id}">
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
							<th class="text-right w-44">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedItems as item}
							<tr id="item-row-{item.id}">
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
									<div class="flex items-center justify-end gap-2">
										<button
											type="button"
											class="btn btn-secondary text-xs"
											style="min-height: 32px; padding: 4px 10px;"
											onclick={() => catalogStore.openItemDetail(item)}
											title="Lihat Stok & Detail"
										>
											<span>Lihat Stok</span>
											<Icon name="arrow-right" size={12} />
										</button>
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

	<!-- TAB 2: MASTER KATEGORI (PG-cat-categories) -->
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
