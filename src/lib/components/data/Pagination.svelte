<script lang="ts">
	/**
	 * Hanjo Enterprise Data Pagination Component
	 * Mendukung dua mode render:
	 * 1. Client-Side Reactive (SPA): stateful, callback onpagechange / onperpagechange, button triggers.
	 * 2. Server-Side Render (SSR): Menghasilkan semantic anchor link <a> via hrefBuilder untuk URL query (?page=2&per_page=10).
	 *
	 * Memenuhi Golden Rule 10 (Light/Dark Tokens), Invarian §2.7 (Generous Padding), dan WCAG AA.
	 */
	import Icon from './Icon.svelte';

	interface Props {
		/** Halaman aktif saat ini (1-indexed) */
		page?: number;
		/** Jumlah data per halaman */
		perPage?: number;
		/** Total seluruh item data */
		total: number;
		/** Opsi pilihan jumlah data per halaman */
		perPageOptions?: number[];
		/** Tampilkan pemilih per-page (default: true) */
		showPerPage?: boolean;
		/** Tampilkan ringkasan data info "Menampilkan X-Y dari Z" (default: true) */
		showInfo?: boolean;
		/** Tampilkan tombol lompat ke awal / akhir (default: false) */
		showFirstLast?: boolean;
		/** Status loading (disable interaksi sementara) */
		loading?: boolean;
		/**
		 * SSR Mode URL Builder:
		 * Jika disediakan, pagination akan merender tag <a> dengan URL yang valid untuk SSR / web crawler.
		 * Contoh: (p, pp) => `?page=${p}&per_page=${pp}`
		 */
		hrefBuilder?: (page: number, perPage: number) => string;
		/** Callback saat halaman berubah */
		onpagechange?: (newPage: number) => void;
		/** Callback saat ukuran per halaman berubah */
		onperpagechange?: (newPerPage: number) => void;
		/** Class CSS tambahan */
		class?: string;
	}

	let {
		page = $bindable(1),
		perPage = $bindable(10),
		total = 0,
		perPageOptions = [10, 25, 50, 100],
		showPerPage = true,
		showInfo = true,
		showFirstLast = false,
		loading = false,
		hrefBuilder,
		onpagechange,
		onperpagechange,
		class: className = ''
	}: Props = $props();

	// Perhitungan Halaman & Rentang Data
	const totalPages = $derived(Math.max(1, Math.ceil(total / perPage)));
	const safeCurrentPage = $derived(Math.min(Math.max(1, page), totalPages));
	const startItem = $derived(total === 0 ? 0 : (safeCurrentPage - 1) * perPage + 1);
	const endItem = $derived(Math.min(total, safeCurrentPage * perPage));

	// Windowing Halaman dengan Ellipsis
	const visiblePages = $derived.by((): (number | 'ellipsis')[] => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		if (safeCurrentPage <= 4) {
			return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
		}
		if (safeCurrentPage >= totalPages - 3) {
			return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
		}
		return [1, 'ellipsis', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis', totalPages];
	});

	function handlePageClick(targetPage: number, e?: MouseEvent) {
		if (loading || targetPage === safeCurrentPage || targetPage < 1 || targetPage > totalPages) {
			e?.preventDefault();
			return;
		}

		if (onpagechange) {
			// Jika ada callback client-side, cegah reload browser penuh
			if (hrefBuilder) e?.preventDefault();
			page = targetPage;
			onpagechange(targetPage);
		} else if (!hrefBuilder) {
			page = targetPage;
		}
	}

	function handlePerPageChange(e: Event & { currentTarget: HTMLSelectElement }) {
		const newSize = Number(e.currentTarget.value);
		if (newSize === perPage) return;

		perPage = newSize;
		page = 1;
		onperpagechange?.(newSize);
		onpagechange?.(1);

		if (hrefBuilder && !onpagechange && typeof window !== 'undefined') {
			window.location.href = hrefBuilder(1, newSize);
		}
	}
</script>

