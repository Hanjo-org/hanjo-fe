<script lang="ts">
	import {
		MOCK_CATEGORIES,
		MOCK_PRODUCTS,
		MOCK_OUTLET,
		formatRupiah,
		type Product,
		type Variant,
		type ModifierGroup,
		type CartItem,
		type CartModifier
	} from '#lib/api/client';

	let activeCategory = $state('all');
	let orderType = $state<'dine_in' | 'take_away'>('dine_in');
	let tableNumber = $state('05');

	// Cart State
	let cart = $state<CartItem[]>([]);

	// Modal State: Product Customization
	let selectedProduct = $state<Product | null>(null);
	let selectedVariant = $state<Variant | null>(null);
	let selectedModifiers = $state<Record<string, { optionName: string; price: number }>>({});
	let itemNote = $state('');

	// Modal State: Payment
	let showPaymentModal = $state(false);
	let selectedPaymentMethod = $state<'qris' | 'cash' | 'gopay' | 'card'>('qris');
	let cashTendered = $state(100000);
	let showReceiptModal = $state(false);
	let lastTransaction = $state<any>(null);

	// Filtered Products
	let filteredProducts = $derived(
		activeCategory === 'all'
			? MOCK_PRODUCTS
			: MOCK_PRODUCTS.filter((p: Product) => p.category_id === activeCategory)
	);

	// Cart Calculations
	let subtotal = $derived(cart.reduce((sum, item) => sum + item.subtotal, 0));
	let serviceCharge = $derived(Math.round(subtotal * MOCK_OUTLET.service_charge));
	let taxAmount = $derived(Math.round((subtotal + serviceCharge) * MOCK_OUTLET.tax_rate));
	let grandTotal = $derived(subtotal + serviceCharge + taxAmount);
	let changeAmount = $derived(Math.max(0, cashTendered - grandTotal));

	function openCustomization(product: Product) {
		selectedProduct = product;
		selectedVariant = product.variants[0] || null;
		selectedModifiers = {};
		itemNote = '';
	}

	function closeCustomization() {
		selectedProduct = null;
		selectedVariant = null;
		selectedModifiers = {};
	}

	function selectModifier(groupId: string, optionName: string, price: number) {
		selectedModifiers[groupId] = { optionName, price };
	}

	function addToCart() {
		if (!selectedProduct || !selectedVariant) return;

		const appliedMods: CartModifier[] = [];
		let modAdjustment = 0;
		for (const [_, mod] of Object.entries(selectedModifiers)) {
			appliedMods.push({
				modifier_name: '',
				option_name: mod.optionName,
				price_adjustment: mod.price,
			});
			modAdjustment += mod.price;
		}

		const unitPrice = selectedVariant.price + modAdjustment;

		const newItem: CartItem = {
			id: crypto.randomUUID(),
			product_id: selectedProduct.id,
			variant_id: selectedVariant.id,
			product_name: selectedProduct.name,
			variant_name: selectedVariant.name,
			quantity: 1,
			unit_price: unitPrice,
			modifiers: appliedMods,
			subtotal: unitPrice,
			note: itemNote,
		};

		cart = [...cart, newItem];
		closeCustomization();
	}

	function updateQty(id: string, delta: number) {
		cart = cart
			.map((item) => {
				if (item.id === id) {
					const newQty = item.quantity + delta;
					return {
						...item,
						quantity: newQty,
						subtotal: item.unit_price * newQty,
					};
				}
				return item;
			})
			.filter((item) => item.quantity > 0);
	}

	function clearCart() {
		cart = [];
	}

	function handlePaymentSuccess() {
		const txNumber = `TRX-${MOCK_OUTLET.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

		lastTransaction = {
			number: txNumber,
			time: new Date().toLocaleTimeString('id-ID'),
			items: [...cart],
			subtotal,
			serviceCharge,
			taxAmount,
			grandTotal,
			method: selectedPaymentMethod.toUpperCase(),
			cashTendered: selectedPaymentMethod === 'cash' ? cashTendered : grandTotal,
			change: selectedPaymentMethod === 'cash' ? changeAmount : 0,
		};

		showPaymentModal = false;
		showReceiptModal = true;
		cart = [];
	}
</script>

<div class="pos-container">
	<!-- Catalog Menu Section -->
	<div class="menu-section">
		<!-- Top Bar -->
		<div class="pos-topbar">
			<div class="pos-outlet-badge">
				<span class="store-icon">📍</span>
				<div>
					<strong>{MOCK_OUTLET.name}</strong>
					<span class="meta-tag">PB1 10% • Service 5%</span>
				</div>
			</div>

			<div class="order-type-switch">
				<button
					class="type-btn"
					class:active={orderType === 'dine_in'}
					onclick={() => (orderType = 'dine_in')}
				>
					Dine In (Meja {tableNumber})
				</button>
				<button
					class="type-btn"
					class:active={orderType === 'take_away'}
					onclick={() => (orderType = 'take_away')}
				>
					Take Away
				</button>
			</div>
		</div>

		<!-- Category Filter Tabs -->
		<div class="category-tabs">
			<button
				class="cat-tab"
				class:active={activeCategory === 'all'}
				onclick={() => (activeCategory = 'all')}
			>
				Semua Menu
			</button>
			{#each MOCK_CATEGORIES as cat}
				<button
					class="cat-tab"
					class:active={activeCategory === cat.id}
					onclick={() => (activeCategory = cat.id)}
				>
					{cat.name}
				</button>
			{/each}
		</div>

		<!-- Products Grid -->
		<div class="product-grid">
			{#each filteredProducts as product}
				<div
					class="product-card glass-card"
					role="button"
					tabindex="0"
					onclick={() => openCustomization(product)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && openCustomization(product)}
				>
					<div class="product-thumb">{product.image_url}</div>
					<div class="product-body">
						<span class="product-cat">{product.category_name}</span>
						<h3 class="product-name">{product.name}</h3>
						<p class="product-desc">{product.description}</p>
						<div class="product-footer">
							<span class="product-price">{formatRupiah(product.variants[0]?.price || 0)}</span>
							<span class="badge badge-primary">+ Modifiers</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Cart Sidebar -->
	<aside class="cart-sidebar">
		<div class="cart-header">
			<div>
				<h2 class="cart-title">Keranjang Kasir</h2>
				<span class="cart-count">{cart.length} Jenis Menu</span>
			</div>
			{#if cart.length > 0}
				<button class="clear-btn" onclick={clearCart}>Kosongkan</button>
			{/if}
		</div>

		<div class="cart-items">
			{#if cart.length === 0}
				<div class="cart-empty">
					<div class="empty-icon">☕</div>
					<p>Keranjang kosong</p>
					<span>Pilih menu di samping untuk membuat pesanan kasir.</span>
				</div>
			{:else}
				{#each cart as item}
					<div class="cart-item">
						<div class="cart-item-header">
							<div>
								<h4 class="cart-item-name">{item.product_name}</h4>
								<span class="cart-variant-tag">{item.variant_name}</span>
							</div>
							<span class="cart-item-price">{formatRupiah(item.subtotal)}</span>
						</div>

						{#if item.modifiers.length > 0}
							<div class="cart-modifiers">
								{#each item.modifiers as mod}
									<span class="mod-pill">+ {mod.option_name}</span>
								{/each}
							</div>
						{/if}

						<div class="cart-item-actions">
							<div class="qty-control">
								<button class="qty-btn" onclick={() => updateQty(item.id, -1)}>-</button>
								<span class="qty-val">{item.quantity}</span>
								<button class="qty-btn" onclick={() => updateQty(item.id, 1)}>+</button>
							</div>
							<span class="per-unit">{formatRupiah(item.unit_price)}/cup</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Bill Summary -->
		<div class="bill-summary">
			<div class="bill-row">
				<span>Subtotal</span>
				<span>{formatRupiah(subtotal)}</span>
			</div>
			<div class="bill-row">
				<span>Service Charge (5%)</span>
				<span>{formatRupiah(serviceCharge)}</span>
			</div>
			<div class="bill-row">
				<span>Pajak Restoran PB1 (10%)</span>
				<span>{formatRupiah(taxAmount)}</span>
			</div>
			<div class="bill-row total-row">
				<span>Grand Total</span>
				<span class="grand-total-amount">{formatRupiah(grandTotal)}</span>
			</div>

			<button
				class="btn btn-primary checkout-btn"
				disabled={cart.length === 0}
				onclick={() => (showPaymentModal = true)}
			>
				<span>💳</span> Bayar Pesanan ({formatRupiah(grandTotal)})
			</button>
		</div>
	</aside>
</div>

<!-- Modal 1: Customization (Variant, Sugar, Extra Shot) -->
{#if selectedProduct}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		aria-label="Tutup Dialog Kustomisasi"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeCustomization();
		}}
		onkeydown={(e) => e.key === 'Escape' && closeCustomization()}
	>
		<div class="custom-modal glass-card" role="region" aria-label="Dialog Kustomisasi Menu">
			<div class="modal-head">
				<div>
					<h3 class="modal-title">{selectedProduct.name}</h3>
					<span class="modal-sub">{selectedProduct.sku}</span>
				</div>
				<button class="close-x" onclick={closeCustomization} aria-label="Tutup dialog">&times;</button>
			</div>

			<div class="modal-scroll">
				<!-- Variant Selector -->
				<div class="custom-group">
					<span class="group-label">Pilih Ukuran / Varian</span>
					<div class="option-chips">
						{#each selectedProduct.variants as v}
							<button
								class="chip-btn"
								class:active={selectedVariant?.id === v.id}
								onclick={() => (selectedVariant = v)}
							>
								<span>{v.name}</span>
								<span class="chip-price">{formatRupiah(v.price)}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Modifier Groups -->
				{#each selectedProduct.modifier_groups as mg}
					<div class="custom-group">
						<span class="group-label">{mg.name}</span>
						<div class="option-chips">
							{#each mg.options as opt}
								<button
									class="chip-btn"
									class:active={selectedModifiers[mg.id]?.optionName === opt.name}
									onclick={() => selectModifier(mg.id, opt.name, opt.price_adjustment)}
								>
									<span>{opt.name}</span>
									{#if opt.price_adjustment > 0}
										<span class="chip-price">+{formatRupiah(opt.price_adjustment)}</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Notes -->
				<div class="custom-group">
					<label class="group-label" for="pos-item-note">Catatan Khusus (Optional)</label>
					<input
						id="pos-item-note"
						type="text"
						class="text-input"
						placeholder="Misal: Pisahkan es, jangan terlalu manis..."
						bind:value={itemNote}
					/>
				</div>
			</div>

			<div class="modal-foot">
				<button class="btn btn-secondary" onclick={closeCustomization}>Batal</button>
				<button class="btn btn-primary" onclick={addToCart}>
					Tambah ke Keranjang
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal 2: Payment Checkout -->
{#if showPaymentModal}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		aria-label="Tutup Dialog Pembayaran"
		onclick={(e) => {
			if (e.target === e.currentTarget) showPaymentModal = false;
		}}
		onkeydown={(e) => e.key === 'Escape' && (showPaymentModal = false)}
	>
		<div class="payment-modal glass-card" role="region" aria-label="Dialog Pembayaran Kasir">
			<div class="modal-head">
				<div>
					<h3 class="modal-title">Pembayaran Kasir</h3>
					<span class="modal-sub">Tagihan: {formatRupiah(grandTotal)}</span>
				</div>
				<button class="close-x" onclick={() => (showPaymentModal = false)} aria-label="Tutup dialog">&times;</button>
			</div>

			<!-- Method Selector Tabs -->
			<div class="pay-methods">
				<button
					class="method-btn"
					class:active={selectedPaymentMethod === 'qris'}
					onclick={() => (selectedPaymentMethod = 'qris')}
				>
					<span class="m-icon">📱</span>
					<span>QRIS</span>
				</button>
				<button
					class="method-btn"
					class:active={selectedPaymentMethod === 'cash'}
					onclick={() => (selectedPaymentMethod = 'cash')}
				>
					<span class="m-icon">💵</span>
					<span>Tunai (Cash)</span>
				</button>
				<button
					class="method-btn"
					class:active={selectedPaymentMethod === 'gopay'}
					onclick={() => (selectedPaymentMethod = 'gopay')}
				>
					<span class="m-icon">🟢</span>
					<span>GoPay / OVO</span>
				</button>
				<button
					class="method-btn"
					class:active={selectedPaymentMethod === 'card'}
					onclick={() => (selectedPaymentMethod = 'card')}
				>
					<span class="m-icon">💳</span>
					<span>Debit/Kredit</span>
				</button>
			</div>

			<!-- Payment Details Body -->
			<div class="pay-body">
				{#if selectedPaymentMethod === 'qris'}
					<div class="qris-view">
						<div class="qris-qr-box">
							<div class="qr-mock">
								<div class="qr-corner top-left"></div>
								<div class="qr-corner top-right"></div>
								<div class="qr-corner bottom-left"></div>
								<span class="qr-label">QRIS STANDAR BI</span>
							</div>
						</div>
						<p class="qris-caption">Scan dengan GoPay, OVO, BCA Mobile, atau Livin' Mandiri</p>
						<span class="badge badge-success">Siap Dipindai Pelanggan</span>
					</div>
				{:else if selectedPaymentMethod === 'cash'}
					<div class="cash-view">
						<div class="cash-input-group">
							<label class="group-label" for="cash-tendered-input">Uang Diterima (Tendered)</label>
							<input
								id="cash-tendered-input"
								type="number"
								class="cash-input"
								bind:value={cashTendered}
								step="5000"
							/>
						</div>

						<div class="quick-cash-row">
							<button class="chip-btn" onclick={() => (cashTendered = grandTotal)}>Uang Pas</button>
							<button class="chip-btn" onclick={() => (cashTendered = 50000)}>50.000</button>
							<button class="chip-btn" onclick={() => (cashTendered = 100000)}>100.000</button>
							<button class="chip-btn" onclick={() => (cashTendered = 150000)}>150.000</button>
						</div>

						<div class="change-box">
							<span>Kembalian Kasir:</span>
							<strong class="change-amount">{formatRupiah(changeAmount)}</strong>
						</div>
					</div>
				{:else}
					<div class="ewallet-view">
						<p>Silakan proses melalui EDC / scanner kasir.</p>
						<div class="mock-ref">Kode Referensi: <strong>REF-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
					</div>
				{/if}
			</div>

			<div class="modal-foot">
				<button class="btn btn-secondary" onclick={() => (showPaymentModal = false)}>Kembali</button>
				<button class="btn btn-primary" onclick={handlePaymentSuccess}>
					Konfirmasi & Terbitkan Struk
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal 3: Digital Receipt & Struk Kasir -->
{#if showReceiptModal && lastTransaction}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		aria-label="Tutup Dialog Struk"
		onclick={(e) => {
			if (e.target === e.currentTarget) showReceiptModal = false;
		}}
		onkeydown={(e) => e.key === 'Escape' && (showReceiptModal = false)}
	>
		<div class="receipt-modal glass-card" role="region" aria-label="Struk Kasir Transaksi">
			<div class="receipt-paper">
				<div class="receipt-header">
					<h3 class="r-store">KOPI HANJO NUSANTARA</h3>
					<span class="r-addr">{MOCK_OUTLET.street}, {MOCK_OUTLET.city}</span>
					<span class="r-trx">{lastTransaction.number}</span>
					<span class="r-time">{lastTransaction.time}</span>
				</div>

				<div class="r-divider">--------------------------------</div>

				<div class="r-items">
					{#each lastTransaction.items as it}
						<div class="r-item-row">
							<span class="r-item-name">{it.quantity}x {it.product_name} ({it.variant_name})</span>
							<span class="r-item-price">{formatRupiah(it.subtotal)}</span>
						</div>
						{#if it.modifiers.length > 0}
							{#each it.modifiers as m}
								<div class="r-item-sub">  + {m.option_name}</div>
							{/each}
						{/if}
					{/each}
				</div>

				<div class="r-divider">--------------------------------</div>

				<div class="r-totals">
					<div class="r-row"><span>Subtotal:</span><span>{formatRupiah(lastTransaction.subtotal)}</span></div>
					<div class="r-row"><span>Service 5%:</span><span>{formatRupiah(lastTransaction.serviceCharge)}</span></div>
					<div class="r-row"><span>PB1 10%:</span><span>{formatRupiah(lastTransaction.taxAmount)}</span></div>
					<div class="r-row r-grand"><span>TOTAL:</span><span>{formatRupiah(lastTransaction.grandTotal)}</span></div>
					<div class="r-row"><span>Bayar ({lastTransaction.method}):</span><span>{formatRupiah(lastTransaction.cashTendered)}</span></div>
					<div class="r-row"><span>Kembali:</span><span>{formatRupiah(lastTransaction.change)}</span></div>
				</div>

				<div class="r-divider">--------------------------------</div>
				<p class="r-thank">Terima kasih atas kunjungan Anda!<br>Follow Instagram @kopihanjo</p>
			</div>

			<div class="receipt-actions">
				<button class="btn btn-primary w-full" onclick={() => (showReceiptModal = false)}>
					Selesai & Pesanan Baru
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pos-container {
		display: grid;
		grid-template-columns: 1fr 400px;
		height: 100vh;
		overflow: hidden;
	}

	.menu-section {
		display: flex;
		flex-direction: column;
		padding: 24px 32px;
		overflow-y: auto;
		background: var(--bg-base);
	}

	.pos-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.pos-outlet-badge {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.store-icon {
		font-size: 1.4rem;
	}

	.meta-tag {
		display: block;
		font-size: 0.72rem;
		color: var(--primary);
	}

	.order-type-switch {
		display: flex;
		background: var(--bg-surface);
		padding: 4px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.type-btn {
		padding: 8px 16px;
		font-size: 0.85rem;
		font-weight: 600;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition);
	}

	.type-btn.active {
		background: var(--bg-card);
		color: #fff;
		border: 1px solid var(--border-medium);
	}

	.category-tabs {
		display: flex;
		gap: 10px;
		margin-bottom: 24px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.cat-tab {
		padding: 10px 18px;
		font-size: 0.88rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		color: var(--text-muted);
		cursor: pointer;
		white-space: nowrap;
		transition: var(--transition);
	}

	.cat-tab:hover {
		color: var(--text-main);
		border-color: var(--border-medium);
	}

	.cat-tab.active {
		background: var(--primary);
		color: #fff;
		border-color: var(--primary);
		box-shadow: 0 4px 14px var(--primary-glow);
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 20px;
	}

	.product-card {
		padding: 20px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.product-card:hover {
		transform: translateY(-3px);
		border-color: var(--border-primary);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.product-thumb {
		font-size: 2.8rem;
		margin-bottom: 12px;
	}

	.product-cat {
		font-size: 0.72rem;
		color: var(--primary);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.product-name {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 4px 0 6px 0;
	}

	.product-desc {
		font-size: 0.8rem;
		color: var(--text-dim);
		line-height: 1.4;
		margin-bottom: 16px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.product-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
	}

	.product-price {
		font-size: 1.15rem;
		font-weight: 800;
		font-family: var(--font-heading);
		color: var(--accent-gold);
	}

	/* Cart Sidebar */
	.cart-sidebar {
		background: var(--bg-surface);
		border-left: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.cart-header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cart-title {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.cart-count {
		font-size: 0.78rem;
		color: var(--text-dim);
	}

	.clear-btn {
		font-size: 0.8rem;
		color: var(--accent-rose);
		background: transparent;
		border: none;
		cursor: pointer;
		font-weight: 600;
	}

	.cart-items {
		flex: 1;
		overflow-y: auto;
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.cart-empty {
		text-align: center;
		color: var(--text-dim);
		margin-top: 80px;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 12px;
	}

	.cart-item {
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 14px;
	}

	.cart-item-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.cart-item-name {
		font-size: 0.95rem;
		font-weight: 700;
	}

	.cart-variant-tag {
		font-size: 0.75rem;
		color: var(--primary);
	}

	.cart-item-price {
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--accent-gold);
	}

	.cart-modifiers {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-bottom: 10px;
	}

	.mod-pill {
		font-size: 0.72rem;
		color: var(--text-muted);
		background: var(--bg-surface);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
	}

	.cart-item-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 8px;
		border-top: 1px solid var(--border-subtle);
	}

	.qty-control {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.qty-btn {
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		background: var(--bg-surface);
		border: 1px solid var(--border-medium);
		cursor: pointer;
		font-weight: 700;
	}

	.qty-val {
		font-weight: 700;
		font-size: 0.9rem;
	}

	.per-unit {
		font-size: 0.75rem;
		color: var(--text-dim);
	}

	.bill-summary {
		padding: 20px 24px;
		background: var(--bg-card);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.bill-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.total-row {
		font-size: 1.1rem;
		font-weight: 800;
		color: #fff;
		margin-top: 6px;
		padding-top: 8px;
		border-top: 1px dashed var(--border-medium);
	}

	.grand-total-amount {
		color: var(--accent-gold);
		font-size: 1.35rem;
		font-family: var(--font-heading);
	}

	.checkout-btn {
		width: 100%;
		padding: 14px;
		font-size: 1rem;
		margin-top: 8px;
	}

	/* Modal Styles */
	.custom-modal, .payment-modal, .receipt-modal {
		width: 100%;
		max-width: 520px;
		padding: 28px;
		background: var(--bg-surface);
		border: 1px solid var(--border-medium);
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.modal-title {
		font-size: 1.3rem;
		font-weight: 800;
	}

	.modal-sub {
		font-size: 0.8rem;
		color: var(--text-dim);
	}

	.close-x {
		background: transparent;
		border: none;
		font-size: 1.8rem;
		color: var(--text-dim);
		cursor: pointer;
	}

	.custom-group {
		margin-bottom: 20px;
	}

	.group-label {
		display: block;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-muted);
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.option-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip-btn {
		padding: 8px 14px;
		font-size: 0.85rem;
		font-weight: 600;
		background: var(--bg-card);
		border: 1px solid var(--border-medium);
		border-radius: var(--radius-md);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: var(--transition);
	}

	.chip-btn.active {
		border-color: var(--primary);
		background: var(--primary-light);
		color: var(--primary);
	}

	.chip-price {
		font-size: 0.75rem;
		color: var(--accent-gold);
	}

	.text-input {
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-input);
		border: 1px solid var(--border-medium);
		border-radius: var(--radius-md);
		font-size: 0.88rem;
	}

	.modal-foot {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
		padding-top: 16px;
		border-top: 1px solid var(--border-subtle);
	}

	/* Payment Modal */
	.pay-methods {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		margin-bottom: 24px;
	}

	.method-btn {
		padding: 12px 6px;
		border-radius: var(--radius-md);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.method-btn.active {
		background: var(--primary-light);
		border-color: var(--primary);
		color: var(--primary);
	}

	.m-icon {
		font-size: 1.4rem;
	}

	.qris-view {
		text-align: center;
		padding: 16px;
	}

	.qr-mock {
		width: 180px;
		height: 180px;
		margin: 0 auto 16px auto;
		background: #fff;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #000;
		font-weight: 800;
		font-size: 0.8rem;
		position: relative;
		border: 4px solid #fff;
	}

	.qr-corner {
		position: absolute;
		width: 32px;
		height: 32px;
		border: 4px solid #000;
	}
	.qr-corner.top-left { top: 8px; left: 8px; }
	.qr-corner.top-right { top: 8px; right: 8px; }
	.qr-corner.bottom-left { bottom: 8px; left: 8px; }

	.qris-caption {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-bottom: 12px;
	}

	.cash-input {
		width: 100%;
		padding: 12px 16px;
		font-size: 1.4rem;
		font-weight: 800;
		font-family: var(--font-heading);
		background: var(--bg-input);
		border: 1px solid var(--border-medium);
		border-radius: var(--radius-md);
		color: var(--accent-gold);
		margin-bottom: 12px;
	}

	.quick-cash-row {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
	}

	.change-box {
		padding: 16px;
		background: var(--bg-card);
		border-radius: var(--radius-md);
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid var(--border-subtle);
	}

	.change-amount {
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--accent-emerald);
	}

	/* Receipt Paper */
	.receipt-paper {
		background: #faf8f5;
		color: #211d1a;
		padding: 24px;
		border-radius: var(--radius-sm);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.receipt-header {
		text-align: center;
		margin-bottom: 12px;
	}

	.r-store {
		font-weight: 800;
		font-size: 1.1rem;
	}

	.r-addr, .r-trx, .r-time {
		display: block;
		font-size: 0.75rem;
	}

	.r-divider {
		text-align: center;
		color: #8c827a;
		margin: 8px 0;
	}

	.r-item-row, .r-row {
		display: flex;
		justify-content: space-between;
	}

	.r-item-sub {
		font-size: 0.75rem;
		color: #554e48;
	}

	.r-grand {
		font-weight: 800;
		font-size: 1.05rem;
		border-top: 1px dashed #211d1a;
		padding-top: 4px;
	}

	.r-thank {
		text-align: center;
		font-size: 0.75rem;
		margin-top: 8px;
	}

	.receipt-actions {
		margin-top: 20px;
	}

	.w-full {
		width: 100%;
	}
</style>
