<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from '../forms/Button.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'primary';
		loading?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let {
		open = false,
		title = 'Konfirmasi Tindakan',
		message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
		confirmText = 'Lanjutkan',
		cancelText = 'Batal',
		variant = 'danger',
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props();
</script>

<Modal {open} {title} maxWidth="440px" onclose={oncancel}>
	<div class="confirm-body">
		<div class="confirm-icon-box icon-{variant}">
			{#if variant === 'danger'}
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
					<line x1="12" y1="9" x2="12" y2="13"></line>
					<line x1="12" y1="17" x2="12.01" y2="17"></line>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
			{/if}
		</div>

		<p class="confirm-message">{message}</p>
	</div>

	{#snippet footer()}
		<Button variant="secondary" size="md" onclick={oncancel} disabled={loading}>
			{cancelText}
		</Button>
		<Button
			variant={variant === 'danger' ? 'danger' : 'primary'}
			size="md"
			onclick={onconfirm}
			{loading}
		>
			{confirmText}
		</Button>
	{/snippet}
</Modal>

<style>
	.confirm-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 8px 0 16px 0;
		gap: 14px;
	}

	.confirm-icon-box {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-danger {
		color: var(--pill-danger-text);
		background: var(--pill-danger-bg);
	}

	.icon-warning {
		color: var(--pill-warning-text);
		background: var(--pill-warning-bg);
	}

	.icon-primary {
		color: var(--brand-primary);
		background: var(--brand-primary-dim);
	}

	.confirm-message {
		font-size: 13.5px;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}
</style>
