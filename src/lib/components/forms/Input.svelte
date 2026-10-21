<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		type?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		maxlength?: number;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		error?: string;
		helperText?: string;
		prefix?: Snippet;
		suffix?: Snippet;
		class?: string;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onblur?: (e: FocusEvent) => void;
		onfocus?: (e: FocusEvent) => void;
	}

	let {
		id,
		name,
		label = '',
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		required = false,
		disabled = false,
		readonly = false,
		maxlength,
		min,
		max,
		step,
		error = '',
		helperText = '',
		prefix,
		suffix,
		class: className = '',
		oninput,
		onchange,
		onblur,
		onfocus
	}: Props = $props();

	const defaultId = `input-${Math.random().toString(36).substring(2, 9)}`;
	const inputId = $derived(id || defaultId);
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
		{#if prefix}
			<div class="input-affix prefix">
				{@render prefix()}
			</div>
		{/if}

		<input
			id={inputId}
			{name}
			{type}
			bind:value
			{placeholder}
			{disabled}
			{readonly}
			{required}
			maxlength={maxlength}
			{min}
			{max}
			{step}
			aria-invalid={!!error}
			aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
			class="input-field"
			{oninput}
			{onchange}
			{onblur}
			{onfocus}
		/>

		{#if suffix}
			<div class="input-affix suffix">
				{@render suffix()}
			</div>
		{/if}
	</div>

	{#if error}
		<p id="{inputId}-error" class="form-feedback error" role="alert">{error}</p>
	{:else if helperText}
		<p id="{inputId}-helper" class="form-feedback helper">{helperText}</p>
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

	.input-container.has-error:focus-within {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
	}

	.input-container.is-disabled {
		background-color: var(--bg-panel-sub);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.input-field {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 14px;
		font-size: 13.5px;
		color: var(--text-main);
		font-family: var(--font-body);
		width: 100%;
	}

	.input-field::placeholder {
		color: var(--text-subtle);
		opacity: 0.75;
	}

	.input-field:disabled {
		cursor: not-allowed;
	}

	.input-affix {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		padding: 0 12px;
	}

	.input-affix.prefix {
		padding-right: 0;
	}

	.input-affix.suffix {
		padding-left: 0;
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
