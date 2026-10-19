<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		description?: string;
		icon?: Snippet;
		action?: Snippet;
		class?: string;
	}

	let {
		title = 'Belum Ada Data',
		description = 'Belum ada catatan atau informasi untuk ditampilkan saat ini.',
		icon,
		action,
		class: className = ''
	}: Props = $props();
</script>

<div class="empty-state-card {className}">
	<div class="empty-icon-box">
		{#if icon}
			{@render icon()}
		{:else}
			<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
				<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
				<line x1="12" y1="22.08" x2="12" y2="12"></line>
			</svg>
		{/if}
	</div>

	<h3 class="empty-title">{title}</h3>
	{#if description}
		<p class="empty-desc">{description}</p>
	{/if}

	{#if action}
		<div class="empty-action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.empty-state-card {
		background: var(--bg-panel);
		border: 1px dashed var(--border-panel);
		border-radius: var(--radius-xl);
		padding: 48px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		width: 100%;
	}

	.empty-icon-box {
		color: var(--text-subtle);
		background: var(--bg-panel-sub);
		width: 68px;
		height: 68px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}

	.empty-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0 0 6px 0;
	}

	.empty-desc {
		font-size: 13px;
		color: var(--text-muted);
		max-width: 360px;
		margin: 0 0 20px 0;
		line-height: 1.45;
	}

	.empty-action {
		display: flex;
		align-items: center;
		gap: 10px;
	}
</style>
