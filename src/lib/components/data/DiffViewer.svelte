<script lang="ts">
	export interface DiffItem {
		field: string;
		label: string;
		before: string | number | null;
		after: string | number | null;
	}

	interface Props {
		title?: string;
		diffs: DiffItem[];
		beforeLabel?: string;
		afterLabel?: string;
		class?: string;
	}

	let {
		title = '',
		diffs = [],
		beforeLabel = 'Sebelumnya (Asal)',
		afterLabel = 'Perubahan (Baru)',
		class: className = ''
	}: Props = $props();
</script>

<div class="diff-card {className}">
	{#if title}
		<div class="diff-header">
			<h4 class="diff-title">{title}</h4>
		</div>
	{/if}

	<div class="diff-table-container">
		<table class="diff-table">
			<thead>
				<tr>
					<th class="col-field">Bagian / Parameter</th>
					<th class="col-before">{beforeLabel}</th>
					<th class="col-arrow"></th>
					<th class="col-after">{afterLabel}</th>
				</tr>
			</thead>
			<tbody>
				{#each diffs as diff}
					{@const isChanged = diff.before !== diff.after}
					<tr class="diff-row" class:is-changed={isChanged}>
						<td class="cell-label">{diff.label || diff.field}</td>
						<td class="cell-before">
							<span class="diff-val-box before-val">{diff.before ?? '—'}</span>
						</td>
						<td class="cell-arrow">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</td>
						<td class="cell-after">
							<span class="diff-val-box after-val" class:has-diff={isChanged}>
								{diff.after ?? '—'}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.diff-card {
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg);
		overflow: hidden;
		width: 100%;
	}

	.diff-header {
		padding: 12px 16px;
		background: var(--bg-panel-sub);
		border-bottom: 1px solid var(--border-panel);
	}

	.diff-title {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0;
	}

	.diff-table-container {
		width: 100%;
		overflow-x: auto;
	}

	.diff-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12.5px;
	}

	th {
		background: var(--bg-panel-sub);
		padding: 9px 14px;
		font-size: 11px;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-bottom: 1px solid var(--border-panel);
		text-align: left;
	}

	.col-arrow {
		width: 24px;
		padding: 0;
	}

	td {
		padding: 10px 14px;
		border-bottom: 1px solid var(--border-panel);
	}

	.cell-label {
		font-weight: 600;
		color: var(--text-main);
	}

	.cell-arrow {
		color: var(--text-subtle);
		padding: 0;
		text-align: center;
	}

	.diff-val-box {
		display: inline-block;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono, monospace);
		font-size: 12px;
	}

	.before-val {
		background: var(--bg-panel-sub);
		color: var(--text-muted);
	}

	.after-val {
		background: var(--bg-panel-sub);
		color: var(--text-main);
	}

	.after-val.has-diff {
		background: var(--pill-success-bg);
		color: var(--pill-success-text);
		font-weight: 700;
		border: 1px solid var(--pill-success-border);
	}

	.diff-row.is-changed {
		background-color: rgba(5, 150, 105, 0.02);
	}
</style>
