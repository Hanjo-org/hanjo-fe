<script lang="ts">
	let selectedDateRange = $state('Hari Ini');
	let activeSubTab = $state<'transaksi' | 'tindakan' | 'outlet' | 'semua'>('transaksi');
	let chartTimeRange = $state('7 Hari Terakhir');

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// 1. KPI Stats Cards (PRD 8.1 & Desain Sebelumnya)
	const kpiStats = [
		{
			id: 'omzet',
			title: 'Omzet Konsolidasi',
			value: 'Rp 8.450.000',
			trend: '+18.4%',
			trendLabel: 'dibanding kemarin',
			icon: '💰',
			subDetail: 'QRIS: 74% • Tunai: 26% • 3 Outlet Aktif',
			sparklinePoints: '0,20 15,16 30,12 45,15 60,8 75,10 90,4'
		},
		{
			id: 'cups',
			title: 'Total Cup Terjual',
			value: '412 Cup',
			trend: '+12.5%',
			trendLabel: 'dibanding kemarin',
			icon: '☕',
			subDetail: 'AOV: Rp 38.400 • Void: 1 trx • Dine-in: 65%',
			sparklinePoints: '0,22 15,19 30,15 45,14 60,11 75,7 90,3'
		},
		{
			id: 'warning',
			title: 'Peringatan Bahan Baku',
			value: '2 Bahan Kritis',
			isWarning: true,
			warningLabel: 'Perlu Reorder',
			warningItems: 'Fresh Milk & Matcha',
			icon: '⚠️',
			subDetail: 'Di bawah buffer minimum outlet'
		},
		{
			id: 'gross-profit',
			title: 'Gross Profit Margin',
			value: '68.2%',
			trend: '+2.1%',
			trendLabel: 'dibanding kemarin',
			hasPendingInvoice: true,
			statusBadge: 'Estimasi · 1 nota belum masuk',
			icon: '📈',
			subDetail: 'Laba kotor Rp 5.762.900 • HPP True-Up saat nota diverifikasi',
			sparklinePoints: '0,18 15,15 30,17 45,13 60,10 75,8 90,5'
		}
	];

	// 2. Urgent Action Items (PRD 8.1 Card 1 & 8.3)
	const actionItems = [
		{
			id: 'act-1',
			type: 'APPROVAL',
			title: 'Pengajuan Kas Kecil Melebihi Batas Bebas',
			desc: 'Penggantian Seal Karet Steam Wand Senopati (Rp 350.000) butuh persetujuan Owner.',
			actionUrl: '/approvals',
			actionLabel: 'Tinjau Persetujuan',
			badge: 'Persetujuan Tertunda',
			badgeColor: 'warning'
		},
		{
			id: 'act-2',
			type: 'INVOICE_INPUT',
			title: 'Penerimaan Menunggu Nota Supplier (True-Up)',
			desc: 'Fresh Milk 80L tiba di Senopati (RCV-JKT-01-20261012-01). Menunggu Store Manager input foto nota.',
			actionUrl: '/procurement',
			actionLabel: 'Buka Penerimaan',
			badge: 'Menunggu Nota (1 hari)',
			badgeColor: 'danger'
		},
		{
			id: 'act-3',
			type: 'INVOICE_VERIFY',
			title: 'Nota Supplier Siap Diverifikasi Finance',
			desc: 'INV-GYO-202610-088 Green Beans 30kg. Selisih hemat -Rp 150.000 siap rekonsiliasi.',
			actionUrl: '/finance',
			actionLabel: 'Verifikasi & True-Up',
			badge: 'Verifikasi Finance',
			badgeColor: 'info'
		},
		{
			id: 'act-4',
			type: 'BILL_DUE',
			title: 'Tagihan Jatuh Tempo Dalam 5 Hari',
			desc: 'CV Kemasan Nusantara Packaging (Rp 1.250.000) jatuh tempo 18 Oktober 2026.',
			actionUrl: '/procurement',
			actionLabel: 'Proses Pembayaran',
			badge: 'Jatuh Tempo Dekat',
			badgeColor: 'warning'
		}
	];

	// 3. Recent Transactions (POS Stream Ingestion - 6 rows matching screenshot)
	const recentTransactions = [
		{
			id: 'TRX-JKT-01-20261013-0042',
			items: '2x Hanjo Aren Latte (Iced), 1x Croissant',
			outlet: 'Senopati Flagship',
			time: '14:28',
			total: 73500,
			status: 'Selesai'
		},
		{
			id: 'TRX-BSD-01-20261013-0028',
			items: '1x Americano (Iced), 1x Aren Latte',
			outlet: 'Cabang BSD (GOP 9)',
			time: '14:15',
			total: 46200,
			status: 'Selesai'
		},
		{
			id: 'TRX-KMG-01-20261013-0019',
			items: '1x Kyoto Matcha Latte, Less Sugar',
			outlet: 'Cabang Kemang (Mitra)',
			time: '14:02',
			total: 29400,
			status: 'Selesai'
		},
		{
			id: 'TRX-JKT-01-20261013-0041',
			items: '3x Hanjo Aren Latte + Extra Shot',
			outlet: 'Senopati Flagship',
			time: '13:48',
			total: 99225,
			status: 'Selesai'
		},
		{
			id: 'TRX-JKT-01-20261013-0040',
			items: '1x Spanish Latte, 1x Triple Chocolate',
			outlet: 'Senopati Flagship',
			time: '13:32',
			total: 62000,
			status: 'Selesai'
		},
		{
			id: 'TRX-BSD-01-20261013-0027',
			items: '2x Classic Latte, 1x Almond Croissant',
			outlet: 'Cabang BSD (GOP 9)',
			time: '13:10',
			total: 88000,
			status: 'Selesai'
		}
	];

	// 4. Low Stock Items with Progress Bars (Persis seperti Desain Sebelumnya)
	const lowStockItems = [
		{
			name: 'Fresh Milk Greenfield',
			outletLabel: 'Senopati Flagship',
			icon: '🥛',
			current: '18.2 L',
			min: '20 L',
			reorder: '40 L',
			percentage: 45.5,
			status: 'Perlu Reorder',
			severity: 'danger',
			estDays: '1.5 hari'
		},
		{
			name: 'Pure Uji Matcha Powder',
			outletLabel: 'Pusat & Senopati',
			icon: '🍵',
			current: '120 g',
			min: '150 g',
			reorder: '300 g',
			percentage: 40.0,
			status: 'Perlu Reorder',
			severity: 'danger',
			estDays: '2.0 hari'
		},
		{
			name: 'House Blend Espresso Beans',
			outletLabel: 'Seluruh Outlet',
			icon: '🫘',
			current: '24.5 kg',
			min: '10 kg',
			reorder: '35 kg',
			percentage: 70.0,
			status: 'Stok Aman',
			severity: 'success',
			estDays: '5.2 hari'
		}
	];

	// 5. Multi-Outlet Comparison Table (PRD 8.1 Card 2)
	const outletComparisons = [
		{
			id: 'out-1',
			name: 'Senopati Flagship',
			ownerType: 'Milik Sendiri',
			omzet: 4820000,
			cups: 238,
			cogs: 1494200,
			expenses: 285000,
			netGross: 3040800,
			marginPct: 69.0,
			syncStatus: 'ONLINE',
			lastSync: '2 menit lalu'
		},
		{
			id: 'out-2',
			name: 'Cabang BSD (GOP 9)',
			ownerType: 'Milik Sendiri',
			omzet: 2430000,
			cups: 122,
			cogs: 777600,
			expenses: 165000,
			netGross: 1487400,
			marginPct: 68.0,
			syncStatus: 'ONLINE',
			lastSync: '4 menit lalu'
		},
		{
			id: 'out-3',
			name: 'Cabang Kemang',
			ownerType: 'Mitra Franchise',
			omzet: 1200000,
			cups: 52,
			cogs: 408000,
			expenses: 95000,
			netGross: 697000,
			marginPct: 65.5,
			syncStatus: 'ONLINE',
			lastSync: '7 menit lalu'
		}
	];
