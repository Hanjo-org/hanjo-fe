<script lang="ts">
	/**
	 * Detail Drawer / Modal: Informasi Komprehensif Bahan Baku (PG-cat-item-detail)
	 * Mengikuti Golden Rule 2 (Thin Svelte), Golden Rule 10 (Tokens), AC-03.5 & AC-03.6
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
</script>

{#if item}
	<Modal
		{open}
		title={item.name}
		subtitle={`Detail Spesifikasi & Inventaris SKU ${item.code}`}
		maxWidth="780px"
		{onclose}
	>
		<div class="flex flex-col gap-4">
			<!-- Header Identity Card -->
			<div class="p-4 rounded-xl bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex items-start justify-between gap-4">
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center gap-2">
						<span class="item-code-badge">{item.code}</span>
						<StatusBadge status={item.status === 'active' ? 'active' : 'archived'} />
						{#if item.is_producible}
							<span class="pill-badge pill-info">Bahan Olahan</span>
						{/if}
						{#if !item.can_buy_external}
							<span class="pill-badge pill-warning">Hanya Gudang HQ</span>
						{/if}
					</div>
					<span class="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
						<Icon name="tag" size={13} />
						<span>{item.category_name || 'Umum'}</span>
						<span>&bull;</span>
						<span>Satuan Dasar: <strong>{item.base_unit_symbol}</strong></span>
					</span>
				</div>

				<div class="text-right">
					<span class="text-xs text-[var(--text-subtle)] block">Harga Ref. Pusat</span>
					<span class="text-base font-bold text-[var(--text-main)]">
						{formatRupiah(item.hq_ref_price || 0)}
					</span>
				</div>
			</div>

			<!-- Sub Tabs -->
			<div class="flex border-b border-[var(--border-panel)] gap-1 overflow-x-auto">
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-t-md transition border-b-2 {activeTab === 'info' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}"
					onclick={() => (activeTab = 'info')}
				>
					Ringkasan Info
				</button>
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-t-md transition border-b-2 {activeTab === 'stock' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}"
					onclick={() => (activeTab = 'stock')}
				>
					Stok per Gerai
				</button>
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-t-md transition border-b-2 {activeTab === 'pricing' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}"
					onclick={() => (activeTab = 'pricing')}
				>
					Riwayat Harga &amp; HPP
				</button>
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-t-md transition border-b-2 {activeTab === 'min_stock' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}"
					onclick={() => (activeTab = 'min_stock')}
				>
					Batas Minimum Gerai
				</button>
				<button
					type="button"
					class="px-4 py-2.5 text-xs font-semibold rounded-t-md transition border-b-2 {activeTab === 'recipes' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}"
					onclick={() => (activeTab = 'recipes')}
				>
					Dipakai di Resep ({item.recipes_using_count || 0})
				</button>
			</div>

			<!-- TAB 1: RINGKASAN INFO -->
			{#if activeTab === 'info'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 py-1">
					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1">
						<span class="text-[11px] text-[var(--text-subtle)] font-medium">Suhu Penyimpanan</span>
						<span class="text-sm font-semibold text-[var(--text-main)] capitalize">
							{item.storage_temperature === 'chilled' ? 'Dingin / Kulkas (2°C - 4°C)' : item.storage_temperature === 'frozen' ? 'Beku / Freezer (< -18°C)' : 'Suhu Ruang (Ambient)'}
						</span>
					</div>

					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1">
						<span class="text-[11px] text-[var(--text-subtle)] font-medium">Pengadaan Langsung (Beli Luar)</span>
						<span class="text-sm font-semibold {item.can_buy_external ? 'text-emerald-400' : 'text-amber-400'}">
							{item.can_buy_external ? 'Diizinkan (Boleh PO Luar)' : 'Terkunci (Hanya Suplai Gudang Pusat)'}
						</span>
					</div>

					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1">
						<span class="text-[11px] text-[var(--text-subtle)] font-medium">Bahan Olahan Gerai (BOM Batch)</span>
						<span class="text-sm font-semibold text-[var(--text-main)]">
							{item.is_producible ? 'Ya, diproduksi/diracik mandiri di outlet' : 'Tidak (Bahan mentah siap pakai)'}
						</span>
					</div>

					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1">
						<span class="text-[11px] text-[var(--text-subtle)] font-medium">Status Mutasi Stok</span>
						<span class="text-sm font-semibold {item.has_stock_movements ? 'text-amber-400' : 'text-[var(--text-muted)]'}">
							{item.has_stock_movements ? 'Sudah memiliki transaksi (Base Unit dikunci permanen)' : 'Belum ada transaksi (Boleh ubah Base Unit)'}
						</span>
					</div>

					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-1 md:col-span-2">
						<span class="text-[11px] text-[var(--text-subtle)] font-medium">Catatan / Deskripsi</span>
						<p class="text-xs text-[var(--text-main)] leading-relaxed">
							{item.description || 'Tidak ada catatan tambahan untuk bahan ini.'}
						</p>
					</div>
				</div>

			<!-- TAB 2: STOK PER GERAI -->
			{:else if activeTab === 'stock'}
				<div class="flex flex-col gap-3 py-1">
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
										{@const isCritical = currentNum <= minNum}
										<tr>
											<td>
												<strong class="text-[var(--text-main)] capitalize">
													{outletId === 'out-jkt-01' ? 'Jodi Senopati (Jakarta)' : outletId === 'out-bdg-01' ? 'Jodi Dago (Bandung)' : outletId === 'out-sby-01' ? 'Jodi Gubeng (Surabaya)' : outletId === 'out-ubud-01' ? 'Kaveloka Ubud (Bali)' : outletId === 'out-plaga-01' ? 'Plaga Bistro (Bali)' : outletId}
												</strong>
											</td>
											<td>
												<span class="font-mono font-bold {isCritical ? 'text-rose-400' : 'text-emerald-400'}">
													{parseFloat(data.current).toLocaleString('id-ID')} {item.base_unit_symbol}
												</span>
											</td>
											<td>
												{#if isCritical}
													<span class="pill-badge pill-danger">Stok Kritis (&le; {parseFloat(data.min).toLocaleString('id-ID')})</span>
												{:else}
													<span class="pill-badge pill-success">Aman (Batas Min: {parseFloat(data.min).toLocaleString('id-ID')})</span>
												{/if}
											</td>
										</tr>
									{/each}
								{:else}
									<tr>
										<td colspan="3" class="text-center py-6 text-[var(--text-muted)]">
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
				<div class="flex flex-col gap-3 py-1">
					<div class="grid grid-cols-2 gap-3">
						<div class="p-3 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]">
							<span class="text-[11px] text-[var(--text-subtle)] block">Harga Referensi Pusat (HQ)</span>
							<strong class="text-base text-[var(--text-main)]">{formatRupiah(item.hq_ref_price || 0)}</strong>
							<span class="text-[11px] text-[var(--text-subtle)] block mt-0.5">Murni referensi belanja</span>
						</div>
						<div class="p-3 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]">
							<span class="text-[11px] text-[var(--text-subtle)] block">Harga Pembelian Terakhir</span>
							<strong class="text-base text-emerald-400">
								{formatRupiah(costHistory?.last_purchased_price || item.hq_ref_price || 0)} / {item.base_unit_symbol}
							</strong>
							<span class="text-[11px] text-[var(--text-subtle)] block mt-0.5">Faktur pengadaan terbaru</span>
						</div>
					</div>

					<h4 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2">
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
										<td colspan="5" class="text-center py-6 text-[var(--text-muted)]">
											Belum ada riwayat faktur pembelian tercatat.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>

			<!-- TAB 4: BATAS MINIMUM STOK PER OUTLET (AC-03.6) -->
			{:else if activeTab === 'min_stock'}
				<div class="flex flex-col gap-3 py-1">
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
										<th class="w-24 text-right">Aksi</th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#if item.stock_by_outlet && Object.keys(item.stock_by_outlet).length > 0}
									{#each Object.entries(item.stock_by_outlet) as [outletId, data]}
										<tr>
											<td>
												<strong class="text-[var(--text-main)] capitalize">
													{outletId === 'out-jkt-01' ? 'Jodi Senopati' : outletId === 'out-bdg-01' ? 'Jodi Dago' : outletId === 'out-sby-01' ? 'Jodi Gubeng' : outletId === 'out-ubud-01' ? 'Kaveloka Ubud' : outletId}
												</strong>
											</td>
											<td>
												{#if editingMinOutletId === outletId}
													<div class="flex items-center gap-2">
														<input
															type="number"
															class="toolbar-search-input text-xs"
															style="max-width: 120px; min-height: 32px; padding: 4px 10px;"
															bind:value={newMinStockVal}
														/>
														<span class="text-xs text-[var(--text-subtle)]">{item.base_unit_symbol}</span>
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
														<div class="flex items-center justify-end gap-1.5">
															<button
																type="button"
																class="px-2 py-1 text-xs rounded bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition"
																onclick={() => saveMinStock(outletId)}
															>
																Simpan
															</button>
															<button
																type="button"
																class="px-2 py-1 text-xs rounded bg-[var(--bg-panel-sub)] text-[var(--text-muted)] border border-[var(--border-subtle)] transition"
																onclick={cancelEditMinStock}
															>
																Batal
															</button>
														</div>
													{:else}
														<button
															type="button"
															class="px-2.5 py-1 text-xs rounded bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
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
				<div class="flex flex-col gap-3 py-1">
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

					<div class="p-4 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex flex-col gap-2">
						<span class="text-xs font-semibold text-[var(--text-muted)]">Resep Terkait yang Menggunakan Bahan Ini:</span>
						<ul class="text-xs space-y-1.5 text-[var(--text-main)] list-disc pl-5">
							{#if item.id.includes('kop')}
								<li>Caffe Latte 12oz (Hot / Cold) &mdash; takaran: 18g espresso per porsi</li>
								<li>Americano Double Shot &mdash; takaran: 18g espresso per porsi</li>
								<li>Piccolo Latte 8oz &mdash; takaran: 14g espresso per porsi</li>
							{:else if item.id.includes('sus')}
								<li>Caffe Latte 12oz &mdash; takaran: 180ml susu fresh milk</li>
								<li>Matcha Latte 12oz &mdash; takaran: 160ml susu fresh milk</li>
								<li>Cappuccino 8oz &mdash; takaran: 120ml susu fresh milk</li>
							{:else}
								<li>Menu Signature Beverage Musiman &mdash; varian rasa khusus outlet</li>
							{/if}
						</ul>
					</div>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<div class="flex items-center justify-between w-full">
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

				<div class="flex items-center gap-3">
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
