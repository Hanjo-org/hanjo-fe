<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from '../forms/Button.svelte';
	import Input from '../forms/Input.svelte';
	import { session } from '../../auth/session.svelte.js';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		onverified: (stepUpToken: string) => void;
		oncancel: () => void;
	}

	let {
		open = false,
		title = 'Konfirmasi Keamanan (Step-Up Auth)',
		description = 'Tindakan ini memerlukan verifikasi kata sandi atau PIN akun Anda sebelum dapat diproses.',
		onverified,
		oncancel
	}: Props = $props();

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e?: Event) {
		e?.preventDefault();
		if (!password) {
			error = 'Kata sandi atau PIN wajib diisi';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await session.verifyStepUp(password);
			password = '';
			onverified(res.step_up_token);
		} catch (err: any) {
			error = err.message || 'Kata sandi atau PIN salah';
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		password = '';
		error = '';
		oncancel();
	}
</script>

<Modal {open} {title} maxWidth="420px" onclose={handleClose}>
	<form onsubmit={handleSubmit} class="step-up-form">
		<div class="step-up-icon-box">
			<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
				<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
			</svg>
		</div>

		<p class="step-up-desc">{description}</p>

		<Input
			type="password"
			label="Kata Sandi / PIN"
			placeholder="Masukkan kata sandi (demo: 123456)"
			bind:value={password}
			{error}
			required
		/>

		<div class="step-up-actions">
			<Button variant="secondary" size="md" onclick={handleClose} disabled={loading} type="button">
				Batal
			</Button>
			<Button variant="primary" size="md" {loading} type="submit">
				Konfirmasi
			</Button>
		</div>
	</form>
</Modal>

<style>
	.step-up-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.step-up-icon-box {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		background: var(--brand-primary-dim);
		color: var(--brand-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
	}

	.step-up-desc {
		font-size: 13px;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.45;
		margin: 0;
	}

	.step-up-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 10px;
	}
</style>