</script>

<svelte:head>
	<title>Executive Dashboard ERP | HANJO</title>
</svelte:head>

<div class="dashboard-container">
	<!-- Top Greeting & Decorative Coffee Banner Row -->
	<header class="top-banner-row">
		<div class="greeting-block">
			<span class="greeting-badge">Selamat datang kembali, BP Budi Pratama (Owner & Finance) ☕</span>
			<h1 class="page-title">Ringkasan Performa Hari Ini</h1>
			<p class="page-subtitle">
				Pantau penjualan kasir POS, HPP True-Up, peringatan stok bahan baku, dan operasional toko secara real-time.
			</p>
		</div>

		<!-- Decorative Coffee Hero Card (Gambar di kanan full, kiri transparan fade ke background) -->
		<div class="coffee-hero-card">
			<div class="hero-bg-overlay"></div>
			<img src="/coffee-banner.jpg" alt="Good Coffee Better Days" class="hero-image" />
			<div class="hero-text-content">
				<span class="hero-script-tag">Good Coffee Better Days</span>
			</div>
		</div>
	</header>

	<!-- 4 Primary KPI Metrics Row with Sparklines -->
	<section class="kpi-grid">
		{#each kpiStats as stat}
			<div class="kpi-card panel-card" class:highlight-card={stat.id === 'omzet'}>
				<div class="kpi-top">
					<div class="kpi-icon-wrap">
						<span>{stat.icon}</span>
					</div>
					<div class="kpi-info">
						<span class="kpi-title">{stat.title}</span>
						<h2 class="kpi-value">{stat.value}</h2>
					</div>
				</div>

				<div class="kpi-bottom">
					{#if stat.isWarning}
						<div class="kpi-warning-row">
							<span class="pill-badge pill-danger">{stat.warningLabel}</span>
							<span class="kpi-sub-text">{stat.warningItems}</span>
						</div>
					{:else if stat.statusBadge}
						<div class="kpi-warning-row">
							<span class="pill-badge pill-warning">{stat.statusBadge}</span>
							<span class="kpi-sub-text">{stat.trend}</span>
						</div>
					{:else}
						<div class="kpi-trend-row">
							<span class="kpi-trend-badge">
								<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
									<polyline points="18 15 12 9 6 15" />
								</svg>
								{stat.trend}
							</span>
							<span class="kpi-sub-text">{stat.trendLabel}</span>
						</div>

						<!-- Sparkline Mini SVG -->
						<svg class="sparkline-svg" viewBox="0 0 90 25">
							<polyline
								fill="none"
								stroke="#10b981"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								points={stat.sparklinePoints}
							/>
						</svg>
					{/if}
				</div>

				<div class="kpi-detail-footer">
					<small class="kpi-footer-text">{stat.subDetail}</small>
				</div>
			</div>
		{/each}
	</section>

	<!-- Main 3-Column Split Content Layout (Tinggi seimbang persis seperti screenshot) -->
	<div class="content-split-layout">
		<!-- Left Sub-Sidebar (Vertical Navigation Tabs, Promo Card, & POS Sync) -->
		<aside class="left-subnav">
			<!-- Subnav Navigation Tabs -->
			<div class="subnav-tabs panel-card">
				<button
					class="subnav-btn"
					class:active={activeSubTab === 'transaksi'}
					onclick={() => (activeSubTab = 'transaksi')}
				>
					<span class="subnav-icon">🏪</span>
					<span>Transaksi POS</span>
				</button>

				<button
					class="subnav-btn"
					class:active={activeSubTab === 'tindakan'}
					onclick={() => (activeSubTab = 'tindakan')}
				>
					<span class="subnav-icon">⚡</span>
					<span>Perlu Tindakan</span>
					<span class="tab-badge">4</span>
				</button>

				<button
					class="subnav-btn"
					class:active={activeSubTab === 'outlet'}
					onclick={() => (activeSubTab = 'outlet')}
				>
					<span class="subnav-icon">🏢</span>
					<span>Kinerja Outlet</span>
				</button>

				<button
					class="subnav-btn"
					class:active={activeSubTab === 'semua'}
					onclick={() => (activeSubTab = 'semua')}
				>
					<span class="subnav-icon">📊</span>
					<span>Semua Ringkasan</span>
				</button>
			</div>

			<!-- Promotional Inventory Card with Coffee Image -->
			<div class="promo-card panel-card">
				<div class="promo-thumb-wrap">
					<img src="/stock-promo.jpg" alt="Kelola Stok Lebih Mudah" class="promo-thumb" />
					<div class="promo-thumb-overlay"></div>
				</div>
				<div class="promo-body">
					<h3 class="promo-title">Kelola Stok Lebih Mudah</h3>
					<p class="promo-desc">Gunakan fitur inventaris untuk kontrol bahan baku secara real-time.</p>
					<a href="/inventory" class="promo-link">
						<span>Pelajari lebih lanjut</span>
						<span>→</span>
					</a>
				</div>
			</div>

			<!-- Quick POS Ingestion Health Monitor Card -->
			<div class="sync-health-card panel-card">
				<div class="sync-health-header">
					<span class="health-pulse"></span>
					<strong>POS Sales Ingest</strong>
				</div>
				<p class="sync-health-desc">3 dari 3 outlet terhubung aktif streaming struk via HTTP Idempotent.</p>
				<a href="/sales" class="sync-link">Audit Struk POS →</a>
			</div>
		</aside>

		<!-- Middle Column: Transaksi POS / Tindakan Mendesak / Outlet Kinerja -->
		<section class="middle-col">
			<!-- 1. Transaksi POS Terbaru (Default view persis seperti media_1791850387795.png) -->
			{#if activeSubTab === 'transaksi' || activeSubTab === 'semua'}
				<div class="section-box panel-card">
					<div class="section-card-header">
						<div class="header-left">
							<div class="header-icon-circle">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
							</div>
							<div>
								<h2 class="section-card-title">Transaksi POS Terbaru</h2>
								<p class="section-card-sub">10 transaksi terakhir dari seluruh outlet</p>
							</div>
						</div>

						<a href="/sales" class="card-action-link">
							<span>Lihat Semua</span>
							<span>→</span>
						</a>
					</div>

					<!-- Transactions Table List -->
					<div class="trx-table-wrap">
						<table class="trx-table">
							<thead>
								<tr>
									<th class="th-icon"></th>
									<th>No. Transaksi</th>
									<th>Menu / Item</th>
									<th>Waktu</th>
									<th>Total</th>
									<th>Status</th>
									<th class="th-action"></th>
								</tr>
							</thead>
							<tbody>
								{#each recentTransactions as trx}
									<tr class="trx-row">
										<td class="td-icon">
											<div class="trx-doc-icon">
												<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
													<polyline points="14 2 14 8 20 8" />
												</svg>
											</div>
										</td>
										<td class="td-trx-id">
											<span class="trx-id-str">{trx.id}</span>
											<span class="outlet-sub-text">{trx.outlet}</span>
										</td>
										<td class="td-items">
											<span class="trx-items-str">{trx.items}</span>
										</td>
										<td class="td-time">
											<span>{trx.time}</span>
										</td>
										<td class="td-total">
											<strong class="trx-total-val">{formatRupiah(trx.total)}</strong>
										</td>
										<td class="td-status">
											<span class="pill-badge pill-success">{trx.status}</span>
										</td>
										<td class="td-action">
											<button class="more-btn" title="Detail Transaksi" aria-label="Detail Transaksi">
												<span>⋮</span>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- 2. Perlu Tindakan Mendesak (Action Items - PRD 8.1 Card 1) -->
			{#if activeSubTab === 'tindakan' || activeSubTab === 'semua'}
				<div class="section-box panel-card" class:mt-card={activeSubTab === 'semua'}>
					<div class="section-card-header">
						<div class="header-left">
							<div class="header-icon-circle warning">
								<span>⚡</span>
							</div>
							<div>
								<h2 class="section-card-title">Perlu Tindakan Mendesak</h2>
								<p class="section-card-sub">Daftar persetujuan, input nota, dan verifikasi tagihan yang membutuhkan aksi pusat & outlet</p>
							</div>
						</div>
						<span class="pill-badge pill-danger">4 Menunggu Aksi</span>
					</div>

					<div class="actions-list">
						{#each actionItems as act}
							<div class="action-item-row panel-subcard">
								<div class="action-info">
									<div class="action-badge-row">
										<span class="pill-badge pill-{act.badgeColor}">{act.badge}</span>
										<strong class="action-title">{act.title}</strong>
									</div>
									<p class="action-desc">{act.desc}</p>
								</div>
								<div class="action-btn-wrap">
									<a href={act.actionUrl} class="btn btn-secondary btn-sm">
										{act.actionLabel}
									</a>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 3. Perbandingan Kinerja Outlet -->
			{#if activeSubTab === 'outlet' || activeSubTab === 'semua'}
				<div class="section-box panel-card" class:mt-card={activeSubTab === 'semua'}>
					<div class="section-card-header">
						<div class="header-left">
							<div class="header-icon-circle info">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3l3-2 3 2v4H9V3z" />
								</svg>
							</div>
							<div>
								<h2 class="section-card-title">Perbandingan Kinerja Outlet</h2>
								<p class="section-card-sub">Konsolidasi omzet, HPP sementara/riil, biaya outlet, dan margin per unit bisnis</p>
							</div>
						</div>

						<a href="/outlets" class="card-action-link">
							<span>Kelola Master Outlet →</span>
						</a>
					</div>

					<div class="trx-table-wrap">
						<table class="trx-table">
							<thead>
								<tr>
									<th>Outlet</th>
									<th>Kepemilikan</th>
									<th class="text-right">Omzet Hari Ini</th>
									<th class="text-right">Cup</th>
									<th class="text-right">HPP Bahan</th>
									<th class="text-right">Laba Kotor</th>
									<th class="text-right">Margin %</th>
									<th>Sinkronisasi</th>
								</tr>
							</thead>
							<tbody>
								{#each outletComparisons as out}
									<tr class="trx-row">
										<td><strong>{out.name}</strong></td>
										<td>
											<span class="pill-badge" class:pill-success={out.ownerType === 'Milik Sendiri'} class:pill-info={out.ownerType !== 'Milik Sendiri'}>
												{out.ownerType}
											</span>
										</td>
										<td class="text-right font-bold text-amber">{formatRupiah(out.omzet)}</td>
										<td class="text-right">{out.cups}</td>
										<td class="text-right text-muted">{formatRupiah(out.cogs)}</td>
										<td class="text-right font-bold text-emerald">{formatRupiah(out.netGross)}</td>
										<td class="text-right font-bold">{out.marginPct}%</td>
										<td>
											<span class="sync-tag">
												<span class="sync-dot"></span>
												{out.lastSync}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</section>

		<!-- Right Column: Performa Penjualan (Graphic Curve) & Stok Bahan (Progress Bars!) -->
		<aside class="right-col">
			<!-- 1. Performa Penjualan (Kurva Grafik SVG Halus & Bercahaya) -->
			<div class="chart-card panel-card">
				<div class="section-card-header">
					<div class="header-left">
						<span class="header-emoji-icon">📊</span>
						<div>
							<h2 class="section-card-title">Performa Penjualan</h2>
							<p class="section-card-sub">Tren omzet 7 hari terakhir</p>
						</div>
					</div>
					<div class="dropdown-filter-btn">
						<span>{chartTimeRange}</span>
						<span class="dd-arrow">▾</span>
					</div>
				</div>

				<!-- Sales Curve SVG Chart dengan Area Glow & Tooltip Hari Puncak -->
				<div class="chart-wrapper">
					<div class="y-axis-labels">
						<span>10 jt</span>
						<span>7,5 jt</span>
						<span>5 jt</span>
						<span>2,5 jt</span>
						<span>0</span>
					</div>

					<div class="chart-plot-area">
						<!-- Grid Lines -->
						<div class="grid-line" style="top: 0%"></div>
						<div class="grid-line" style="top: 25%"></div>
						<div class="grid-line" style="top: 50%"></div>
						<div class="grid-line" style="top: 75%"></div>
						<div class="grid-line" style="top: 100%"></div>

						<!-- Line Chart SVG dengan Gradien Amber Warm Coffee -->
						<svg class="line-chart-svg" viewBox="0 0 320 120" preserveAspectRatio="none">
							<defs>
								<linearGradient id="salesGlowGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.45" />
									<stop offset="85%" stop-color="#f59e0b" stop-opacity="0.05" />
									<stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0" />
								</linearGradient>
							</defs>

							<!-- Area fill below curve -->
							<polygon
								fill="url(#salesGlowGradient)"
								points="15,85 60,65 105,72 150,68 195,70 240,42 285,32 285,120 15,120"
							/>

							<!-- Glowing Main Curve Line -->
							<polyline
								fill="none"
								stroke="#f59e0b"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
								points="15,85 60,65 105,72 150,68 195,70 240,42 285,32"
							/>

							<!-- Data points markers -->
							<circle cx="15" cy="85" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
							<circle cx="60" cy="65" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
							<circle cx="105" cy="72" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
							<circle cx="150" cy="68" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
							<circle cx="195" cy="70" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
							<circle cx="240" cy="42" r="5.5" fill="#fbbf24" stroke="#ffffff" stroke-width="2.5" />
							<circle cx="285" cy="32" r="4" fill="#f59e0b" stroke="var(--bg-panel)" stroke-width="2" />
						</svg>

						<!-- Tooltip on peak day (Sab, 11 Okt: Rp 8.450.000) -->
						<div class="chart-tooltip" style="left: 75%; top: 10%;">
							<span class="tt-date">Sab, 11 Okt</span>
							<strong class="tt-val">Rp 8.450.000</strong>
						</div>
					</div>
				</div>

				<!-- X-Axis Days -->
				<div class="x-axis-days">
					<span>Sen<br><small>06 Okt</small></span>
					<span>Sel<br><small>07 Okt</small></span>
					<span>Rab<br><small>08 Okt</small></span>
					<span>Kam<br><small>09 Okt</small></span>
					<span>Jum<br><small>10 Okt</small></span>
					<span class="active-day">Sab<br><small>11 Okt</small></span>
					<span>Min<br><small>12 Okt</small></span>
				</div>
			</div>

			<!-- 2. Peringatan Stok & Bahan Baku Card (Lengkap dengan Progress Bars!) -->
			<div class="stock-warning-card panel-card">
				<div class="section-card-header">
					<div class="header-left">
						<span class="header-emoji-icon">📦</span>
						<div>
							<h2 class="section-card-title">Peringatan Stok & Bahan Baku</h2>
							<p class="section-card-sub">Monitoring batas buffer minimum outlet</p>
						</div>
					</div>
					<a href="/inventory" class="card-action-link">
						<span>Lihat Semua</span>
						<span>→</span>
					</a>
				</div>

				<div class="stock-items-list">
					{#each lowStockItems as item}
						<div class="stock-item-row panel-subcard">
							<div class="item-icon-box">
								<span>{item.icon}</span>
							</div>

							<div class="item-content-col">
								<!-- Header: Name + Badge on Left, Stats on Right -->
								<div class="item-top-row">
									<div class="item-name-wrap">
										<strong class="item-name">{item.name}</strong>
										<span class="pill-badge pill-{item.severity}">{item.status}</span>
									</div>
									<div class="item-stock-qty">
										<strong class="curr-qty" class:danger={item.severity === 'danger'}>{item.current} tersisa</strong>
										<span class="reorder-target">Reorder: {item.reorder}</span>
									</div>
								</div>

								<!-- Sub-bar row: Min threshold and Progress Bar Track -->
								<div class="item-min-row">
									<span class="min-threshold">Min: {item.min}</span>
									<span class="lead-estimate">{item.outletLabel} • Est: {item.estDays}</span>
								</div>

								<!-- Prominent Progress Bar Track & Fill -->
								<div class="progress-bar-container">
									<div class="progress-track">
										<div
											class="progress-fill {item.severity}"
											style="width: {item.percentage}%"
										></div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Quick Reorder Button (Persis tombol di bawah kartu pada screenshot) -->
				<a href="/procurement" class="reorder-action-card">
					<div class="reorder-btn-content">
						<span class="reorder-icon">📋</span>
						<span class="reorder-text">Kelola Pengadaan & Reorder Stok</span>
					</div>
					<span class="reorder-chevron">></span>
				</a>
			</div>
		</aside>
	</div>

	<!-- Page Bottom Footer Status -->
	<footer class="dashboard-footer">
		<span class="footer-version">HANJO F&B ERP + POS · v1.0.0</span>
		<span class="footer-status">
			<span class="status-pulse-dot"></span>
			Sistem berjalan normal · 3 Outlet Terhubung
		</span>
	</footer>
</div>

<style>
	.dashboard-container {
		display: flex;
		flex-direction: column;
		gap: 18px;
		width: 100%;
		max-width: 100%;
		margin: 0;
	}

	/* Top Banner Row */
	.top-banner-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	.greeting-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.greeting-badge {
		font-size: 13px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.page-title {
		font-size: 24px;
		font-weight: 800;
		letter-spacing: -0.5px;
		color: var(--text-main);
	}

	.page-subtitle {
		font-size: 13px;
		color: var(--text-muted);
	}

	/* Decorative Coffee Banner Card */
	.coffee-hero-card {
		position: relative;
		width: 380px;
		height: 84px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border-panel);
		box-shadow: var(--shadow-card);
		flex-shrink: 0;
	}

	.hero-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 85% center;
		filter: brightness(0.88) contrast(1.05);
	}

	.hero-bg-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, var(--bg-body) 0%, rgba(11, 14, 20, 0.4) 40%, transparent 100%);
		z-index: 1;
	}

	:global([data-theme='light']) .hero-bg-overlay {
		background: linear-gradient(90deg, #f8fafc 0%, rgba(248, 250, 252, 0.4) 40%, transparent 100%);
	}

	.hero-text-content {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 14px 20px;
	}

	.hero-script-tag {
		font-family: 'Caveat', cursive, sans-serif;
		font-size: 22px;
		font-weight: 700;
		color: #fef3c7;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
		letter-spacing: 0.5px;
	}

	:global([data-theme='light']) .hero-script-tag {
		color: #ffffff;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
	}

	/* 4 KPI Cards Grid */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.kpi-card {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 122px;
		position: relative;
	}

	.highlight-card {
		border-color: #f59e0b;
		box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
	}

	:global([data-theme='dark']) .highlight-card {
		border-color: rgba(245, 158, 11, 0.5);
	}

	.kpi-top {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.kpi-icon-wrap {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		flex-shrink: 0;
	}

	.kpi-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.kpi-title {
		font-size: 12px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.kpi-value {
		font-size: 20px;
		font-weight: 800;
		color: var(--text-main);
		line-height: 1.2;
	}

	.kpi-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 10px;
		padding-top: 6px;
	}

	.kpi-trend-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
	}

	.kpi-trend-badge {
		color: #10b981;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.kpi-sub-text {
		color: var(--text-subtle);
		font-size: 11px;
	}

	.kpi-warning-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sparkline-svg {
		width: 70px;
		height: 20px;
	}

	.kpi-detail-footer {
		margin-top: 8px;
		padding-top: 6px;
		border-top: 1px dashed var(--border-panel);
	}

	.kpi-footer-text {
		font-size: 10.5px;
		color: var(--text-subtle);
	}

	/* Content Split Layout (3 Columns) */
	.content-split-layout {
		display: grid;
		grid-template-columns: 210px 1fr 340px;
		gap: 16px;
		align-items: start;
	}

	/* Left Sub-Sidebar */
	.left-subnav {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.subnav-tabs {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.subnav-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		transition: all 0.15s;
		text-align: left;
		width: 100%;
		position: relative;
	}

	.subnav-btn:hover {
		background: var(--bg-panel-hover);
		color: var(--text-main);
	}

	/* Warm Amber highlight matching previous design */
	.subnav-btn.active {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.35);
	}

	:global([data-theme='light']) .subnav-btn.active {
		background: #fffbeb;
		color: #b45309;
		border: 1px solid #fde68a;
	}

	.subnav-icon {
		font-size: 14px;
	}

	.tab-badge {
		margin-left: auto;
		background: var(--pill-danger-bg);
		color: var(--pill-danger-text);
		border: 1px solid var(--pill-danger-border);
		font-size: 10px;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: var(--radius-full);
	}

	/* Promo Inventory Card */
	.promo-card {
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.promo-thumb-wrap {
		position: relative;
		height: 105px;
		width: 100%;
	}

	.promo-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.promo-thumb-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 0%, var(--bg-panel) 100%);
	}

	.promo-body {
		padding: 12px 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.promo-title {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-main);
	}

	.promo-desc {
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.35;
	}

	.promo-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11.5px;
		font-weight: 700;
		color: #f59e0b;
		margin-top: 4px;
		transition: transform 0.15s;
	}

	:global([data-theme='light']) .promo-link {
		color: #b45309;
	}

	.promo-link:hover {
		transform: translateX(2px);
	}

	/* Sync Health Card */
	.sync-health-card {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.sync-health-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-main);
	}

	.health-pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 6px #10b981;
	}

	.sync-health-desc {
		font-size: 11px;
		color: var(--text-subtle);
		line-height: 1.35;
	}

	.sync-link {
		font-size: 11px;
		color: #f59e0b;
		font-weight: 600;
		margin-top: 2px;
	}

	:global([data-theme='light']) .sync-link {
		color: #b45309;
	}

	/* Middle Column */
	.middle-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-box {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.mt-card {
		margin-top: 14px;
	}

	.section-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.header-icon-circle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 15px;
	}

	:global([data-theme='light']) .header-icon-circle {
		background: #fffbeb;
		color: #b45309;
		border: 1px solid #fde68a;
	}

	.header-icon-circle.warning {
		background: var(--pill-warning-bg);
		color: var(--pill-warning-text);
		border: 1px solid var(--pill-warning-border);
	}

	.header-icon-circle.info {
		background: var(--pill-info-bg);
		color: var(--pill-info-text);
		border: 1px solid var(--pill-info-border);
	}

	.header-emoji-icon {
		font-size: 16px;
	}

	.section-card-title {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-main);
	}

	.section-card-sub {
		font-size: 11.5px;
		color: var(--text-subtle);
	}

	.card-action-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 600;
		color: #f59e0b;
		transition: transform 0.15s;
	}

	:global([data-theme='light']) .card-action-link {
		color: #b45309;
	}

	.card-action-link:hover {
		transform: translateX(2px);
	}

	/* Action Items List */
	.actions-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.action-item-row {
		padding: 12px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
	}

	.action-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.action-badge-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-title {
		font-size: 12.5px;
		color: var(--text-main);
	}

	.action-desc {
		font-size: 11.5px;
		color: var(--text-muted);
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 11.5px;
		white-space: nowrap;
	}

	/* Transactions Table */
	.trx-table-wrap {
		overflow-x: auto;
	}

	.trx-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
		text-align: left;
	}

	.trx-table th {
		padding: 10px 12px;
		color: var(--text-subtle);
		font-weight: 600;
		border-bottom: 1px solid var(--border-panel);
		font-size: 11px;
	}

	.trx-row {
		border-bottom: 1px solid var(--border-panel);
		transition: background 0.15s;
	}

	.trx-row:hover {
		background: var(--bg-panel-hover);
	}

	.trx-row td {
		padding: 12px 10px;
		vertical-align: middle;
	}

	.td-icon {
		width: 32px;
	}

	.trx-doc-icon {
		width: 26px;
		height: 26px;
		border-radius: 6px;
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.trx-id-str {
		font-weight: 700;
		color: var(--text-main);
		font-family: monospace;
		font-size: 11.5px;
		display: block;
	}

	.outlet-sub-text {
		font-size: 10.5px;
		color: var(--text-subtle);
		display: block;
	}

	.trx-items-str {
		color: var(--text-muted);
		max-width: 380px;
		display: inline-block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.td-time {
		color: var(--text-subtle);
		font-size: 11.5px;
	}

	.trx-total-val {
		color: #f59e0b;
		font-weight: 700;
		font-size: 12.5px;
	}

	:global([data-theme='light']) .trx-total-val {
		color: #b45309;
	}

	.td-action {
		width: 28px;
		text-align: center;
	}

	.more-btn {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		color: var(--text-muted);
		font-size: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.more-btn:hover {
		background: var(--bg-panel-hover);
		color: var(--text-main);
	}

	.text-right {
		text-align: right;
	}

	.font-bold {
		font-weight: 700;
	}

	.text-muted {
		color: var(--text-muted);
	}

	.text-amber {
		color: #f59e0b;
	}

	:global([data-theme='light']) .text-amber {
		color: #b45309;
	}

	.text-emerald {
		color: #10b981;
	}

	:global([data-theme='light']) .text-emerald {
		color: #059669;
	}

	.sync-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-muted);
	}

	.sync-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #10b981;
	}

	/* Right Column */
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.chart-card,
	.stock-warning-card {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.dropdown-filter-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		cursor: pointer;
	}

	.dd-arrow {
		font-size: 9px;
	}

	/* Sales Chart Layout */
	.chart-wrapper {
		display: flex;
		gap: 8px;
		height: 130px;
	}

	.y-axis-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-size: 9.5px;
		color: var(--text-subtle);
		text-align: right;
		width: 32px;
		padding-bottom: 6px;
	}

	.chart-plot-area {
		position: relative;
		flex: 1;
		height: 100%;
	}

	.grid-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border-panel);
	}

	.line-chart-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.chart-tooltip {
		position: absolute;
		background: var(--bg-panel);
		border: 1px solid #f59e0b;
		padding: 4px 8px;
		border-radius: 6px;
		box-shadow: var(--shadow-card);
		display: flex;
		flex-direction: column;
		pointer-events: none;
		transform: translate(-50%, -100%);
		z-index: 10;
	}

	.tt-date {
		font-size: 9.5px;
		color: var(--text-muted);
	}

	.tt-val {
		font-size: 11px;
		color: #f59e0b;
		font-weight: 700;
	}

	:global([data-theme='light']) .tt-val {
		color: #b45309;
	}

	.x-axis-days {
		display: flex;
		justify-content: space-between;
		padding-left: 38px;
		font-size: 10px;
		color: var(--text-subtle);
		text-align: center;
		line-height: 1.15;
	}

	.active-day {
		color: #f59e0b;
		font-weight: 700;
	}

	:global([data-theme='light']) .active-day {
		color: #b45309;
	}

	/* Stock Warnings List with Prominent Progress Bars */
	.stock-items-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stock-item-row {
		padding: 12px 14px;
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.item-icon-box {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.item-content-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.item-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.item-name-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.item-name {
		font-size: 12.5px;
		color: var(--text-main);
	}

	.item-stock-qty {
		text-align: right;
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}

	.curr-qty {
		font-size: 12px;
		color: var(--text-main);
	}

	.curr-qty.danger {
		color: #fb7185;
	}

	:global([data-theme='light']) .curr-qty.danger {
		color: #dc2626;
	}

	.reorder-target {
		font-size: 10px;
		color: var(--text-subtle);
	}

	.item-min-row {
		display: flex;
		justify-content: space-between;
		font-size: 10.5px;
		color: var(--text-muted);
	}

	.min-threshold {
		font-weight: 500;
	}

	.lead-estimate {
		color: var(--text-subtle);
		font-size: 10px;
	}

	/* Progress Bar Container & Track */
	.progress-bar-container {
		width: 100%;
		padding-top: 2px;
	}

	.progress-track {
		width: 100%;
		height: 7px;
		background-color: var(--progress-track);
		border-radius: var(--radius-full);
		overflow: hidden;
		border: 1px solid var(--border-panel);
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 0.4s ease;
	}

	.progress-fill.danger {
		background: linear-gradient(90deg, #f43f5e 0%, #fb7185 100%);
	}

	.progress-fill.success {
		background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
	}

	/* Quick Reorder Action Card */
	.reorder-action-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		border-radius: var(--radius-md);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		color: var(--text-main);
		font-size: 12px;
		font-weight: 600;
		transition: all 0.15s;
		margin-top: 2px;
	}

	.reorder-action-card:hover {
		border-color: #f59e0b;
		background: var(--bg-panel-hover);
		color: #f59e0b;
	}

	:global([data-theme='light']) .reorder-action-card:hover {
		border-color: #d97706;
		color: #b45309;
	}

	.reorder-btn-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.reorder-icon {
		font-size: 14px;
	}

	.reorder-chevron {
		font-weight: 700;
		color: var(--text-subtle);
	}

	/* Footer Status Bar */
	.dashboard-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 8px;
		border-top: 1px solid var(--border-panel);
		font-size: 11px;
		color: var(--text-subtle);
		margin-top: 4px;
	}

	.footer-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.status-pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 6px #10b981;
	}

	@media (max-width: 1280px) {
		.content-split-layout {
			grid-template-columns: 1fr;
		}
		.kpi-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
