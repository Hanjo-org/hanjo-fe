<script lang="ts">
	/**
	 * Detail Drawer / Modal: Informasi Komprehensif Bahan Baku (PG-cat-item-detail)
	 * Mengikuti Golden Rule 2 (Thin Svelte), Golden Rule 10 (Tokens), AC-03.5 & AC-03.6
	 * Rule §2.7: Generous Padding, Anti-Sesak, Clean Segmented Tabs & Progressive Disclosure
	 */
	import Modal from '#lib/components/feedback/Modal.svelte';
	import Icon from '#lib/components/data/Icon.svelte';
	import StatusBadge from '#lib/components/data/StatusBadge.svelte';
	import { session } from '#lib/auth/session.svelte.js';
	import { formatRupiah } from '#lib/utils/format.js';
	import type { StockItem, StockItemCostHistory } from '#lib/api/contract/types.js';

	interface Props {
		open: boolean;
		item: StockItem | null;
		costHistory: StockItemCostHistory | null;
		onclose: () => void;
		onedit: (item: StockItem) => void;
		onarchive: (item: StockItem) => Promise<boolean>;
		onrestore: (item: StockItem) => Promise<boolean>;
		onupdateminstock: (outletId: string, minStock: string) => Promise<boolean>;
	}

	let {
		open,
		item,
		costHistory,
		onclose,
		onedit,
		onarchive,
		onrestore,
		onupdateminstock
	}: Props = $props();

	// Local Active Tab in Detail Drawer
	let activeTab = $state<'info' | 'stock' | 'pricing' | 'min_stock' | 'recipes'>('info');

	// Local state for updating min stock
	let editingMinOutletId = $state<string | null>(null);
	let newMinStockVal = $state('');

	const userRole = $derived(session.user?.role || 'owner');
	const isStoreManager = $derived(userRole === 'store_manager' || userRole === 'cashier');

	function startEditMinStock(outletId: string, currentMin: string) {
		if (isStoreManager) return;
		editingMinOutletId = outletId;
		newMinStockVal = currentMin;
	}

	async function saveMinStock(outletId: string) {
		if (!newMinStockVal.trim()) return;
		await onupdateminstock(outletId, newMinStockVal.trim());
		editingMinOutletId = null;
	}

	function cancelEditMinStock() {
		editingMinOutletId = null;
		newMinStockVal = '';
	}

	const isItemOutOfStock = $derived.by(() => {
		if (item?.status === 'archived') return false;
		return parseFloat(item?.current_stock || '0') <= 0;
	});

	const isItemLowStock = $derived.by(() => {
		if (item?.status === 'archived' || isItemOutOfStock) return false;
		if (!item?.stock_by_outlet) return false;
		const entries = Object.values(item.stock_by_outlet);
		return entries.some((d) => {
			const curr = parseFloat(d.current || '0');
			const min = parseFloat(d.min || '0');
			return min > 0 && curr <= min;
		});
	});
</script>

