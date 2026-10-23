<script lang="ts">
	import type { Snippet } from 'svelte';
	import Badge from './Badge.svelte';

	interface Props {
		title: string;
		value: string | number;
		subtext?: string;
		badgeText?: string;
		badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'live' | 'neutral';
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
		icon?: Snippet;
		class?: string;
	}

	let {
		title,
		value,
		subtext = '',
		badgeText = '',
		badgeVariant = 'success',
		trend,
		trendValue = '',
		icon,
		class: className = ''
	}: Props = $props();
</script>

<div class="stat-card {className}">
	<div class="card-header">
		<span class="card-title">{title}</span>
		<div class="card-badges">
			{#if badgeText}
				<Badge variant={badgeVariant} text={badgeText} size="sm" />
			{/if}
			{#if icon}
				<div class="card-icon">
					{@render icon()}
				</div>
			{/if}
		</div>
	</div>

	<div class="card-body">
		<div class="card-value">{value}</div>
		{#if subtext || trend}
			<div class="card-sub-row">
				{#if trend && trendValue}
					<span class="trend-indicator trend-{trend}">
						{#if trend === 'up'}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="18 15 12 9 6 15"></polyline>
							</svg>
						{:else if trend === 'down'}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						{/if}
						{trendValue}
					</span>
				{/if}
				{#if subtext}
					<span class="card-subtext">{subtext}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.stat-card {
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg);
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.stat-card:hover {
		border-color: var(--border-panel-hover, var(--border-panel));
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.card-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.card-badges {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card-icon {
		color: var(--text-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.card-value {
		font-size: 24px;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.15;
		font-family: var(--font-body, inherit);
		letter-spacing: -0.025em;
		font-variant-numeric: tabular-nums;
	}

	.card-sub-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
		flex-wrap: wrap;
	}

	.card-subtext {
		color: var(--text-subtle);
	}

	.trend-indicator {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-weight: 700;
		border-radius: var(--radius-sm);
		padding: 1px 4px;
	}

	.trend-up {
		color: var(--pill-success-text);
		background-color: var(--pill-success-bg);
	}

	.trend-down {
		color: var(--pill-danger-text);
		background-color: var(--pill-danger-bg);
	}

	.trend-neutral {
		color: var(--text-muted);
		background-color: var(--bg-panel-sub);
	}
</style>
