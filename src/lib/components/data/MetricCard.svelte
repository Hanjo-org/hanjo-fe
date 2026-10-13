<script lang="ts">
	import type { Snippet } from 'svelte';
	import Badge from '../ui/Badge.svelte';

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

<div class="panel-card metric-card {className}">
	<div class="metric-top">
		<span class="metric-title">{title}</span>
		<div class="metric-top-right">
			{#if badgeText}
				<Badge variant={badgeVariant} text={badgeText} size="sm" />
			{/if}
			{#if icon}
				<div class="metric-icon-box">
					{@render icon()}
				</div>
			{/if}
		</div>
	</div>

	<div class="metric-body">
		<h2 class="metric-value">{value}</h2>
		{#if subtext || trendValue}
			<div class="metric-footer">
				{#if trendValue}
					<span class="metric-trend trend-{trend || 'neutral'}">
						{#if trend === 'up'}↑{:else if trend === 'down'}↓{/if}
						{trendValue}
					</span>
				{/if}
				{#if subtext}
					<span class="metric-subtext">{subtext}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.metric-card {
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 12px;
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
	}

	.metric-card:hover {
		border-color: var(--brand-primary);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
	}

	.metric-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.metric-title {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}

	.metric-top-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.metric-icon-box {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		background: var(--brand-primary-dim);
		color: var(--brand-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.metric-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.metric-value {
		font-size: 26px;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.1;
		font-family: var(--font-heading);
	}

	.metric-footer {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11.5px;
	}

	.metric-trend {
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.trend-up {
		color: #10b981;
	}

	.trend-down {
		color: #ef4444;
	}

	.trend-neutral {
		color: var(--text-subtle);
	}

	.metric-subtext {
		color: var(--text-subtle);
	}
</style>