{#if item}
	<Modal
		{open}
		title={item.name}
		subtitle={`Detail Spesifikasi & Inventaris SKU ${item.code}`}
		maxWidth="840px"
		{onclose}
	>
		<div class="detail-container">
			<!-- Header Identity Card -->
			<div class="detail-header-card {isItemOutOfStock ? 'header-out-of-stock' : isItemLowStock ? 'header-low-stock' : ''}">
				<div class="header-main-info">
					<div class="header-badges-row">
						<span class="item-code-badge">{item.code}</span>
						<StatusBadge status={item.status === 'active' ? 'active' : 'archived'} size="md" />
						{#if !item.can_buy_external}
							<span class="pill-badge pill-warning">Hanya Gudang HQ</span>
						{:else}
							<span class="pill-badge pill-success">Boleh Beli Luar</span>
						{/if}
						{#if item.is_producible}
							<span class="pill-badge pill-info">Bahan Olahan</span>
						{/if}
					</div>

					<div class="header-metadata-row">
						<span class="meta-tag">
							<Icon name="tag" size={14} />
							<span>{item.category_name || 'Umum'}</span>
						</span>
						<span class="meta-separator">&bull;</span>
						<span class="meta-unit">
							Satuan Dasar: <strong>{item.base_unit_symbol}</strong>
						</span>
					</div>
				</div>

				<div class="header-price-card">
					<span class="price-label">Harga Ref. Pusat</span>
					<span class="price-value">{formatRupiah(item.hq_ref_price || 0)}</span>
					<span class="price-sub">per {item.base_unit_symbol}</span>
				</div>
			</div>

			<!-- Sub Tabs: Segmented Navigation -->
			<div class="detail-tabs-bar" role="tablist" aria-label="Tab Menu Detail Bahan">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'info'}
					class="detail-tab-btn {activeTab === 'info' ? 'active' : ''}"
					onclick={() => (activeTab = 'info')}
				>
					<Icon name="information-circle" size={15} />
					<span>Ringkasan Info</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'stock'}
					class="detail-tab-btn {activeTab === 'stock' ? 'active' : ''}"
					onclick={() => (activeTab = 'stock')}
				>
					<Icon name="building-storefront" size={15} />
					<span>Stok per Gerai</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'pricing'}
					class="detail-tab-btn {activeTab === 'pricing' ? 'active' : ''}"
					onclick={() => (activeTab = 'pricing')}
				>
					<Icon name="banknotes" size={15} />
					<span>Riwayat Harga &amp; HPP</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'min_stock'}
					class="detail-tab-btn {activeTab === 'min_stock' ? 'active' : ''}"
					onclick={() => (activeTab = 'min_stock')}
				>
					<Icon name="adjustments-horizontal" size={15} />
					<span>Batas Minimum Gerai</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'recipes'}
					class="detail-tab-btn {activeTab === 'recipes' ? 'active' : ''}"
					onclick={() => (activeTab = 'recipes')}
				>
					<Icon name="book-open" size={15} />
					<span>Dipakai di Resep</span>
					{#if (item.recipes_using_count || 0) > 0}
						<span class="tab-count-badge">{item.recipes_using_count}</span>
					{/if}
				</button>
			</div>

			<!-- TAB CONTENT PANELS -->
			<div class="detail-content-area">
				<!-- TAB 1: RINGKASAN INFO -->
				{#if activeTab === 'info'}
					<div class="info-grid">
						<div class="info-tile">
							<span class="info-tile-label">Suhu Penyimpanan</span>
							<div class="info-tile-value">
								<span class="pill-badge pill-info">
									{item.storage_temperature === 'chilled' ? 'Dingin / Kulkas (2°C - 4°C)' : item.storage_temperature === 'frozen' ? 'Beku / Freezer (< -18°C)' : 'Suhu Ruang (Ambient)'}
								</span>
							</div>
						</div>

						<div class="info-tile">
							<span class="info-tile-label">Pengadaan Langsung (Beli Luar)</span>
							<div class="info-tile-value">
								{#if item.can_buy_external}
									<span class="pill-badge pill-success">Diizinkan (Boleh PO Luar)</span>
								{:else}
									<span class="pill-badge pill-warning">Terkunci (Hanya Suplai Gudang Pusat)</span>
								{/if}
							</div>
						</div>

						<div class="info-tile">
							<span class="info-tile-label">Bahan Olahan Gerai (BOM Batch)</span>
							<div class="info-tile-value">
								{#if item.is_producible}
									<span class="pill-badge pill-info">Ya, diproduksi mandiri di gerai</span>
								{:else}
									<span class="pill-badge pill-neutral">Tidak (Bahan mentah siap pakai)</span>
								{/if}
							</div>
						</div>

						<div class="info-tile">
							<span class="info-tile-label">Status Mutasi Stok</span>
							<div class="info-tile-value">
								{#if item.has_stock_movements}
									<span class="pill-badge pill-warning">
										<Icon name="lock-closed" size={13} />
										<span>Sudah memiliki transaksi (Base Unit dikunci permanen)</span>
									</span>
								{:else}
									<span class="pill-badge pill-success">
										<Icon name="check-circle" size={13} />
										<span>Belum ada transaksi (Boleh ubah Base Unit)</span>
									</span>
								{/if}
							</div>
						</div>

						<div class="info-tile col-span-2">
							<span class="info-tile-label">Catatan &amp; Deskripsi Bahan</span>
							<p class="description-text">
								{item.description || 'Tidak ada catatan atau instruksi khusus untuk bahan baku ini.'}
							</p>
						</div>
					</div>

				<!-- TAB 2: STOK PER GERAI -->
				{:else if activeTab === 'stock'}
					<div class="tab-panel-stack">
						{#if isStoreManager}
							<div class="detail-notice-callout info">
								<Icon name="information-circle" size={18} />
								<span>Mode Store Manager: Anda hanya berwenang melihat saldo stok gerai tugas Anda (AC-03.6).</span>
							</div>
						{/if}

						<div class="data-table-container">
							<table class="data-table">
								<thead>
									<tr>
										<th>Gerai / Outlet</th>
										<th>Sisa Stok Fisik</th>
										<th>Status Ambang</th>
									</tr>
								</thead>
								<tbody>
									{#if item.stock_by_outlet && Object.keys(item.stock_by_outlet).length > 0}
										{#each Object.entries(item.stock_by_outlet) as [outletId, data]}
											{@const currentNum = parseFloat(data.current || '0')}
											{@const minNum = parseFloat(data.min || '0')}
											{@const isOutOfStock = currentNum <= 0}
											{@const isCritical = currentNum <= minNum && !isOutOfStock}
											<tr class={isOutOfStock ? 'row-out-of-stock' : isCritical ? 'row-low-stock' : ''}>
												<td>
													<strong class="text-[var(--text-main)] capitalize">
														{outletId === 'out-jkt-01' ? 'Jodi Senopati (Jakarta)' : outletId === 'out-bdg-01' ? 'Jodi Dago (Bandung)' : outletId === 'out-sby-01' ? 'Jodi Gubeng (Surabaya)' : outletId === 'out-ubud-01' ? 'Kaveloka Ubud (Bali)' : outletId === 'out-plaga-01' ? 'Plaga Bistro (Bali)' : outletId}
													</strong>
												</td>
												<td>
													<span class="font-mono font-bold {isOutOfStock ? 'text-rose-400' : isCritical ? 'text-amber-400' : 'text-emerald-400'}">
														{parseFloat(data.current).toLocaleString('id-ID')} {item.base_unit_symbol}
													</span>
												</td>
												<td>
													{#if isOutOfStock}
														<span class="pill-badge pill-danger">Stok Habis (0)</span>
													{:else if isCritical}
														<span class="pill-badge pill-warning">Stok Menipis (&le; {parseFloat(data.min).toLocaleString('id-ID')})</span>
													{:else}
														<span class="pill-badge pill-success">Aman (Batas Min: {parseFloat(data.min).toLocaleString('id-ID')})</span>
													{/if}
												</td>
											</tr>
										{/each}
									{:else}
										<tr>
											<td colspan="3" class="text-center py-8 text-[var(--text-muted)]">
												Belum ada data stok per outlet untuk bahan ini.
											</td>
										</tr>
									{/if}
								</tbody>
							</table>
						</div>
					</div>

				<!-- TAB 3: RIWAYAT HARGA & HPP -->
				{:else if activeTab === 'pricing'}
					<div class="tab-panel-stack">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="pricing-summary-card">
								<span class="card-caption">Harga Referensi Pusat (HQ)</span>
								<strong class="card-amount">{formatRupiah(item.hq_ref_price || 0)}</strong>
								<span class="card-hint">Murni acuan belanja acuan pengadaan pusat</span>
							</div>
							<div class="pricing-summary-card">
								<span class="card-caption">Harga Pembelian Terakhir</span>
								<strong class="card-amount text-emerald-400">
									{formatRupiah(costHistory?.last_purchased_price || item.hq_ref_price || 0)} / {item.base_unit_symbol}
								</strong>
								<span class="card-hint">Tercatat dari faktur pengadaan supplier terbaru</span>
							</div>
						</div>

						<h4 class="section-subheading">
							Faktur Pengadaan Terakhir
						</h4>
						<div class="data-table-container">
							<table class="data-table">
								<thead>
									<tr>
										<th>Tanggal</th>
										<th>No. Faktur</th>
										<th>Pemasok</th>
										<th>Jumlah</th>
										<th>Harga Satuan</th>
									</tr>
								</thead>
								<tbody>
									{#if costHistory && costHistory.history.length > 0}
										{#each costHistory.history as row}
											<tr>
												<td>{row.date}</td>
												<td class="font-mono text-xs">{row.invoice_number}</td>
												<td>{row.supplier_name}</td>
												<td>{parseFloat(row.qty).toLocaleString('id-ID')} {row.unit}</td>
												<td class="font-mono font-semibold text-emerald-400">
													{formatRupiah(row.unit_price)}
												</td>
											</tr>
										{/each}
									{:else}
										<tr>
											<td colspan="5" class="text-center py-8 text-[var(--text-muted)]">
												Belum ada riwayat faktur pembelian tercatat.
											</td>
										</tr>
									{/if}
								</tbody>
							</table>
						</div>
					</div>

				<!-- TAB 4: BATAS MINIMUM GERAI (AC-03.6) -->
				{:else if activeTab === 'min_stock'}
					<div class="tab-panel-stack">
						{#if isStoreManager}
							<div class="detail-notice-callout warning">
								<Icon name="lock-closed" size={18} />
								<span>Peran Store Manager hanya memiliki hak baca (read-only) pada batas stok minimum (AC-03.6).</span>
							</div>
						{:else}
							<div class="detail-notice-callout info">
								<Icon name="information-circle" size={18} />
								<span>HQ Admin &amp; Owner dapat menyetel batas minimum stok berbeda per masing-masing gerai.</span>
							</div>
						{/if}

						<div class="data-table-container">
							<table class="data-table">
								<thead>
									<tr>
										<th>Gerai / Outlet</th>
										<th>Batas Minimum Stok</th>
										{#if !isStoreManager}
											<th class="w-32 text-right">Aksi</th>
										{/if}
									</tr>
								</thead>
								<tbody>
									{#if item.stock_by_outlet && Object.keys(item.stock_by_outlet).length > 0}
										{#each Object.entries(item.stock_by_outlet) as [outletId, data]}
											<tr>
												<td>
													<strong class="text-[var(--text-main)] capitalize">
														{outletId === 'out-jkt-01' ? 'Jodi Senopati (Jakarta)' : outletId === 'out-bdg-01' ? 'Jodi Dago (Bandung)' : outletId === 'out-sby-01' ? 'Jodi Gubeng (Surabaya)' : outletId === 'out-ubud-01' ? 'Kaveloka Ubud (Bali)' : outletId === 'out-plaga-01' ? 'Plaga Bistro (Bali)' : outletId}
													</strong>
												</td>
												<td>
													{#if editingMinOutletId === outletId}
														<div class="flex items-center gap-2">
															<input
																type="number"
																class="toolbar-search-input text-xs"
																style="max-width: 140px; min-height: 38px; padding: 6px 12px;"
																bind:value={newMinStockVal}
															/>
															<span class="text-xs text-[var(--text-subtle)] font-medium">{item.base_unit_symbol}</span>
														</div>
													{:else}
														<span class="font-mono font-semibold text-[var(--text-main)]">
															{parseFloat(data.min).toLocaleString('id-ID')} {item.base_unit_symbol}
														</span>
													{/if}
												</td>
												{#if !isStoreManager}
													<td class="text-right">
														{#if editingMinOutletId === outletId}
															<div class="flex items-center justify-end gap-2">
																<button
																	type="button"
																	class="btn btn-primary"
																	style="min-height: 34px; padding: 6px 14px; font-size: 12px;"
																	onclick={() => saveMinStock(outletId)}
																>
																	Simpan
																</button>
																<button
																	type="button"
																	class="btn btn-secondary"
																	style="min-height: 34px; padding: 6px 14px; font-size: 12px;"
																	onclick={cancelEditMinStock}
																>
																	Batal
																</button>
															</div>
														{:else}
															<button
																type="button"
																class="btn btn-secondary"
																style="min-height: 34px; padding: 6px 14px; font-size: 12px;"
																onclick={() => startEditMinStock(outletId, data.min)}
															>
																Ubah
															</button>
														{/if}
													</td>
												{/if}
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>

				<!-- TAB 5: DIPAKAI DI RESEP (AC-03.5) -->
				{:else if activeTab === 'recipes'}
					<div class="tab-panel-stack">
						{#if (item.recipes_using_count || 0) > 0}
							<div class="detail-notice-callout warning">
								<Icon name="exclamation-triangle" size={18} />
								<span>
									Bahan ini saat ini aktif digunakan dalam <strong>{item.recipes_using_count} resep menu</strong>. Pengarsipan dilarang sebelum resep dialihkan atau dinonaktifkan (AC-03.5).
								</span>
							</div>
						{:else}
							<div class="detail-notice-callout info">
								<Icon name="check-circle" size={18} />
								<span>Bahan ini bebas dari resep menu aktif dan aman untuk diarsipkan bila stok fisik telah habis.</span>
							</div>
						{/if}

						<div class="recipes-list-card">
							<span class="recipes-card-title">Resep Terkait yang Menggunakan Bahan Ini:</span>
							<ul class="recipes-list">
								{#if item.id.includes('kop')}
									<li>Caffe Latte 12oz (Hot / Cold) &mdash; takaran: <strong>18g</strong> espresso per porsi</li>
									<li>Americano Double Shot &mdash; takaran: <strong>18g</strong> espresso per porsi</li>
									<li>Piccolo Latte 8oz &mdash; takaran: <strong>14g</strong> espresso per porsi</li>
								{:else if item.id.includes('sus')}
									<li>Caffe Latte 12oz &mdash; takaran: <strong>180ml</strong> susu fresh milk</li>
									<li>Matcha Latte 12oz &mdash; takaran: <strong>160ml</strong> susu fresh milk</li>
									<li>Cappuccino 8oz &mdash; takaran: <strong>120ml</strong> susu fresh milk</li>
								{:else}
									<li>Menu Signature Beverage Musiman &mdash; varian rasa khusus outlet</li>
								{/if}
							</ul>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#snippet footer()}
			<div class="detail-modal-footer">
				<div>
					{#if !isStoreManager}
						{#if item.status === 'active'}
							<button
								type="button"
								class="btn btn-danger-outline"
								onclick={() => onarchive(item)}
							>
								<Icon name="archive-box" size={16} />
								<span>Arsipkan Bahan</span>
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-secondary"
								onclick={() => onrestore(item)}
							>
								<Icon name="arrow-path" size={16} />
								<span>Aktifkan Kembali</span>
							</button>
						{/if}
					{/if}
				</div>

				<div class="footer-actions-right">
					<button type="button" class="btn btn-secondary" onclick={onclose}>
						Tutup
					</button>
					{#if !isStoreManager}
						<button
							type="button"
							class="btn btn-primary"
							onclick={() => {
								onclose();
								onedit(item);
							}}
						>
							<Icon name="pencil-square" size={16} />
							<span>Ubah Data Bahan</span>
						</button>
					{/if}
				</div>
			</div>
		{/snippet}
	</Modal>
{/if}

<style>
	.detail-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Header Card */
	.detail-header-card {
		padding: 20px 24px;
		border-radius: var(--radius-xl);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		transition: all 0.2s ease;
	}

	.detail-header-card.header-low-stock {
		background: rgba(245, 158, 11, 0.08);
		border-color: rgba(245, 158, 11, 0.35);
	}

	.detail-header-card.header-out-of-stock {
		background: rgba(239, 68, 68, 0.085);
		border-color: rgba(239, 68, 68, 0.35);
	}

	@media (max-width: 640px) {
		.detail-header-card {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.header-main-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
	}

	.header-badges-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.header-metadata-row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
		color: var(--text-muted);
	}

	.meta-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.meta-separator {
		color: var(--text-subtle);
		opacity: 0.6;
	}

	.meta-unit strong {
		color: var(--text-main);
	}

	.header-price-card {
		padding: 12px 20px;
		border-radius: var(--radius-lg);
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		min-width: 150px;
	}

	.price-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-subtle);
		font-weight: 600;
	}

	.price-value {
		font-size: 18.5px;
		font-weight: 700;
		color: var(--brand-primary);
		line-height: 1.25;
		margin-top: 2px;
	}

	.price-sub {
		font-size: 11.5px;
		color: var(--text-muted);
	}

	/* Segmented Tabs Navigation */
	.detail-tabs-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px;
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-xl);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.detail-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		min-height: 40px;
		border-radius: var(--radius-lg);
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.18s ease;
		user-select: none;
	}

	.detail-tab-btn:hover {
		color: var(--text-main);
		background: var(--bg-panel-hover);
	}

	.detail-tab-btn.active {
		background: var(--bg-panel);
		color: var(--brand-primary);
		border-color: var(--border-panel);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
	}

	.tab-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 700;
		background: rgba(16, 185, 129, 0.15);
		color: var(--brand-primary);
	}

	.detail-tab-btn.active .tab-count-badge {
		background: var(--brand-primary);
		color: #ffffff;
	}

	/* Content Area */
	.detail-content-area {
		min-height: 240px;
	}

	/* Info Grid (Tab 1) */
	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
	}

	@media (max-width: 640px) {
		.info-grid {
			grid-template-columns: 1fr;
		}
		.info-tile.col-span-2 {
			grid-column: span 1;
		}
	}

	.info-tile {
		padding: 18px 20px;
		border-radius: var(--radius-lg);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.info-tile.col-span-2 {
		grid-column: span 2;
	}

	.info-tile-label {
		font-size: 11.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-subtle);
	}

	.info-tile-value {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 28px;
	}

	.description-text {
		font-size: 13px;
		color: var(--text-main);
		line-height: 1.6;
		margin: 0;
	}

	/* Tab Panel Stack */
	.tab-panel-stack {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Pricing Tab */
	.pricing-summary-card {
		padding: 18px 20px;
		border-radius: var(--radius-lg);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.card-caption {
		font-size: 11.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-subtle);
	}

	.card-amount {
		font-size: 19px;
		font-weight: 700;
		color: var(--text-main);
		margin-top: 2px;
	}

	.card-hint {
		font-size: 12px;
		color: var(--text-subtle);
		margin-top: 2px;
	}

	.section-subheading {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 6px 0 0;
	}

	/* Recipes Tab */
	.recipes-list-card {
		padding: 20px 24px;
		border-radius: var(--radius-lg);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.recipes-card-title {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.recipes-list {
		font-size: 13px;
		color: var(--text-main);
		line-height: 1.7;
		padding-left: 20px;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Modal Footer Layout */
	.detail-modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.footer-actions-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
