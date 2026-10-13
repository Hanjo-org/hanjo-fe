<script lang="ts">
	import { MOCK_PRODUCTS, MOCK_CATEGORIES, formatRupiah } from '#lib/api/client';

	let selectedCategory = $state('all');
	let expandedProduct = $state<string | null>('prod-1');

	let products = $derived(
		selectedCategory === 'all'
			? MOCK_PRODUCTS
			: MOCK_PRODUCTS.filter((p) => p.category_id === selectedCategory)
	);

	function toggleExpand(id: string) {
		expandedProduct = expandedProduct === id ? null : id;
	}
</script>

<div class="catalog-page">
	<header class="page-header">
		<div>
			<h1 class="page-title">Katalog & Resep Bahan Baku (BOM)</h1>
			<p class="page-subtitle">Kelola produk kopi, varian, dan Bill of Materials (BOM) pemotongan stok otomatis.</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary">
				<span>📁</span> Tambah Kategori
			</button>
			<button class="btn btn-primary">
				<span>➕</span> Tambah Produk Baru
			</button>
		</div>
	</header>

	<!-- Category Filters -->
	<div class="cat-filter-row">
		<button
			class="filter-chip"
			class:active={selectedCategory === 'all'}
			onclick={() => (selectedCategory = 'all')}
		>
			Semua ({MOCK_PRODUCTS.length})
		</button>
		{#each MOCK_CATEGORIES as cat}
			<button
				class="filter-chip"
				class:active={selectedCategory === cat.id}
				onclick={() => (selectedCategory = cat.id)}
			>
				{cat.name}
			</button>
		{/each}
	</div>

	<!-- Product Catalog List -->
	<div class="product-cards-list">
		{#each products as prod}
			<div class="product-card glass-card">
				<!-- Header Row -->
				<div
					class="card-top"
					role="button"
					tabindex="0"
					onclick={() => toggleExpand(prod.id)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand(prod.id)}
				>
					<div class="prod-identity">
						<span class="prod-emoji">{prod.image_url}</span>
						<div>
							<div class="sku-badge">{prod.sku}</div>
							<h2 class="prod-name">{prod.name}</h2>
							<p class="prod-desc">{prod.description}</p>
						</div>
					</div>

					<div class="prod-meta">
						<div class="pricing-pill">
							<span class="label">Mulai Dari</span>
							<span class="price-val">{formatRupiah(prod.variants[0]?.price || 0)}</span>
						</div>
						<span class="badge badge-success">Aktif di Menu</span>
						<span class="expand-btn">
							{expandedProduct === prod.id ? 'Tutup Detail ▲' : 'Lihat Resep BOM ▼'}
						</span>
					</div>
				</div>

				<!-- Expandable Section: Variants & Bill of Materials (BOM) -->
				{#if expandedProduct === prod.id}
					<div class="bom-details">
						<div class="bom-header">
							<h3>📋 Formula Resep Bahan Baku (Bill of Materials)</h3>
							<p>Setiap penjualan cup varian ini di POS akan memotong inventaris sesuai takaran di bawah ini.</p>
						</div>

						<div class="variants-grid">
							{#each prod.variants as v}
								<div class="variant-box">
									<div class="variant-head">
										<div>
											<strong class="v-name">{v.name}</strong>
											<span class="v-sku">{v.sku}</span>
										</div>
										<div class="v-pricing">
											<span class="v-price">{formatRupiah(v.price)}</span>
											<span class="v-cost">HPP (COGS): {formatRupiah(v.cost)}</span>
											<span class="badge badge-success">Margin: {Math.round(((v.price - v.cost) / v.price) * 100)}%</span>
										</div>
									</div>

									<div class="recipe-table">
										<div class="table-head">
											<span>Bahan Baku Terpakai</span>
											<span>Takaran Resep</span>
										</div>
										{#if v.recipes && v.recipes.length > 0}
											{#each v.recipes as r}
												<div class="table-row">
													<span class="r-name">🌿 {r.ingredient_name || r.ingredient_id}</span>
													<span class="r-qty">{r.quantity} {r.unit}</span>
												</div>
											{/each}
										{:else}
											<div class="table-row text-dim">Tidak ada formula resep terdaftar</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						{#if prod.modifier_groups.length > 0}
							<div class="modifiers-section">
								<h4>Pilihan Modifiers / Kustomisasi</h4>
								<div class="mods-row">
									{#each prod.modifier_groups as mg}
										<div class="mod-group-card">
											<div class="mg-name">{mg.name} (Maks {mg.max_select})</div>
											<div class="mg-opts">
												{#each mg.options as opt}
													<span class="mg-opt-tag">
														{opt.name}
														{#if opt.price_adjustment > 0}
															(+{formatRupiah(opt.price_adjustment)})
														{/if}
													</span>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.catalog-page {
		padding: 8px 0 32px 0;
		width: 100%;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
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

	.header-actions {
		display: flex;
		gap: 12px;
	}

	.cat-filter-row {
		display: flex;
		gap: 10px;
		margin-bottom: 28px;
		overflow-x: auto;
	}

	.filter-chip {
		padding: 8px 16px;
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 600;
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		color: var(--text-muted);
		cursor: pointer;
		transition: var(--transition);
	}

	.filter-chip.active {
		background: var(--primary);
		color: #fff;
		border-color: var(--primary);
	}

	.product-cards-list {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.product-card {
		padding: 24px;
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
	}

	.prod-identity {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.prod-emoji {
		font-size: 2.8rem;
		width: 64px;
		height: 64px;
		background: var(--bg-surface);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-subtle);
	}

	.sku-badge {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--primary);
		letter-spacing: 0.05em;
		margin-bottom: 4px;
	}

	.prod-name {
		font-size: 1.35rem;
		font-weight: 800;
		margin-bottom: 4px;
	}

	.prod-desc {
		font-size: 0.85rem;
		color: var(--text-muted);
		max-width: 600px;
	}

	.prod-meta {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.pricing-pill {
		text-align: right;
	}

	.pricing-pill .label {
		display: block;
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	.price-val {
		font-size: 1.35rem;
		font-weight: 800;
		font-family: var(--font-heading);
		color: var(--accent-gold);
	}

	.expand-btn {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--primary);
		background: transparent;
		border: none;
		cursor: pointer;
	}

	/* BOM details */
	.bom-details {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid var(--border-subtle);
	}

	.bom-header h3 {
		font-size: 1.05rem;
		color: #fff;
		margin-bottom: 4px;
	}

	.bom-header p {
		font-size: 0.82rem;
		color: var(--text-dim);
		margin-bottom: 20px;
	}

	.variants-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 20px;
		margin-bottom: 24px;
	}

	.variant-box {
		background: var(--bg-surface);
		border: 1px solid var(--border-medium);
		border-radius: var(--radius-md);
		padding: 18px;
	}

	.variant-head {
		display: flex;
		justify-content: space-between;
		margin-bottom: 14px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.v-name {
		display: block;
		font-size: 1.05rem;
	}

	.v-sku {
		font-size: 0.75rem;
		color: var(--text-dim);
	}

	.v-pricing {
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.v-price {
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--accent-gold);
	}

	.v-cost {
		font-size: 0.75rem;
		color: var(--text-dim);
	}

	.recipe-table {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 0.85rem;
	}

	.table-head {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px;
		background: var(--bg-card);
		border-radius: var(--radius-sm);
	}

	.r-qty {
		font-weight: 700;
		color: var(--primary);
	}

	.modifiers-section h4 {
		font-size: 0.92rem;
		margin-bottom: 12px;
	}

	.mods-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.mod-group-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 12px 16px;
	}

	.mg-name {
		font-weight: 700;
		font-size: 0.85rem;
		margin-bottom: 8px;
		color: var(--text-muted);
	}

	.mg-opts {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.mg-opt-tag {
		font-size: 0.75rem;
		background: var(--bg-card);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
	}
</style>
