<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		onclick,
		children,
		class: className = ''
	}: Props = $props();
</script>

<button
	{type}
	class="btn btn-{variant} size-{size} {className}"
	disabled={disabled || loading}
	{onclick}
>
	{#if loading}
		<span class="btn-spinner"></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: var(--font-body);
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.18s ease;
		border: 1px solid transparent;
		user-select: none;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		transform: none !important;
	}

	.size-sm {
		font-size: 11.5px;
		padding: 5px 10px;
	}

	.size-md {
		font-size: 13px;
		padding: 8px 14px;
	}

	.size-lg {
		font-size: 14px;
		padding: 10px 18px;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
		color: #ffffff;
		box-shadow: 0 1px 4px var(--brand-primary-glow);
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary));
		transform: translateY(-1px);
		box-shadow: 0 4px 12px var(--brand-primary-glow);
	}

	.btn-secondary {
		background: var(--bg-panel);
		color: var(--text-main);
		border-color: var(--border-panel);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--bg-panel-hover);
		border-color: var(--brand-primary);
	}

	.btn-danger {
		background: var(--pill-danger-bg);
		color: var(--pill-danger-text);
		border-color: var(--pill-danger-border);
	}

	.btn-danger:hover:not(:disabled) {
		filter: brightness(0.95);
	}

	.btn-outline {
		background: transparent;
		color: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.btn-outline:hover:not(:disabled) {
		background: var(--brand-primary-dim);
	}

	.btn-ghost {
		background: transparent;
		color: var(--text-muted);
		border-color: transparent;
	}

	.btn-ghost:hover:not(:disabled) {
		background: var(--bg-panel-sub);
		color: var(--text-main);
	}

	.btn-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