{#if total > 0}
	<nav class="hanjo-pagination {className}" aria-label="Navigasi Halaman Tabel">
		<!-- 1. Keterangan Data Info (Kiri) -->
		{#if showInfo}
			<div class="pagination-info">
				<span>Menampilkan</span>
				<strong class="highlight-val">{startItem}</strong>
				<span>–</span>
				<strong class="highlight-val">{endItem}</strong>
				<span>dari</span>
				<strong class="highlight-val">{total}</strong>
				<span>data</span>
			</div>
		{/if}

		<!-- 2. Kontrol Navigasi Halaman (Tengah / Kanan) -->
		<div class="pagination-controls">
			<!-- Pilihan Per-Halaman (Opsional) -->
			{#if showPerPage && perPageOptions.length > 1}
				<div class="per-page-selector">
					<label for="select-per-page" class="per-page-label">Baris:</label>
					<select
						id="select-per-page"
						class="per-page-select"
						value={perPage}
						disabled={loading}
						onchange={handlePerPageChange}
						aria-label="Jumlah baris per halaman"
					>
						{#each perPageOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Tombol Lompat Awal -->
			{#if showFirstLast}
				{#if hrefBuilder}
					<a
						href={safeCurrentPage > 1 ? hrefBuilder(1, perPage) : undefined}
						class="page-btn nav-btn"
						class:disabled={safeCurrentPage <= 1 || loading}
						onclick={(e) => handlePageClick(1, e)}
						title="Halaman Pertama"
						aria-label="Ke halaman pertama"
					>
						<Icon name="chevron-double-left" size={15} />
					</a>
				{:else}
					<button
						type="button"
						class="page-btn nav-btn"
						disabled={safeCurrentPage <= 1 || loading}
						onclick={(e) => handlePageClick(1, e)}
						title="Halaman Pertama"
						aria-label="Ke halaman pertama"
					>
						<Icon name="chevron-double-left" size={15} />
					</button>
				{/if}
			{/if}

			<!-- Tombol Sebelumnya (Prev) -->
			{#if hrefBuilder}
				<a
					href={safeCurrentPage > 1 ? hrefBuilder(safeCurrentPage - 1, perPage) : undefined}
					class="page-btn nav-btn"
					class:disabled={safeCurrentPage <= 1 || loading}
					onclick={(e) => handlePageClick(safeCurrentPage - 1, e)}
					title="Halaman Sebelumnya"
					aria-label="Halaman sebelumnya"
				>
					<Icon name="chevron-left" size={15} />
					<span class="hidden md:inline text-xs">Prev</span>
				</a>
			{:else}
				<button
					type="button"
					class="page-btn nav-btn"
					disabled={safeCurrentPage <= 1 || loading}
					onclick={(e) => handlePageClick(safeCurrentPage - 1, e)}
					title="Halaman Sebelumnya"
					aria-label="Halaman sebelumnya"
				>
					<Icon name="chevron-left" size={15} />
					<span class="hidden md:inline text-xs">Prev</span>
				</button>
			{/if}

			<!-- Daftar Angka Halaman (Desktop) -->
			<div class="page-numbers-group">
				{#each visiblePages as p, idx (p === 'ellipsis' ? `el-${idx}` : `p-${p}`)}
					{#if p === 'ellipsis'}
						<span class="page-ellipsis" aria-hidden="true">&hellip;</span>
					{:else}
						{@const isCurrent = p === safeCurrentPage}
						{#if hrefBuilder}
							<a
								href={hrefBuilder(p, perPage)}
								class="page-btn number-btn"
								class:active={isCurrent}
								class:disabled={loading}
								aria-current={isCurrent ? 'page' : undefined}
								onclick={(e) => handlePageClick(p, e)}
							>
								{p}
							</a>
						{:else}
							<button
								type="button"
								class="page-btn number-btn"
								class:active={isCurrent}
								disabled={loading}
								aria-current={isCurrent ? 'page' : undefined}
								onclick={(e) => handlePageClick(p, e)}
							>
								{p}
							</button>
						{/if}
					{/if}
				{/each}
			</div>

			<!-- Indikator Halaman Ringkas (Mobile) -->
			<span class="mobile-page-indicator">
				Hal. <strong>{safeCurrentPage}</strong> / {totalPages}
			</span>

			<!-- Tombol Berikutnya (Next) -->
			{#if hrefBuilder}
				<a
					href={safeCurrentPage < totalPages ? hrefBuilder(safeCurrentPage + 1, perPage) : undefined}
					class="page-btn nav-btn"
					class:disabled={safeCurrentPage >= totalPages || loading}
					onclick={(e) => handlePageClick(safeCurrentPage + 1, e)}
					title="Halaman Berikutnya"
					aria-label="Halaman berikutnya"
				>
					<span class="hidden md:inline text-xs">Next</span>
					<Icon name="chevron-right" size={15} />
				</a>
			{:else}
				<button
					type="button"
					class="page-btn nav-btn"
					disabled={safeCurrentPage >= totalPages || loading}
					onclick={(e) => handlePageClick(safeCurrentPage + 1, e)}
					title="Halaman Berikutnya"
					aria-label="Halaman berikutnya"
				>
					<span class="hidden md:inline text-xs">Next</span>
					<Icon name="chevron-right" size={15} />
				</button>
			{/if}

			<!-- Tombol Lompat Akhir -->
			{#if showFirstLast}
				{#if hrefBuilder}
					<a
						href={safeCurrentPage < totalPages ? hrefBuilder(totalPages, perPage) : undefined}
						class="page-btn nav-btn"
						class:disabled={safeCurrentPage >= totalPages || loading}
						onclick={(e) => handlePageClick(totalPages, e)}
						title="Halaman Terakhir"
						aria-label="Ke halaman terakhir"
					>
						<Icon name="chevron-double-right" size={15} />
					</a>
				{:else}
					<button
						type="button"
						class="page-btn nav-btn"
						disabled={safeCurrentPage >= totalPages || loading}
						onclick={(e) => handlePageClick(totalPages, e)}
						title="Halaman Terakhir"
						aria-label="Ke halaman terakhir"
					>
						<Icon name="chevron-double-right" size={15} />
					</button>
				{/if}
			{/if}
		</div>
	</nav>
{/if}

<style>
	.hanjo-pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 14px 18px;
		background: var(--bg-panel, #1e293b);
		border: 1px solid var(--border-panel, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-lg, 12px);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
		font-size: 13px;
		color: var(--text-muted, #94a3b8);
	}

	@media (min-width: 768px) {
		.hanjo-pagination {
			flex-direction: row;
		}
	}

	/* Data Information */
	.pagination-info {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 13px;
		color: var(--text-muted, #94a3b8);
		white-space: nowrap;
	}

	.highlight-val {
		color: var(--text-main, #f8fafc);
		font-weight: 700;
	}

	/* Controls Container */
	.pagination-controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	/* Per Page Dropdown */
	.per-page-selector {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-right: 6px;
	}

	.per-page-label {
		font-size: 12px;
		color: var(--text-muted, #94a3b8);
	}

	.per-page-select {
		min-height: 34px;
		padding: 4px 10px;
		background: var(--bg-panel-sub, #0f172a);
		border: 1px solid var(--border-panel, rgba(255, 255, 255, 0.1));
		border-radius: 6px;
		color: var(--text-main, #f8fafc);
		font-size: 12.5px;
		font-weight: 600;
		outline: none;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.per-page-select:focus {
		border-color: var(--brand-primary, #10b981);
	}

	/* Buttons Base */
	.page-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 36px;
		padding: 6px 12px;
		border-radius: 8px;
		background: var(--bg-panel-sub, #0f172a);
		border: 1px solid var(--border-panel, rgba(255, 255, 255, 0.08));
		color: var(--text-main, #f8fafc);
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
		transition: all 0.15s ease-in-out;
		white-space: nowrap;
	}

	.page-btn:hover:not(:disabled):not(.disabled):not(.active) {
		background: var(--bg-panel-hover, rgba(255, 255, 255, 0.06));
		border-color: var(--border-focus, #10b981);
		color: var(--text-main, #f8fafc);
	}

	.page-btn:disabled,
	.page-btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Number Buttons */
	.number-btn {
		min-width: 36px;
		padding: 6px 10px;
		font-family: var(--font-mono, monospace);
		font-size: 13px;
	}

	.number-btn.active {
		background: var(--brand-primary, #10b981);
		border-color: var(--brand-primary, #10b981);
		color: #ffffff;
		box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
		font-weight: 700;
	}

	.page-numbers-group {
		display: none;
		align-items: center;
		gap: 6px;
	}

	@media (min-width: 640px) {
		.page-numbers-group {
			display: flex;
		}
	}

	.page-ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		color: var(--text-subtle, #64748b);
		font-weight: 700;
		user-select: none;
	}

	/* Mobile Indicator */
	.mobile-page-indicator {
		display: inline-flex;
		align-items: center;
		font-size: 12.5px;
		color: var(--text-muted, #94a3b8);
		padding: 0 4px;
	}

	.mobile-page-indicator strong {
		color: var(--text-main, #f8fafc);
		margin: 0 2px;
	}

	@media (min-width: 640px) {
		.mobile-page-indicator {
			display: none;
		}
	}
</style>
