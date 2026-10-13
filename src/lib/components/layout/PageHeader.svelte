<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		title: string;
		subtitle?: string;
		badgeText?: string;
		badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'live' | 'neutral';
		breadcrumbs?: BreadcrumbItem[];
		actions?: Snippet;
		children?: Snippet;
	}

	let {
		title,
		subtitle = '',
		badgeText = '',
		badgeVariant = 'neutral',
		breadcrumbs = [],
		actions,
		children
	}: Props = $props();
</script>

<div class="page-header">
	<div class="header-main">
		{#if breadcrumbs.length > 0}
			<nav class="breadcrumbs" aria-label="Breadcrumb">
				{#each breadcrumbs as crumb, i}
					{#if i > 0}
						<span class="crumb-separator">/</span>
					{/if}
					{#if crumb.href}
						<a href={crumb.href} class="crumb-link">{crumb.label}</a>
					{:else}
						<span class="crumb-current">{crumb.label}</span>
					{/if}
				{/each}
			</nav>
		{/if}

		<div class="title-row">
			<h1 class="page-title">{title}</h1>
			{#if badgeText}
				<span class="pill-badge pill-{badgeVariant} header-badge">{badgeText}</span>
			{/if}
		</div>

		{#if subtitle}
			<p class="page-subtitle">{subtitle}</p>
		{/if}
	</div>

	{#if actions}
		<div class="header-actions">
			{@render actions()}
		</div>
	{/if}
</div>

{#if children}
	<div class="header-extra">
		{@render children()}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.header-main {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
		color: var(--text-subtle);
		margin-bottom: 2px;
	}

	.crumb-link {
		color: var(--text-muted);
		transition: color 0.15s;
	}

	.crumb-link:hover {
		color: var(--brand-primary);
	}

	.crumb-separator {
		opacity: 0.5;
	}

	.crumb-current {
		color: var(--text-main);
		font-weight: 600;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 24px;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.header-badge {
		font-size: 11px;
		padding: 2px 8px;
	}

	.page-subtitle {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.header-extra {
		margin-bottom: 20px;
	}
</style>
