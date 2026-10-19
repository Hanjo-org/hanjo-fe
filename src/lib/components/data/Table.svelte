<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface TableColumn<T = any> {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
		sortable?: boolean;
		width?: string;
		render?: (row: T, index: number) => unknown;
	}

	interface Props<T = any> {
		columns: TableColumn<T>[];
		rows: T[];
		loading?: boolean;
		sortKey?: string;
		sortDir?: 'asc' | 'desc';
		page?: number;
		perPage?: number;
		total?: number;
		stickyHeader?: boolean;
		emptyTitle?: string;
		emptySubtitle?: string;
		class?: string;
		onsort?: (key: string, dir: 'asc' | 'desc') => void;
		onpagechange?: (newPage: number) => void;
		rowSnippet?: Snippet<[T, number]>;
		emptyAction?: Snippet;
	}

	let {
		columns,
		rows = [],
		loading = false,
		sortKey = '',
		sortDir = 'asc',
		page = 1,
		perPage = 10,
		total = 0,
		stickyHeader = true,
		emptyTitle = 'Belum ada data',
		emptySubtitle = 'Data belum tersedia atau filter tidak menemukan hasil yang cocok.',
		class: className = '',
		onsort,
		onpagechange,
		rowSnippet,
		emptyAction
	}: Props = $props();

	let totalPages = $derived(Math.max(1, Math.ceil(total / perPage)));
	let startEntry = $derived(total === 0 ? 0 : (page - 1) * perPage + 1);
	let endEntry = $derived(Math.min(total, page * perPage));

	function handleSort(col: TableColumn) {
		if (!col.sortable || !onsort) return;

		let nextDir: 'asc' | 'desc' = 'asc';
		if (sortKey === col.key) {
			nextDir = sortDir === 'asc' ? 'desc' : 'asc';
		}
		onsort(col.key, nextDir);
	}
</script>

<div class="table-card {className}">
	<div class="table-container" class:sticky-header={stickyHeader}>
		<table class="data-table">
			<thead>
				<tr>
					{#each columns as col}
						<th
							style={col.width ? `width: ${col.width};` : ''}
							class="th-align-{col.align || 'left'} {col.sortable ? 'is-sortable' : ''}"
							onclick={() => handleSort(col)}
						>
							<div class="th-content">
								<span>{col.label}</span>
								{#if col.sortable}
									<span class="sort-icon" class:is-active={sortKey === col.key}>
										{#if sortKey === col.key && sortDir === 'desc'}
											<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
												<polyline points="6 9 12 15 18 9"></polyline>
											</svg>
										{:else}
											<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
												<polyline points="18 15 12 9 6 15"></polyline>
											</svg>
										{/if}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#if loading}
					{#each Array(5) as _, i}
						<tr class="skeleton-row">
							{#each columns as _c}
								<td><div class="skeleton-cell"></div></td>
							{/each}
						</tr>
					{/each}
				{:else if rows.length === 0}
					<tr>
						<td colspan={columns.length} class="empty-cell">
							<div class="table-empty-box">
								<svg class="empty-icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="8" y1="12" x2="16" y2="12"></line>
								</svg>
								<p class="empty-title">{emptyTitle}</p>
								<p class="empty-subtitle">{emptySubtitle}</p>
								{#if emptyAction}
									<div class="empty-action-box">
										{@render emptyAction()}
									</div>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					{#each rows as row, index}
						<tr class="data-row">
							{#if rowSnippet}
								{@render rowSnippet(row, index)}
							{:else}
								{#each columns as col}
									<td class="td-align-{col.align || 'left'}">
										{#if col.render}
											{col.render(row, index)}
										{:else}
											{(row as any)[col.key] ?? '—'}
										{/if}
									</td>
								{/each}
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if total > 0 && onpagechange}
		<div class="table-footer">
			<div class="footer-info">
				Menampilkan <span class="highlight">{startEntry}</span>–<span class="highlight">{endEntry}</span> dari <span class="highlight">{total}</span> data
			</div>

			<div class="pagination-controls">
				<button
					type="button"
					class="page-btn"
					disabled={page <= 1}
					onclick={() => onpagechange(page - 1)}
					aria-label="Halaman sebelumnya"
				>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>

				<span class="page-indicator">
					Hal. <span class="highlight">{page}</span> / {totalPages}
				</span>

				<button
					type="button"
					class="page-btn"
					disabled={page >= totalPages}
					onclick={() => onpagechange(page + 1)}
					aria-label="Halaman berikutnya"
				>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.table-card {
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		width: 100%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
	}

	.table-container {
		width: 100%;
		overflow-x: auto;
		max-height: 65vh;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
	}

	thead {
		background: var(--bg-panel-sub);
	}

	.sticky-header thead th {
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 1px 0 var(--border-panel);
	}

	th {
		padding: 11px 16px;
		font-size: 11.5px;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--bg-panel-sub);
		border-bottom: 1px solid var(--border-panel);
		user-select: none;
	}

	th.is-sortable {
		cursor: pointer;
	}

	th.is-sortable:hover {
		color: var(--text-main);
	}

	.th-content {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.th-align-left .th-content { justify-content: flex-start; }
	.th-align-center .th-content { justify-content: center; }
	.th-align-right .th-content { justify-content: flex-end; }

	.td-align-left { text-align: left; }
	.td-align-center { text-align: center; }
	.td-align-right { text-align: right; }

	.sort-icon {
		opacity: 0.35;
		display: flex;
		align-items: center;
	}

	.sort-icon.is-active {
		opacity: 1;
		color: var(--brand-primary);
	}

	td {
		padding: 13px 16px;
		color: var(--text-main);
		border-bottom: 1px solid var(--border-panel);
		font-family: var(--font-body);
	}

	.data-row:hover td {
		background-color: var(--bg-panel-hover);
	}

	.data-row:last-child td {
		border-bottom: none;
	}

	/* Empty State */
	.empty-cell {
		padding: 48px 16px;
		text-align: center;
	}

	.table-empty-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.empty-icon {
		color: var(--text-subtle);
		margin-bottom: 4px;
	}

	.empty-title {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0;
	}

	.empty-subtitle {
		font-size: 12px;
		color: var(--text-muted);
		max-width: 320px;
		margin: 0;
	}

	.empty-action-box {
		margin-top: 12px;
	}

	/* Skeleton loading */
	.skeleton-cell {
		height: 16px;
		background: linear-gradient(90deg, var(--bg-panel-sub) 25%, var(--border-panel) 50%, var(--bg-panel-sub) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Pagination Footer */
	.table-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		border-top: 1px solid var(--border-panel);
		background: var(--bg-panel);
		font-size: 12px;
		color: var(--text-muted);
		flex-wrap: wrap;
		gap: 12px;
	}

	.highlight {
		font-weight: 700;
		color: var(--text-main);
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.page-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-panel);
		background: var(--bg-panel);
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s;
	}

	.page-btn:hover:not(:disabled) {
		background: var(--bg-panel-hover);
		border-color: var(--brand-primary);
		color: var(--brand-primary);
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.page-indicator {
		font-size: 11.5px;
		padding: 0 4px;
	}
</style>
