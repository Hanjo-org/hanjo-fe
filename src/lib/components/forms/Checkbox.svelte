<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		description?: string;
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
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
		required = false,
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `chk-${Math.random().toString(36).substring(2, 9)}`;
	const checkId = $derived(id || defaultId);

	function handleChange(e: Event & { currentTarget: HTMLInputElement }) {
		checked = e.currentTarget.checked;
		onchange?.(checked);
	}
</script>

<label class="checkbox-wrapper {className}" for={checkId}>
	<div class="checkbox-box-container">
		<input
			id={checkId}
			{name}
			type="checkbox"
			bind:checked
			{disabled}
			{required}
			class="hidden-input"
			onchange={handleChange}
		/>
		<div class="custom-checkbox" class:is-checked={checked} class:is-disabled={disabled}>
			{#if checked}
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			{/if}
		</div>
	</div>

	{#if label || description}
		<div class="checkbox-labels">
			{#if label}
				<span class="checkbox-title" class:is-disabled={disabled}>{label}</span>
			{/if}
			{#if description}
				<span class="checkbox-desc">{description}</span>
			{/if}
		</div>
	{/if}
</label>

<style>
	.checkbox-wrapper {
		display: inline-flex;
		align-items: flex-start;
		gap: 10px;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-box-container {
		position: relative;
		display: flex;
		align-items: center;
		margin-top: 2px;
	}

	.hidden-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		margin: 0;
	}

	.custom-checkbox {
		width: 18px;
		height: 18px;
		background: var(--bg-input);
		border: 1.5px solid var(--border-panel);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		transition: all 0.15s ease-in-out;
	}

	.hidden-input:focus-visible + .custom-checkbox {
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
		border-color: var(--brand-primary);
	}

	.custom-checkbox.is-checked {
		background-color: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.custom-checkbox.is-disabled {
		opacity: 0.55;
		cursor: not-allowed;
		background: var(--bg-panel-sub);
	}

	.checkbox-labels {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.checkbox-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-main);
	}

	.checkbox-title.is-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.checkbox-desc {
		font-size: 11.5px;
		color: var(--text-muted);
		line-height: 1.35;
	}
</style>
