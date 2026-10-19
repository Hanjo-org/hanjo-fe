<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		description?: string;
		checked?: boolean;
		disabled?: boolean;
		class?: string;
		onchange?: (checked: boolean) => void;
	}

	let {
		id,
		name,
		label = '',
		description = '',
		checked = $bindable(false),
		disabled = false,
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `sw-${Math.random().toString(36).substring(2, 9)}`;
	const switchId = $derived(id || defaultId);

	function toggle() {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<div class="switch-wrapper {className}">
	<button
		id={switchId}
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label || 'Pilihan sakelar'}
		{disabled}
		class="switch-track"
		class:is-active={checked}
		class:is-disabled={disabled}
		onclick={toggle}
		onkeydown={handleKeydown}
	>
		<span class="switch-thumb" class:is-active={checked}></span>
	</button>

	{#if label || description}
		<div class="switch-labels" onclick={toggle} role="presentation">
			{#if label}
				<span class="switch-title" class:is-disabled={disabled}>{label}</span>
			{/if}
			{#if description}
				<span class="switch-desc">{description}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.switch-wrapper {
		display: inline-flex;
		align-items: flex-start;
		gap: 12px;
		user-select: none;
	}

	.switch-track {
		position: relative;
		width: 44px;
		height: 24px;
		background-color: var(--border-panel);
		border-radius: var(--radius-full);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease, box-shadow 0.2s ease;
		padding: 2px;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.switch-track:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
	}

	.switch-track.is-active {
		background-color: var(--brand-primary);
	}

	.switch-track.is-disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.switch-thumb {
		width: 20px;
		height: 20px;
		background-color: #ffffff;
		border-radius: var(--radius-full);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateX(0);
	}

	.switch-thumb.is-active {
		transform: translateX(20px);
	}

	.switch-labels {
		display: flex;
		flex-direction: column;
		gap: 2px;
		cursor: pointer;
	}

	.switch-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-main);
	}

	.switch-title.is-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.switch-desc {
		font-size: 11.5px;
		color: var(--text-muted);
		line-height: 1.35;
	}
</style>
