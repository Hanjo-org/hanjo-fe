<script lang="ts">
	import { session } from '#lib/auth/session.svelte.js';
	import { DEMO_USER_LIST } from '#lib/config/demo_accounts.js';
	import { toast } from '#lib/components/feedback/toast.svelte.js';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function handleDemoLogin(userId: string) {
		isLoading = true;
		errorMessage = '';
		try {
			await session.switchRole(undefined, userId);
			toast.success(`Berhasil masuk sebagai ${session.currentUser?.name}!`);
			if (typeof window !== 'undefined') {
				window.location.href = '/';
			}
		} catch (err: any) {
			errorMessage = err.message || 'Gagal masuk akun demo';
			toast.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	async function handleFormLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !password) {
			errorMessage = 'Email dan kata sandi wajib diisi';
			return;
		}

		isLoading = true;
		errorMessage = '';
		try {
			await session.login(email, password);
			toast.success(`Selamat datang kembali, ${session.currentUser?.name}!`);
			if (typeof window !== 'undefined') {
				window.location.href = '/';
			}
		} catch (err: any) {
			errorMessage = err.message || 'Email atau kata sandi tidak valid';
			toast.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-page-wrapper">
	<div class="login-card">
		<!-- Brand Header -->
		<div class="login-brand">
			<div class="emblem">
				<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2">
					<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
					<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
					<line x1="6" y1="1" x2="6" y2="4"></line>
					<line x1="10" y1="1" x2="10" y2="4"></line>
					<line x1="14" y1="1" x2="14" y2="4"></line>
				</svg>
			</div>
			<div class="brand-headings">
				<h1 class="brand-name">HANJO ERP</h1>
				<p class="brand-tagline">Sistem Manajemen Bisnis F&amp;B Multi-Outlet</p>
			</div>
		</div>

		{#if errorMessage}
			<div class="error-banner" role="alert">
				<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
				</svg>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- 1-Click Demo Login Shortcuts -->
		<div class="demo-login-box">
			<span class="demo-box-title">PILIH 1-KLIK AKUN DEMO PERAN:</span>
			<div class="demo-cards-grid">
				{#each DEMO_USER_LIST as demo (demo.id)}
					<button
						type="button"
						class="demo-card"
						disabled={isLoading}
						onclick={() => handleDemoLogin(demo.id)}
					>
						<div class="demo-avatar">{demo.name.charAt(0)}</div>
						<div class="demo-meta">
							<span class="name">{demo.name}</span>
							<span class="role-badge">{demo.role.toUpperCase()}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="or-separator">
			<span>atau masuk dengan akun terdaftar</span>
		</div>

		<!-- Regular Credentials Form -->
		<form onsubmit={handleFormLogin} class="login-form">
			<div class="form-group">
				<label for="email" class="form-label">Alamat Email</label>
				<input
					id="email"
					type="email"
					class="form-input"
					placeholder="nama@hanjocoffee.com"
					bind:value={email}
					disabled={isLoading}
				/>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Kata Sandi</label>
				<input
					id="password"
					type="password"
					class="form-input"
					placeholder="••••••••"
					bind:value={password}
					disabled={isLoading}
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={isLoading}>
				{isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
			</button>
		</form>
	</div>
</div>

<style>
	.login-page-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8fafc;
		padding: 24px 16px;
	}

	.login-card {
		width: 100%;
		max-width: 460px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-xl, 12px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
		padding: 32px 28px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.login-brand {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.emblem {
		width: 50px;
		height: 50px;
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
		flex-shrink: 0;
	}

	.brand-name {
		font-size: 20px;
		font-weight: 800;
		color: #0f172a;
		line-height: 1.2;
		margin: 0;
	}

	.brand-tagline {
		font-size: 12px;
		color: #64748b;
		margin: 2px 0 0 0;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 13px;
	}

	.demo-login-box {
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 14px;
	}

	.demo-box-title {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.6px;
		color: #64748b;
	}

	.demo-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
	}

	.demo-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
	}

	.demo-card:hover:not(:disabled) {
		border-color: #059669;
		background-color: #f0fdf4;
		transform: translateY(-1px);
	}

	.demo-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #059669;
		color: #ffffff;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.demo-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.demo-meta .name {
		font-size: 12px;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.demo-meta .role-badge {
		font-size: 9.5px;
		font-weight: 700;
		color: #059669;
	}

	.or-separator {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		text-align: center;
		margin: 4px 0;
	}

	.or-separator::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: #e2e8f0;
		z-index: 1;
	}

	.or-separator span {
		position: relative;
		z-index: 2;
		background: #ffffff;
		padding: 0 12px;
		font-size: 11px;
		color: #94a3b8;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 12px;
		font-weight: 600;
		color: #334155;
	}

	.form-input {
		width: 100%;
		padding: 9px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		font-size: 13.5px;
		color: #0f172a;
		outline: none;
		transition: all 0.15s;
	}

	.form-input:focus {
		border-color: #059669;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}

	.submit-btn {
		margin-top: 6px;
		padding: 10px;
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 13.5px;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
		transition: all 0.15s;
	}

	.submit-btn:hover:not(:disabled) {
		opacity: 0.95;
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
