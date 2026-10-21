<script lang="ts">
	export interface ComboboxOption {
		value: string;
		label: string;
		subtitle?: string;
		disabled?: boolean;
	}

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: string;
		options?: ComboboxOption[];
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
		placeholder = 'Ketik untuk mencari...',
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `combo-${Math.random().toString(36).substring(2, 9)}`;
	const comboboxId = $derived(id || defaultId);
	let isOpen = $state(false);
	let searchTerm = $state('');

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	$effect(() => {
		if (!isOpen) {
			searchTerm = selectedOption ? selectedOption.label : '';
		}
	});

	const filteredOptions = $derived(
		searchTerm.trim() === ''
			? options
			: options.filter(
					(opt) =>
						opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
						(opt.subtitle && opt.subtitle.toLowerCase().includes(searchTerm.toLowerCase().trim()))
				)
	);

	function selectOption(opt: ComboboxOption) {
		if (opt.disabled || disabled) return;
		value = opt.value;
		searchTerm = opt.label;
		isOpen = false;
		onchange?.(opt.value);
	}

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest(`#${comboboxId}-container`)) {
			isOpen = false;
			searchTerm = selectedOption ? selectedOption.label : '';
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="form-control {className}">
	{#if label}
		<label for={comboboxId} class="form-label">
			{label}
			{#if required}
				<span class="required-star" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<div
		id="{comboboxId}-container"
		class="combobox-container"
		class:has-error={!!error}
		class:is-disabled={disabled}
		class:is-open={isOpen}
	>
		<div class="input-wrapper">
			<input
				id={comboboxId}
				{name}
				type="text"
				class="combobox-input"
				{placeholder}
				{disabled}
				{required}
				bind:value={searchTerm}
				onfocus={() => {
					if (!disabled) isOpen = true;
				}}
				oninput={() => {
					if (!isOpen) isOpen = true;
				}}
				autocomplete="off"
			/>

			<div class="actions">
				{#if value && !disabled}
					<button
						type="button"
						class="clear-btn"
						aria-label="Kosongkan pilihan"
						onclick={(e) => {
							e.stopPropagation();
							value = '';
							searchTerm = '';
							onchange?.('');
						}}
					>
						&times;
					</button>
				{/if}
				<button
					type="button"
					class="arrow-btn"
					aria-label="Buka menu pilihan"
					tabindex="-1"
					onclick={() => {
						if (!disabled) isOpen = !isOpen;
					}}
				>
					<svg
						class="arrow-icon"
						class:rotate={isOpen}
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</button>
			</div>
		</div>

		{#if isOpen}
			<div class="combobox-dropdown">
				<div class="options-list">
					{#if filteredOptions.length === 0}
						<div class="empty-option">Tidak ada data yang cocok</div>
					{:else}
						{#each filteredOptions as opt (opt.value)}
							<button
								type="button"
								class="option-item"
								class:is-selected={value === opt.value}
								disabled={opt.disabled}
								onclick={() => selectOption(opt)}
							>
								<div class="option-text">
									<span class="option-label">{opt.label}</span>
									{#if opt.subtitle}
										<span class="option-subtitle">{opt.subtitle}</span>
									{/if}
								</div>
								{#if value === opt.value}
									<svg class="check-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
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
		color: var(--pill-danger-text, #dc2626);
		font-size: 11px;
		font-weight: 500;
		opacity: 0.85;
	}

	.combobox-container {
		position: relative;
		width: 100%;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background: var(--bg-input, #ffffff);
		border: 1px solid var(--border-input, rgba(255, 255, 255, 0.12));
		border-radius: var(--radius-md, 8px);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		overflow: hidden;
		min-height: 40px;
		box-sizing: border-box;
	}

	.input-wrapper:hover:not(:focus-within) {
		border-color: var(--border-input-hover, rgba(255, 255, 255, 0.22));
	}

	.combobox-container.is-open .input-wrapper,
	.input-wrapper:focus-within {
		border-color: var(--brand-primary, #059669);
		box-shadow: 0 0 0 3px var(--brand-primary-dim, rgba(5, 150, 105, 0.1));
	}

	.combobox-container.has-error .input-wrapper {
		border-color: var(--pill-danger-text, #dc2626);
		background-color: var(--pill-danger-bg, #fef2f2);
	}

	.combobox-container.is-disabled .input-wrapper {
		background-color: var(--bg-panel-sub, #f1f5f9);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.combobox-input {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		padding: 9px 14px;
		font-size: 13.5px;
		color: var(--text-main, #0f172a);
		font-family: var(--font-body);
		width: 100%;
	}

	.combobox-input:disabled {
		cursor: not-allowed;
	}

	.actions {
		display: flex;
		align-items: center;
		padding-right: 8px;
		gap: 4px;
	}

	.clear-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 16px;
		cursor: pointer;
		padding: 2px 4px;
		line-height: 1;
	}

	.clear-btn:hover {
		color: #0f172a;
	}

	.arrow-btn {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 4px;
	}

	.arrow-icon {
		transition: transform 0.2s ease;
	}

	.arrow-icon.rotate {
		transform: rotate(180deg);
	}

	.combobox-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 50;
		background: #ffffff;
		border: 1px solid var(--border-panel, #e2e8f0);
		border-radius: var(--radius-md, 8px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
		max-height: 220px;
		overflow-y: auto;
	}

	.options-list {
		padding: 6px 0;
	}

	.option-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 14px;
		font-size: 13px;
		color: var(--text-main, #0f172a);
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.option-item:hover:not(:disabled) {
		background-color: #f8fafc;
	}

	.option-item.is-selected {
		background-color: #f0fdf4;
		font-weight: 600;
	}

	.option-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-label {
		font-size: 13px;
		color: #0f172a;
	}

	.option-subtitle {
		font-size: 11px;
		color: #64748b;
	}

	.check-icon {
		color: var(--brand-primary, #059669);
	}

	.empty-option {
		padding: 12px;
		text-align: center;
		font-size: 12.5px;
		color: var(--text-muted, #94a3b8);
	}

	.form-feedback {
		font-size: 11.5px;
		margin: 0;
	}

	.form-feedback.error {
		color: var(--pill-danger-text, #dc2626);
		font-weight: 500;
	}

	.form-feedback.helper {
		color: var(--text-muted, #64748b);
	}
</style>
