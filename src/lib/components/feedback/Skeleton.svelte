<script lang="ts">
	interface Props {
		variant?: 'text' | 'card' | 'circle' | 'button' | 'row';
		width?: string;
		height?: string;
		count?: number;
		class?: string;
	}

	let {
		variant = 'text',
		width,
		height,
		count = 1,
		class: className = ''
	}: Props = $props();

	function getStyle(): string {
		const styles: string[] = [];
		if (width) styles.push(`width: ${width};`);
		if (height) styles.push(`height: ${height};`);
		return styles.join(' ');
	}
</script>

<div class="skeleton-group {className}">
	{#each Array(count) as _}
		<div
			class="skeleton skeleton-{variant}"
			style={getStyle()}
			aria-hidden="true"
		></div>
	{/each}
</div>

<style>
	.skeleton-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.skeleton {
		background: linear-gradient(
			90deg,
			var(--bg-panel-sub) 25%,
			var(--border-panel) 50%,
			var(--bg-panel-sub) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-text {
		height: 14px;
		width: 100%;
		border-radius: var(--radius-sm);
	}

	.skeleton-card {
		height: 100px;
		width: 100%;
		border-radius: var(--radius-lg);
	}

	.skeleton-circle {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-full);
	}

	.skeleton-button {
		height: 36px;
		width: 100px;
		border-radius: var(--radius-md);
	}

	.skeleton-row {
		height: 24px;
		width: 100%;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
