<script lang="ts">
	interface Props {
		value: number; // 0 to 100
		max?: number;
		variant?: 'primary' | 'success' | 'warning' | 'danger' | 'auto';
		height?: number;
		showLabel?: boolean;
		label?: string;
	}

	let {
		value = 0,
		max = 100,
		variant = 'auto',
		height = 6,
		showLabel = false,
		label = ''
	}: Props = $props();

	let percentage = $derived(Math.min(100, Math.max(0, Math.round((value / max) * 100))));

	let resolvedVariant = $derived.by(() => {
		if (variant !== 'auto') return variant;
		if (percentage < 30) return 'danger';
		if (percentage < 70) return 'warning';
		return 'success';
	});
</script>

<div class="progress-container">
	{#if showLabel || label}
		<div class="progress-label-row">
			<span class="progress-text">{label}</span>
			<span class="progress-percentage">{percentage}%</span>
		</div>
	{/if}
	<div class="progress-track" style="height: {height}px;">
		<div
			class="progress-fill fill-{resolvedVariant}"
			style="width: {percentage}%;"
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
		></div>
	</div>
</div>

<style>
	.progress-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.progress-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		color: var(--text-muted);
	}

	.progress-percentage {
		font-weight: 700;
		color: var(--text-main);
	}

	.progress-track {
		width: 100%;
		background-color: var(--progress-track);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 0.35s ease-out;
	}

	.fill-primary {
		background-color: var(--progress-fill-primary);
	}

	.fill-success {
		background-color: var(--progress-fill-success);
	}

	.fill-warning {
		background-color: var(--progress-fill-warning);
	}

	.fill-danger {
		background-color: var(--progress-fill-danger);
	}
</style>
