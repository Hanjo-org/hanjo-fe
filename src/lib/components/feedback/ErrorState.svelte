<script lang="ts">
	import Button from '../forms/Button.svelte';

	interface Props {
		title?: string;
		message?: string;
		code?: string;
		onretry?: () => void;
		class?: string;
	}

	let {
		title = 'Gagal Memuat Data',
		message = 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
		code = '',
		onretry,
		class: className = ''
	}: Props = $props();
</script>

<div class="error-state-card {className}">
	<div class="error-icon-box">
		<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="12" y1="8" x2="12" y2="12"></line>
			<line x1="12" y1="16" x2="12.01" y2="16"></line>
		</svg>
	</div>

	<h3 class="error-title">{title}</h3>
	{#if message}
		<p class="error-message">{message}</p>
	{/if}

	{#if code}
		<span class="error-code-badge">Kode: {code}</span>
	{/if}

	{#if onretry}
		<div class="error-action">
			<Button variant="secondary" size="md" onclick={onretry}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="1 4 1 10 7 10"></polyline>
					<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
				</svg>
				Coba Lagi
			</Button>
		</div>
	{/if}
</div>

<style>
	.error-state-card {
		background: var(--bg-panel);
		border: 1px solid var(--pill-danger-border);
		border-radius: var(--radius-xl);
		padding: 40px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		width: 100%;
	}

	.error-icon-box {
		color: var(--pill-danger-text);
		background: var(--pill-danger-bg);
		width: 64px;
		height: 64px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}

	.error-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0 0 6px 0;
	}

	.error-message {
		font-size: 13px;
		color: var(--text-muted);
		max-width: 400px;
		margin: 0 0 12px 0;
		line-height: 1.45;
	}

	.error-code-badge {
		font-family: var(--font-mono, monospace);
		font-size: 11px;
		color: var(--pill-danger-text);
		background: var(--pill-danger-bg);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		margin-bottom: 20px;
	}

	.error-action {
		display: flex;
		align-items: center;
		gap: 10px;
	}
</style>
