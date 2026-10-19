<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../forms/Button.svelte';

	interface Props {
		searchQuery?: string;
		searchPlaceholder?: string;
		showReset?: boolean;
		class?: string;
		children?: Snippet; // Filter dropdowns & pickers
		actions?: Snippet;  // Export buttons or action CTA
		onsearch?: (q: string) => void;
		onreset?: () => void;
	}

	let {
		searchQuery = $bindable(''),
		searchPlaceholder = 'Cari data...',
		showReset = false,
		class: className = '',
		children,
		actions,
		onsearch,
		onreset
	}: Props = $props();

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchQuery = e.currentTarget.value;
		onsearch?.(searchQuery);
	}
</script>

<div class="filter-bar {className}">
	<div class="filter-left">
		<div class="search-box">
			<svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<input
				type="text"
				value={searchQuery}
				placeholder={searchPlaceholder}
				class="search-input"
				oninput={handleInput}
			/>
		</div>

		{#if children}
			<div class="filter-controls">
				{@render children()}
			</div>
		{/if}

		{#if showReset && onreset}
			<Button variant="ghost" size="sm" onclick={onreset}>
				Reset Filter
			</Button>
		{/if}
	</div>

	{#if actions}
		<div class="filter-right">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.filter-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg);
		padding: 10px 14px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.filter-left {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		flex: 1;
	}

	.search-box {
		display: flex;
		align-items: center;
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-md);
		padding: 0 10px;
		width: 240px;
		transition: all 0.15s;
	}

	.search-box:focus-within {
		background: var(--bg-panel);
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
	}

	.search-icon {
		color: var(--text-subtle);
		margin-right: 6px;
		flex-shrink: 0;
	}

	.search-input {
		border: none;
		outline: none;
		background: transparent;
		padding: 7px 0;
		font-size: 13px;
		color: var(--text-main);
		font-family: var(--font-body);
		width: 100%;
	}

	.filter-controls {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.filter-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
