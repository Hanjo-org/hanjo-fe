<script lang="ts">
	import DatePicker from './DatePicker.svelte';

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

	function handleStartChange(val: string) {
		startDate = val;
		if (endDate && startDate > endDate) {
			endDate = startDate;
		}
		onchange?.({ startDate, endDate });
	}

	function handleEndChange(val: string) {
		endDate = val;
		if (startDate && endDate < startDate) {
			startDate = endDate;
		}
		onchange?.({ startDate, endDate });
	}
</script>

<div class="form-control {className}">
	{#if label || !disabled}
		<div class="label-row">
			{#if label}
				<label for="{rangeId}-start" class="form-label">
					{label}
					{#if required}
						<span class="required-star" aria-hidden="true">*</span>
					{/if}
				</label>
			{/if}

			<div class="preset-badges">
				<button type="button" class="preset-btn" onclick={() => applyPreset('today')}>Hari Ini</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('last7')}>7 Hari</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('last30')}>30 Hari</button>
				<button type="button" class="preset-btn" onclick={() => applyPreset('thisMonth')}>Bulan Ini</button>
			</div>
		</div>
	{/if}

	<div class="range-inputs-container" class:has-error={!!error} class:is-disabled={disabled}>
		<div class="date-picker-wrap">
			<DatePicker
				id="{rangeId}-start"
				bind:value={startDate}
				max={endDate}
				{disabled}
				{required}
				placeholder="Tanggal Mulai"
				onchange={handleStartChange}
			/>
		</div>

		<span class="range-separator">s/d</span>

		<div class="date-picker-wrap">
			<DatePicker
				id="{rangeId}-end"
				bind:value={endDate}
				min={startDate}
				{disabled}
				{required}
				placeholder="Tanggal Akhir"
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
		letter-spacing: 0.015em;
		user-select: none;
	}

	.required-star {
		color: var(--pill-danger-text, #ef4444);
		font-size: 11px;
		font-weight: 500;
	}

	.preset-badges {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.preset-btn {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 9px;
		background: var(--bg-panel-sub);
		color: var(--text-muted);
		border-radius: var(--radius-sm, 6px);
		border: 1px solid var(--border-panel);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preset-btn:hover {
		background: var(--bg-panel-hover);
		color: var(--text-main);
		border-color: var(--border-focus);
	}

	.range-inputs-container {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		box-sizing: border-box;
	}

	.date-picker-wrap {
		flex: 1;
		min-width: 0;
	}

	.range-separator {
		font-size: 12px;
		font-weight: 700;
		color: var(--text-muted);
		flex-shrink: 0;
		user-select: none;
	}

	.form-feedback {
		font-size: 11.5px;
		margin: 0;
	}

	.form-feedback.error {
		color: var(--pill-danger-text, #ef4444);
		font-weight: 500;
	}

	.form-feedback.helper {
		color: var(--text-muted);
	}
</style>
