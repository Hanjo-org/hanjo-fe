<script lang="ts">
	import { MOCK_OUTLET, formatRupiah } from '#lib/api/client';

	const outlets = [
		{
			...MOCK_OUTLET,
			manager: 'Budi Pratama',
			phone: '0812-3456-7890',
			shiftStatus: 'Shift Pagi Berjalan',
			shiftCashier: 'Siti Rahma',
			openingCash: 500000,
			totalTodaySales: 4820000,
		},
		{
			id: '01927364-0002-7000-8000-000000000002',
			name: 'Hanjo BSD Green Office Park',
			code: 'TGR-01',
			street: 'GOP 9 Ground Floor',
			city: 'Tangerang Selatan',
			status: 'open',
			tax_rate: 0.10,
			service_charge: 0.0,
			manager: 'Ahmad Fauzi',
			phone: '0813-9876-5432',
			shiftStatus: 'Shift Pagi Berjalan',
			shiftCashier: 'Reza Fahmi',
			openingCash: 500000,
			totalTodaySales: 3150000,
		}
	];
</script>

<div class="outlets-page">
	<header class="page-header">
		<div>
			<h1 class="page-title">Outlet & Manajemen Cabang (Multi-Tenant)</h1>
			<p class="page-subtitle">Konfigurasi cabang, tarif pajak PB1 daerah, dan pantauan shift kasir real-time.</p>
		</div>
		<button class="btn btn-primary">
			<span>🏢</span> Tambah Cabang Baru
		</button>
	</header>

	<div class="outlets-grid">
		{#each outlets as outlet}
			<div class="outlet-card glass-card">
				<div class="card-head">
					<div>
						<div class="code-badge">{outlet.code}</div>
						<h2 class="outlet-title">{outlet.name}</h2>
						<p class="outlet-addr">{outlet.street}, {outlet.city}</p>
					</div>
					<span class="badge badge-success">Operasional Buka</span>
				</div>

				<div class="settings-grid">
					<div class="set-item">
						<span class="set-label">Pajak Restoran (PB1)</span>
						<strong class="set-val">{Math.round(outlet.tax_rate * 100)}%</strong>
					</div>
					<div class="set-item">
						<span class="set-label">Service Charge</span>
						<strong class="set-val">{Math.round(outlet.service_charge * 100)}%</strong>
					</div>
					<div class="set-item">
						<span class="set-label">Shift Kasir Aktif</span>
						<strong class="set-val text-emerald">{outlet.shiftCashier}</strong>
					</div>
					<div class="set-item">
						<span class="set-label">Modal Kas Awal</span>
						<strong class="set-val">{formatRupiah(outlet.openingCash)}</strong>
					</div>
				</div>

				<div class="sales-preview">
					<span class="preview-label">Total Omset Hari Ini:</span>
					<span class="preview-val">{formatRupiah(outlet.totalTodaySales)}</span>
				</div>

				<div class="card-actions">
					<a href="/pos" class="btn btn-primary flex-1">
						<span>🛒</span> Buka Kasir Cabang Ini
					</a>
					<button class="btn btn-secondary">
						<span>⚙️</span> Edit Outlet
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.outlets-page {
		padding: 8px 0 32px 0;
		width: 100%;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 32px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 800;
	}

	.page-subtitle {
		color: var(--text-muted);
		font-size: 0.95rem;
		margin-top: 4px;
	}

	.outlets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
		gap: 24px;
	}

	.outlet-card {
		padding: 28px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.code-badge {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--primary);
		letter-spacing: 0.05em;
		margin-bottom: 4px;
	}

	.outlet-title {
		font-size: 1.35rem;
		font-weight: 800;
		margin-bottom: 4px;
	}

	.outlet-addr {
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		background: var(--bg-surface);
		padding: 16px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		margin-bottom: 20px;
	}

	.set-label {
		display: block;
		font-size: 0.72rem;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 2px;
	}

	.set-val {
		font-size: 0.98rem;
		color: #fff;
	}

	.text-emerald {
		color: var(--accent-emerald);
	}

	.sales-preview {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: var(--radius-md);
		margin-bottom: 24px;
	}

	.preview-label {
		font-size: 0.85rem;
		color: var(--accent-gold);
		font-weight: 600;
	}

	.preview-val {
		font-size: 1.35rem;
		font-weight: 800;
		font-family: var(--font-heading);
		color: var(--accent-gold);
	}

	.card-actions {
		display: flex;
		gap: 12px;
	}

	.flex-1 {
		flex: 1;
	}
</style>
