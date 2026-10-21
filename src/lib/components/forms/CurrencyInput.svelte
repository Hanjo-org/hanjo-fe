<script lang="ts">
	import type { DecimalString } from '../../api/contract/types.js';

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: DecimalString;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		error?: string;
		helperText?: string;
		class?: string;
		onchange?: (val: DecimalString) => void;
	}

	let {
		id,
		name,
		label = '',
		value = $bindable('0.00'),
		placeholder = '0',
		required = false,
		disabled = false,
		readonly = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `curr-${Math.random().toString(36).substring(2, 9)}`;
	const inputId = $derived(id || defaultId);

	// Konversi decimal string ke tampilan Rupiah terformat (mis. "25000.00" -> "25.000")
	function formatDisplay(val: string): string {
		if (!val) return '';
		const clean = val.replace(/[^0-9]/g, '');
		if (!clean) return '';
		const num = parseInt(clean, 10);
		return new Intl.NumberFormat('id-ID').format(num);
	}

	let displayValue = $state(formatDisplay(value || '0'));

	// Sinkronkan saat prop value berubah dari luar
	$effect(() => {
		displayValue = formatDisplay(value || '0');
	});

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = e.currentTarget.value;
		// Hanya ambil digit
		const digits = raw.replace(/\D/g, '');
		const num = digits ? parseInt(digits, 10) : 0;

		// Format tampilan Rupiah ribuan
		displayValue = digits ? new Intl.NumberFormat('id-ID').format(num) : '';

		// Format output ke string desimal 2 angka ("25000.00")
		const decimalStr: DecimalString = `${num}.00`;
		value = decimalStr;
		onchange?.(decimalStr);
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
		<span class="currency-prefix">Rp</span>

		<input
			id={inputId}
			{name}
			type="text"
			inputmode="numeric"
			value={displayValue}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			aria-invalid={!!error}
			class="currency-field"
			oninput={handleInput}
		/>
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
		gap: 5px;
		width: 100%;
	}

	.form-label {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-muted, #94a3b8);
		display: flex;
		align-items: center;
		gap: 3px;
		text-transform: none;
		letter-spacing: 0.015em;
		transition: color 0.15s ease;
		user-select: none;
	}

	.form-control:focus-within .form-label {
		color: var(--text-main, #f1f5f9);
	}

	.required-star {
		color: var(--pill-danger-text, #ef4444);
		font-size: 11px;
		font-weight: 500;
		opacity: 0.85;
	}

	.input-container {
		display: flex;
		align-items: center;
		background: var(--bg-input);
		border: 1px solid var(--border-input, rgba(255, 255, 255, 0.12));
		border-radius: var(--radius-md);
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
		overflow: hidden;
		min-height: 40px;
		box-sizing: border-box;
	}

	.input-container:hover:not(.is-disabled):not(:focus-within) {
		border-color: var(--border-input-hover, rgba(255, 255, 255, 0.22));
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

	.currency-prefix {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-muted);
		background: var(--bg-panel-sub);
		padding: 9px 14px;
		border-right: 1px solid var(--border-panel);
		user-select: none;
	}

	.currency-field {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 14px;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-main);
		font-family: var(--font-mono, monospace);
		width: 100%;
	}

	.currency-field::placeholder {
		color: var(--text-subtle);
		opacity: 0.75;
	}

	.currency-field:disabled {
		cursor: not-allowed;
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
