<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: string;
		placeholder?: string;
		rows?: number;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		error?: string;
		helperText?: string;
		maxLength?: number;
		class?: string;
		oninput?: (e: Event & { currentTarget: HTMLTextAreaElement }) => void;
		onchange?: (e: Event & { currentTarget: HTMLTextAreaElement }) => void;
	}

	let {
		id,
		name,
		label = '',
		value = $bindable(''),
		placeholder = '',
		rows = 3,
		required = false,
		disabled = false,
		readonly = false,
		error = '',
		helperText = '',
		maxLength,
		class: className = '',
		oninput,
		onchange
	}: Props = $props();

	const defaultId = `txt-${Math.random().toString(36).substring(2, 9)}`;
	const textareaId = $derived(id || defaultId);
</script>

<div class="form-control {className}">
	<div class="label-row">
		{#if label}
			<label for={textareaId} class="form-label">
				{label}
				{#if required}
					<span class="required-star" aria-hidden="true">*</span>
				{/if}
			</label>
		{/if}
		{#if maxLength}
			<span class="char-counter">{(value || '').length}/{maxLength}</span>
		{/if}
	</div>

	<div class="textarea-container" class:has-error={!!error} class:is-disabled={disabled}>
		<textarea
			id={textareaId}
			{name}
			bind:value
			{rows}
			{placeholder}
			{disabled}
			{readonly}
			{required}
			maxlength={maxLength}
			aria-invalid={!!error}
			class="textarea-field"
			{oninput}
			{onchange}
		></textarea>
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

	.label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	.char-counter {
		font-size: 11px;
		color: var(--text-subtle);
		font-family: var(--font-mono, monospace);
	}

	.textarea-container {
		background: var(--bg-input);
		border: 1px solid var(--border-input, rgba(255, 255, 255, 0.12));
		border-radius: var(--radius-md);
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
		overflow: hidden;
		box-sizing: border-box;
	}

	.textarea-container:hover:not(.is-disabled):not(:focus-within) {
		border-color: var(--border-input-hover, rgba(255, 255, 255, 0.22));
	}

	.textarea-container:focus-within {
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px var(--brand-primary-dim);
	}

	.textarea-container.has-error {
		border-color: var(--pill-danger-text);
		background-color: var(--pill-danger-bg);
	}

	.textarea-container.is-disabled {
		background-color: var(--bg-panel-sub);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.textarea-field {
		width: 100%;
		border: none;
		outline: none;
		background: transparent;
		padding: 12px 14px;
		font-size: 13.5px;
		color: var(--text-main);
		font-family: var(--font-body);
		resize: vertical;
		min-height: 80px;
		box-sizing: border-box;
	}

	.textarea-field::placeholder {
		color: var(--text-subtle);
		opacity: 0.75;
	}

	.textarea-field:disabled {
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
