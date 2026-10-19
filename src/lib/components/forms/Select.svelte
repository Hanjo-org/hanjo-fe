<script lang="ts">
	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: string;
		options?: SelectOption[];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		helperText?: string;
		class?: string;
		onchange?: (val: string) => void;
	}

	let {
		id,
		name,
		label = '',
		value = $bindable(''),
		options = [],
		placeholder = 'Pilih salah satu...',
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `sel-${Math.random().toString(36).substring(2, 9)}`;
	const selectId = $derived(id || defaultId);

	function handleChange(e: Event & { currentTarget: HTMLSelectElement }) {
		value = e.currentTarget.value;
		onchange?.(value);
	}
</script>

<div class="form-control {className}">
	{#if label}
		<label for={selectId} class="form-label">
			{label}
			{#if required}
				<span class="required-star" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<div class="select-container" class:has-error={!!error} class:is-disabled={disabled}>
		<select
			id={selectId}
			{name}
			{value}
			{disabled}
			{required}
			aria-invalid={!!error}
			class="select-field"
			onchange={handleChange}
		>
			{#if placeholder}
				<option value="" disabled selected={!value}>{placeholder}</option>
			{/if}
			{#each options as opt}
				<option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
			{/each}
		</select>

		<div class="select-arrow" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</div>
	</div>

	{#if error}
		<p class="form-feedback error" role="alert">{error}</p>
	{:else if helperText}
		<p class="form-feedback helper">{helperText}</p>
	{/if}
</div>

<style>
	.form-control {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}

	.form-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-main);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.required-star {
		color: var(--pill-danger-text);
		font-weight: 700;
	}

	.select-container {
		position: relative;
		display: flex;
		align-items: center;
		background: var(--bg-input);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-md);
		transition: all 0.15s ease-in-out;
		overflow: hidden;
	}

	.select-container:focus-within {
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
	}

	.select-container.has-error {
		border-color: var(--pill-danger-text);
		background-color: var(--pill-danger-bg);
	}

	.select-container.is-disabled {
		background-color: var(--bg-panel-sub);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.select-field {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 36px 9px 12px;
		font-size: 13.5px;
		color: var(--text-main);
		font-family: var(--font-body);
		width: 100%;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
	}

	.select-field:disabled {
		cursor: not-allowed;
	}

	.select-arrow {
		position: absolute;
		right: 12px;
		pointer-events: none;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-feedback {
		font-size: 11.5px;
		line-height: 1.3;
		margin: 0;
	}

	.form-feedback.error {
		color: var(--pill-danger-text);
		font-weight: 500;
	}

	.form-feedback.helper {
		color: var(--text-muted);
	}
</style>
