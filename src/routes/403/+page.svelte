<script lang="ts">
	import { session } from '#lib/auth/session.svelte.js';
</script>

<div class="forbidden-wrapper">
	<div class="forbidden-card">
		<div class="status-code">403</div>
		<h1 class="forbidden-title">Akses Ditolak (Forbidden)</h1>
		<p class="forbidden-desc">
			Peran aktif Anda saat ini (<strong>{session.currentRole.toUpperCase()}</strong>) tidak memiliki hak akses
			untuk membuka data atau halaman ini sesuai kebijakan otorisasi RBAC Hanjo ERP.
		</p>

		<div class="role-hint-box">
			<span class="hint-title">INFORMASI LISENSI &amp; AKSES:</span>
			<p class="hint-text">
				Jika Anda adalah Store Manager, Anda terkunci ketat pada outlet tugas Anda.
				Untuk membuka modul keuangan pusat, laba kotor, atau persetujuan belanja luar,
				silakan masuk menggunakan akun <strong>Owner</strong> atau <strong>HQ Admin</strong>.
			</p>
		</div>

		<div class="action-buttons">
			<a href="/" class="btn-primary">
				Kembali ke Dashboard
			</a>
			<button
				type="button"
				class="btn-switch"
				onclick={() => session.switchRole('owner')}
			>
				Beralih ke Owner Demo (Rina)
			</button>
		</div>
	</div>
</div>

<style>
	.forbidden-wrapper {
		min-height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.forbidden-card {
		max-width: 500px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-xl, 12px);
		padding: 36px 30px;
		text-align: center;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.status-code {
		font-size: 64px;
		font-weight: 900;
		color: #dc2626;
		line-height: 1;
		font-family: var(--font-heading, sans-serif);
	}

	.forbidden-title {
		font-size: 20px;
		font-weight: 700;
		color: #0f172a;
		margin: 0;
	}

	.forbidden-desc {
		font-size: 13.5px;
		color: #475569;
		line-height: 1.5;
		margin: 0;
	}

	.role-hint-box {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 10px;
		padding: 12px 14px;
		text-align: left;
		width: 100%;
	}

	.hint-title {
		font-size: 10.5px;
		font-weight: 700;
		color: #991b1b;
		letter-spacing: 0.5px;
	}

	.hint-text {
		font-size: 12px;
		color: #b91c1c;
		margin: 4px 0 0 0;
		line-height: 1.4;
	}

	.action-buttons {
		display: flex;
		gap: 10px;
		width: 100%;
		margin-top: 8px;
	}

	.btn-primary {
		flex: 1;
		padding: 10px;
		background: #059669;
		color: #ffffff;
		border-radius: 8px;
		font-weight: 600;
		font-size: 13px;
		text-align: center;
		text-decoration: none;
		transition: background-color 0.15s;
	}

	.btn-primary:hover {
		background-color: #047857;
	}

	.btn-switch {
		flex: 1;
		padding: 10px;
		background: #f1f5f9;
		color: #0f172a;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-switch:hover {
		background-color: #e2e8f0;
	}
</style>
