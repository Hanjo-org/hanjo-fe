<script lang="ts">
	interface Props {
		id?: string;
		label?: string;
		startDate?: string;
		endDate?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		helperText?: string;
		class?: string;
		onchange?: (range: { startDate: string; endDate: string }) => void;
	}

	let {
		id,
		label = '',
		startDate = $bindable(''),
		endDate = $bindable(''),
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		onchange
	}: Props = $props();

	const defaultId = `drange-${Math.random().toString(36).substring(2, 9)}`;
	const rangeId = $derived(id || defaultId);

	function formatDateStr(d: Date): string {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function applyPreset(preset: 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth') {
		if (disabled) return;
		const now = new Date();
		let start = new Date();
		let end = new Date();

		switch (preset) {
			case 'today':
				start = now;
				end = now;
				break;
			case 'last7':
				start = new Date(now);
				start.setDate(now.getDate() - 6);
				end = now;
				break;
			case 'last30':
				start = new Date(now);
				start.setDate(now.getDate() - 29);
				end = now;
				break;
			case 'thisMonth':
				start = new Date(now.getFullYear(), now.getMonth(), 1);
				end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				break;
			case 'lastMonth':
				start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				end = new Date(now.getFullYear(), now.getMonth(), 0);
				break;
		}

		startDate = formatDateStr(start);
		endDate = formatDateStr(end);
		onchange?.({ startDate, endDate });
	}

	function handleStartChange(e: Event & { currentTarget: HTMLInputElement }) {
		startDate = e.currentTarget.value;
		if (endDate && startDate > endDate) {
			endDate = startDate;
		}
		onchange?.({ startDate, endDate });
	}

	function handleEndChange(e: Event & { currentTarget: HTMLInputElement }) {
		endDate = e.currentTarget.value;
		if (startDate && endDate < startDate) {
			startDate = endDate;
		}
		onchange?.({ startDate, endDate });
	}
</script>

<div class="form-control {className}">
	{#if label}
		<div class="label-row">
			<label for="{rangeId}-start" class="form-label">
				{label}
				{#if required}
					<span class="required-star" aria-hidden="true">*</span>
				{/if}
			</label>

			<div class="preset-badges">
				<button type="button" class="preset-btn" onclick={() => applyPreset('today')}>Hari Ini</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('last7')}>7 Hari</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('last30')}>30 Hari</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('thisMonth')}>Bulan Ini</button>
			</div>
		</div>
	{/if}

	<div class="range-inputs-container" class:has-error={!!error} class:is-disabled={disabled}>
		<div class="date-input-wrap">
			<input
				id="{rangeId}-start"
				type="date"
				class="date-field"
				value={startDate}
				{disabled}
				{required}
				aria-label="Tanggal Mulai"
				onchange={handleStartChange}
			/>
		</div>

		<span class="range-separator">s/d</span>

		<div class="date-input-wrap">
			<input
				id="{rangeId}-end"
				type="date"
				class="date-field"
				value={endDate}
				{disabled}
				{required}
				aria-label="Tanggal Akhir"
				onchange={handleEndChange}
			/>
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

	.label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
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

	.preset-badges {
		display: flex;
		gap: 4px;
	}

	.preset-btn {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 7px;
		background: #f1f5f9;
		color: #475569;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
		cursor: pointer;
		transition: all 0.15s;
	}

	.preset-btn:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.range-inputs-container {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-input, #ffffff);
		border: 1px solid var(--border-input, rgba(255, 255, 255, 0.12));
		border-radius: var(--radius-md, 8px);
		padding: 4px 8px;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		min-height: 38px;
		box-sizing: border-box;
	}

	.range-inputs-container:hover:not(:focus-within) {
		border-color: var(--border-input-hover, rgba(255, 255, 255, 0.22));
	}

	.range-inputs-container:focus-within {
		border-color: var(--brand-primary, #059669);
		box-shadow: 0 0 0 3px var(--brand-primary-dim, rgba(5, 150, 105, 0.1));
	}

	.range-inputs-container.has-error {
		border-color: var(--pill-danger-text, #dc2626);
		background-color: var(--pill-danger-bg, #fef2f2);
	}

	.range-inputs-container.is-disabled {
		background-color: var(--bg-panel-sub, #f1f5f9);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.date-input-wrap {
		flex: 1;
	}

	.date-field {
		width: 100%;
		border: none;
		outline: none;
		background: transparent;
		padding: 5px 4px;
		font-size: 13px;
		color: var(--text-main, #0f172a);
		font-family: var(--font-body);
	}

	.date-field:disabled {
		cursor: not-allowed;
	}

	.range-separator {
		font-size: 11.5px;
		font-weight: 600;
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
