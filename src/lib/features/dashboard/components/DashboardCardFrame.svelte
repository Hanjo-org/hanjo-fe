<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Skeleton from '../../../components/feedback/Skeleton.svelte';
	import ErrorState from '../../../components/feedback/ErrorState.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { DashboardCardKey } from '../../../api/contract/types.js';

	interface Props {
		cardKey?: DashboardCardKey;
		customContent?: boolean;
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
		cardKey = 'sales_summary',
		customContent = false,
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

	let isMenuOpen = $state(false);
	let isReloading = $state(false);
	let copyToast = $state(false);
	let menuWrapperEl = $state<HTMLDivElement | null>(null);

	function toggleMenu(e: MouseEvent) {
		e.stopPropagation();
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function handleReload() {
		isReloading = true;
		dashboardStore.loadCard(cardKey, true);
		setTimeout(() => {
			isReloading = false;
			isMenuOpen = false;
		}, 500);
	}

	function handleCopySummary() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			const text = `${title} — Hanjo ERP`;
			navigator.clipboard.writeText(text);
			copyToast = true;
			setTimeout(() => {
				copyToast = false;
				isMenuOpen = false;
			}, 1200);
		}
	}

	$effect(() => {
		if (isMenuOpen) {
			const onDocClick = (e: MouseEvent) => {
				if (menuWrapperEl && !menuWrapperEl.contains(e.target as Node)) {
					isMenuOpen = false;
				}
			};
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') isMenuOpen = false;
			};
			window.addEventListener('click', onDocClick);
			window.addEventListener('keydown', onKeyDown);
			return () => {
				window.removeEventListener('click', onDocClick);
				window.removeEventListener('keydown', onKeyDown);
			};
		}
	});
</script>

{#if dashboardStore.canShowCard(cardKey)}
	<div class="dash-card {colSpan}" id="card-{cardKey}">
		<div class="card-top">
		<div class="card-title-group">
			<div class="card-icon-badge">
				<Icon name={icon} size={18} />
			</div>
			<div class="card-heading">
				<h3 class="card-main-title">{title}</h3>
			</div>
		</div>

		<div class="card-actions-group">
			{#if headerAction}
				{@render headerAction()}
			{/if}

			<!-- Menu Aksi 3 Titik (Dropdown) -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="card-menu-wrapper" bind:this={menuWrapperEl}>
				<button
					type="button"
					class="card-menu-btn"
					class:is-active={isMenuOpen}
					title="Opsi aksi kartu {title}"
					aria-label="Opsi aksi kartu {title}"
					aria-haspopup="true"
					aria-expanded={isMenuOpen}
					onclick={toggleMenu}
				>
					<Icon name="ellipsis-vertical" size={17} />
				</button>

				{#if isMenuOpen}
					<div
						class="card-dropdown-menu animate-fadeIn"
						role="menu"
						tabindex="-1"
						onclick={(e) => e.stopPropagation()}
					>
						{#if drilldownUrl}
							<a
								href={drilldownUrl}
								class="card-dropdown-item primary-action"
								role="menuitem"
								onclick={closeMenu}
							>
								<div class="flex items-center gap-2">
									<Icon name="document-text" size={14} class="text-primary" />
									<span class="font-semibold">{drilldownLabel}</span>
								</div>
							</a>
						{/if}

						<button
							type="button"
							class="card-dropdown-item"
							role="menuitem"
							onclick={handleReload}
						>
							<div class="flex items-center gap-2">
								<Icon
									name="arrow-path"
									size={14}
									class={isReloading ? 'animate-spin text-primary' : 'text-muted'}
								/>
								<span>{isReloading ? 'Memuat Ulang...' : 'Segarkan Data'}</span>
							</div>
						</button>

						<button
							type="button"
							class="card-dropdown-item"
							role="menuitem"
							onclick={handleCopySummary}
						>
							<div class="flex items-center gap-2">
								<Icon
									name="clipboard-document-check"
									size={14}
									class={copyToast ? 'text-success' : 'text-muted'}
								/>
								<span>{copyToast ? 'Tersalin!' : 'Salin Info Kartu'}</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="card-content-body">
		{#if customContent}
			{@render children()}
		{:else if cardState.isLoading && !cardState.data}
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
			{@render children()}
		{/if}
	</div>
</div>
{/if}

<style>
	.card-menu-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.card-menu-btn {
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.card-menu-btn:hover {
		color: var(--text-main);
		background: var(--bg-panel-hover);
		border-color: var(--border-panel);
	}

	.card-menu-btn.is-active {
		color: var(--text-main);
		background: var(--bg-panel-active);
		border-color: var(--border-panel);
	}

	.card-dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		z-index: 50;
		min-width: 180px;
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: 10px;
		padding: 4px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	:global([data-theme='light']) .card-dropdown-menu {
		background: #ffffff;
		border-color: #e2e8f0;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	.card-dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 7px 10px;
		font-size: 12px;
		color: var(--text-main);
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.12s ease;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
	}

	.card-dropdown-item:hover {
		background: var(--bg-panel-hover);
		color: var(--text-main);
	}

	:global([data-theme='light']) .card-dropdown-item:hover {
		background: #f1f5f9;
	}

	.card-dropdown-item.primary-action {
		color: var(--brand-primary);
	}

	.card-dropdown-item.primary-action:hover {
		background: rgba(16, 185, 129, 0.1);
	}
</style>
