<script lang="ts">
	/**
	 * ActionMenu.svelte
	 * Komponen menu dropdown aksi titik tiga (three-dots / ellipsis)
	 * Mengimplementasikan Progressive Disclosure (AGENTS.md §2.6)
	 */
	import Icon from '../data/Icon.svelte';

	export interface ActionMenuItem {
		label: string;
		icon?: string;
		onclick: () => void;
		variant?: 'default' | 'danger' | 'success' | 'warning';
		disabled?: boolean;
		divider?: boolean;
	}

	interface Props {
		items: ActionMenuItem[];
		align?: 'right' | 'left';
		size?: 'sm' | 'md';
		ariaLabel?: string;
		class?: string;
	}

	let {
		items = [],
		align = 'right',
		size = 'sm',
		ariaLabel = 'Menu opsi tindakan',
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);
	let menuRef = $state<HTMLDivElement | null>(null);

	function toggleMenu(e: MouseEvent) {
		e.stopPropagation();
		isOpen = !isOpen;
	}

	function handleItemClick(item: ActionMenuItem, e: MouseEvent) {
		e.stopPropagation();
		if (item.disabled) return;
		isOpen = false;
		item.onclick();
	}

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && menuRef && !menuRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="action-menu-wrapper {className}" class:is-open={isOpen} bind:this={menuRef}>
	<button
		type="button"
		class="action-menu-trigger size-{size}"
		class:is-active={isOpen}
		onclick={toggleMenu}
		aria-label={ariaLabel}
		aria-haspopup="menu"
		aria-expanded={isOpen}
	>
		<Icon name="ellipsis-vertical" size={size === 'sm' ? 15 : 18} />
	</button>

	{#if isOpen}
		<div
			class="action-menu-dropdown align-{align}"
			role="menu"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') isOpen = false;
			}}
		>
			{#each items as item, idx}
				{#if item.divider}
					<div class="menu-divider" role="separator"></div>
				{/if}

				<button
					type="button"
					class="menu-item variant-{item.variant || 'default'}"
					disabled={item.disabled}
					role="menuitem"
					onclick={(e) => handleItemClick(item, e)}
				>
					{#if item.icon}
						<span class="menu-item-icon" aria-hidden="true">
							<Icon name={item.icon} size={14} />
						</span>
					{/if}
					<span class="menu-item-label">{item.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.action-menu-wrapper {
		position: relative;
		display: inline-flex;
	}

	.action-menu-wrapper.is-open {
		z-index: 70;
	}

	.action-menu-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-panel-sub, #161c28);
		color: var(--text-muted, #94a3b8);
		border: 1px solid var(--border-panel, #e2e8f0);
		border-radius: var(--radius-md, 8px);
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
	}

	.action-menu-trigger.size-sm {
		width: 28px;
		height: 28px;
	}

	.action-menu-trigger.size-md {
		width: 36px;
		height: 36px;
	}

	.action-menu-trigger:hover,
	.action-menu-trigger.is-active {
		background: var(--bg-panel-hover, #f8fafc);
		color: var(--text-main, #0f172a);
		border-color: var(--brand-primary, #10b981);
	}

	.action-menu-trigger.is-active {
		box-shadow: 0 0 0 2px var(--brand-primary-dim, rgba(16, 185, 129, 0.15));
		color: var(--brand-primary, #10b981);
	}

	.action-menu-dropdown {
		position: absolute;
		top: calc(100% + 5px);
		z-index: 60;
		min-width: 175px;
		background: var(--bg-panel, #111620);
		border: 1px solid var(--border-panel, #1d2535);
		border-radius: var(--radius-md, 10px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
		padding: 5px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: menuDropdownFadeIn 0.12s ease-out;
	}

	@keyframes menuDropdownFadeIn {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.action-menu-dropdown.align-right {
		right: 0;
	}

	.action-menu-dropdown.align-left {
		left: 0;
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 10px;
		border-radius: 6px;
		border: none;
		background: transparent;
		font-size: 12.5px;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: background 0.12s, color 0.12s;
		user-select: none;
		color: var(--text-main, #0f172a);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.menu-item-label {
		flex: 1;
		white-space: nowrap;
	}

	/* Variant styling */
	.menu-item.variant-default:hover:not(:disabled) {
		background: var(--bg-panel-hover, #f1f5f9);
		color: var(--text-main, #0f172a);
	}

	.menu-item.variant-danger {
		color: var(--pill-danger-text, #ef4444);
	}

	.menu-item.variant-danger:hover:not(:disabled) {
		background: var(--pill-danger-bg, rgba(239, 68, 68, 0.12));
		color: var(--pill-danger-text, #ef4444);
	}

	.menu-item.variant-success {
		color: var(--brand-primary, #10b981);
	}

	.menu-item.variant-success:hover:not(:disabled) {
		background: var(--brand-primary-dim, rgba(16, 185, 129, 0.12));
		color: var(--brand-primary, #10b981);
	}

	.menu-divider {
		height: 1px;
		margin: 3px 0;
		background: var(--border-subtle, rgba(255, 255, 255, 0.08));
	}
</style>
