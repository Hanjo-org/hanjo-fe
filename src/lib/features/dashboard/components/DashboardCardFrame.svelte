<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatDate } from '../../../utils/format.js';
	import Skeleton from '../../../components/feedback/Skeleton.svelte';
	import ErrorState from '../../../components/feedback/ErrorState.svelte';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { DashboardCardKey } from '../../../api/contract/types.js';

	interface Props {
		cardKey: DashboardCardKey;
		title: string;
		icon?: string;
		subtitle?: string;
		badgeText?: string;
		badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
		drilldownUrl?: string;
		drilldownLabel?: string;
		colSpan?: string;
		headerAction?: Snippet;
		children: Snippet;
	}

	let {
		cardKey,
		title,
		icon = 'chart-bar',
		subtitle = '',
		badgeText = '',
		badgeVariant = 'info',
		drilldownUrl,
		drilldownLabel = 'Lihat Detail',
		colSpan = 'col-12 col-lg-6',
		headerAction,
		children
	}: Props = $props();

	const cardState = $derived(dashboardStore.getCardState(cardKey));
</script>

<div class="dash-card {colSpan}" id="card-{cardKey}">
	<div class="card-top">
		<div class="card-title-group">
			<div class="card-icon-badge">
				<Icon name={icon} size={18} />
			</div>
			<div class="card-heading">
				<h3 class="card-main-title">
					{title}
					{#if badgeText}
						<Badge variant={badgeVariant} text={badgeText} size="sm" />
					{/if}
				</h3>
				{#if subtitle}
					<p class="card-subtitle-text">{subtitle}</p>
				{/if}
			</div>
		</div>

		<div class="card-actions-group">
			{#if headerAction}
				{@render headerAction()}
			{/if}

			{#if drilldownUrl}
				<a href={drilldownUrl} class="card-drilldown-link">
					<span>{drilldownLabel}</span>
					<span>→</span>
				</a>
			{/if}

			<button
				type="button"
				class="card-reload-btn"
				title="Muat ulang kartu ini"
				aria-label="Muat ulang {title}"
				onclick={() => dashboardStore.loadCard(cardKey, true)}
			>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
					<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
				</svg>
			</button>
		</div>
	</div>

	<div class="card-content-body">
		{#if cardState.isLoading && !cardState.data}
			<div class="py-4">
				<Skeleton variant="row" count={4} />
			</div>
		{:else if cardState.error}
			<ErrorState
				title="Gagal Memuat Kartu"
				message={cardState.error}
				onretry={() => dashboardStore.loadCard(cardKey, true)}
			/>
		{:else if cardState.data}
			{@render children()}
		{:else}
			<div class="py-4">
				<Skeleton variant="row" count={3} />
			</div>
		{/if}
	</div>

	<div class="card-footer-info">
		<span>
			Diperbarui: {cardState.updatedAt ? formatDate(cardState.updatedAt, true) : 'Baru saja'}
		</span>
		<span class="mono text-xs text-subtle">
			#{cardKey}
		</span>
	</div>
</div>
