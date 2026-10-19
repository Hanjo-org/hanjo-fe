<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: number | string;
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		helperText?: string;
		class?: string;
		onchange?: (val: number) => void;
	}

	let {
		id,
		name,
		label = '',
		value = $bindable(0),
		min = 0,
		max,
		step = 1,
		unit = '',
		placeholder = '0',
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `num-${Math.random().toString(36).substring(2, 9)}`;
	const inputId = $derived(id || defaultId);

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = e.currentTarget.value;
		const num = parseFloat(raw);
		const parsed = isNaN(num) ? 0 : num;
		value = parsed;
		onchange?.(parsed);
	}

	function increment() {
		if (disabled) return;
		const current = typeof value === 'string' ? parseFloat(value) || 0 : value;
		const next = current + step;
		if (max !== undefined && next > max) return;
		value = parseFloat(next.toFixed(4));
		onchange?.(value);
	}

	function decrement() {
		if (disabled) return;
		const current = typeof value === 'string' ? parseFloat(value) || 0 : value;
		const next = current - step;
		if (min !== undefined && next < min) return;
		value = parseFloat(next.toFixed(4));
		onchange?.(value);
	}
</script>

<div class="form-control {className}">
	{#if label}
		<label for={inputId} class="form-label">
			{label}
			{#if required}
				<span class="required-star" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<div class="input-container" class:has-error={!!error} class:is-disabled={disabled}>
		<button
			type="button"
			class="step-btn dec"
			onclick={decrement}
			{disabled}
			aria-label="Kurangi nilai"
			tabindex="-1"
		>
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</button>

		<input
			id={inputId}
			{name}
			type="number"
			value={value}
			{min}
			{max}
			{step}
			{placeholder}
			{disabled}
			{required}
			aria-invalid={!!error}
			class="number-field"
			oninput={handleInput}
		/>

		{#if unit}
			<span class="unit-badge">{unit}</span>
		{/if}

		<button
			type="button"
			class="step-btn inc"
			onclick={increment}
			{disabled}
			aria-label="Tambah nilai"
			tabindex="-1"
		>
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</button>
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

	.input-container {
		display: flex;
		align-items: center;
		background: var(--bg-input);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-md);
		transition: all 0.15s ease-in-out;
		overflow: hidden;
	}

	.input-container:focus-within {
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
	}

	.input-container.has-error {
		border-color: var(--pill-danger-text);
		background-color: var(--pill-danger-bg);
	}

	.input-container.is-disabled {
		background-color: var(--bg-panel-sub);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.number-field {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 8px;
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		color: var(--text-main);
		font-family: var(--font-mono, monospace);
		width: 100%;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.number-field::-webkit-outer-spin-button,
	.number-field::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.step-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 38px;
		background: var(--bg-panel-sub);
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s;
		user-select: none;
	}

	.step-btn:hover:not(:disabled) {
		background: var(--bg-panel-hover);
		color: var(--brand-primary);
	}

	.step-btn:active:not(:disabled) {
		background: var(--border-panel);
	}

	.step-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.unit-badge {
		font-size: 11.5px;
		color: var(--text-muted);
		background: var(--bg-panel-sub);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		margin-right: 4px;
		font-weight: 600;
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
