<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: string; // Format YYYY-MM-DD
		min?: string;
		max?: string;
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
		min,
		max,
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `date-${Math.random().toString(36).substring(2, 9)}`;
	const dateId = $derived(id || defaultId);

	function handleChange(e: Event & { currentTarget: HTMLInputElement }) {
		value = e.currentTarget.value;
		onchange?.(value);
	}
</script>

<div class="form-control {className}">
	{#if label}
		<label for={dateId} class="form-label">
			{label}
			{#if required}
				<span class="required-star" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<div class="input-container" class:has-error={!!error} class:is-disabled={disabled}>
		<div class="date-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
				<line x1="16" y1="2" x2="16" y2="6"></line>
				<line x1="8" y1="2" x2="8" y2="6"></line>
				<line x1="3" y1="10" x2="21" y2="10"></line>
			</svg>
		</div>

		<input
			id={dateId}
			{name}
			type="date"
			bind:value
			{min}
			{max}
			{disabled}
			{required}
			aria-invalid={!!error}
			class="date-field"
			onchange={handleChange}
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
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
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

	.date-icon {
		color: var(--text-muted);
		padding-left: 14px;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	.date-field {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 14px 9px 10px;
		font-size: 13.5px;
		color: var(--text-main);
		font-family: var(--font-body);
		width: 100%;
		cursor: pointer;
	}

	.date-field:disabled {
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
