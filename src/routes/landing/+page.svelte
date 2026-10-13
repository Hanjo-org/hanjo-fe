<script lang="ts">
	import { formatRupiah } from '#lib/api/client';

	// Category filter for menu
	let activeCategory = $state('all');
	let menuSearchQuery = $state('');
	let showQrModal = $state(false);
	let selectedMenuItem = $state<any>(null);
	let showCmsDrawer = $state(false);
	let cmsSaveSuccess = $state(false);

	// CMS-managed content state
	let announcementText = $state('🔥 Promo Spesial Minggu Ini: Diskon 30% First Order & Bundle Sore Rp 35.000 di Semua Outlet!');
	let announcementActive = $state(true);

	let activePromos = $state([
		{
			id: 1,
			title: 'First Cup Welcome Discount',
			badge: 'DISKON 30%',
			discountType: 'percentage',
			code: 'HANJO30',
			desc: 'Dapatkan potongan 30% untuk pemesanan cangkir pertama Anda melalui website atau QR Kasir di outlet.',
			validUntil: '31 Oktober 2026',
			tagColor: 'orange',
			highlight: 'Hemat hingga Rp 15.000'
		},
		{
			id: 2,
			title: 'Bundle Ngopi Sore (14:00 - 18:00)',
			badge: 'HEMAT RP 11.200',
			discountType: 'bundle',
			code: 'SOREHEMAT',
			desc: 'Nikmati pairing favorit Hanjo Aren Latte (Iced) + Fresh French Butter Croissant hanya seharga Rp 35.000.',
			validUntil: 'Setiap Hari',
			tagColor: 'green',
			highlight: 'Hanya Rp 35.000'
		},
		{
			id: 3,
			title: 'Free Upsize Friday',
			badge: 'UPGRADE GRATIS',
			discountType: 'upsize',
			code: 'TGIFUPSIZE',
			desc: 'Beli minuman ukuran Regular apa saja, otomatis upgrade ke ukuran Large tanpa biaya tambahan setiap hari Jumat.',
			validUntil: 'Setiap Jumat',
			tagColor: 'purple',
			highlight: 'Gratis Large Size'
		}
	]);

	// Menu catalog
	const menuCatalog = [
		{
			id: 'm-1',
			name: 'Hanjo Aren Latte (Iced)',
			category: 'coffee',
			price: 28000,
			badge: 'Signature',
			tag: 'Best Seller',
			image: '☕',
			desc: 'Espresso double shot ristretto, susu segar creamy, dan pemanis gula aren organik Cilacap dengan aroma karamel smoky.'
		},
		{
			id: 'm-2',
			name: 'Americano Double Shot',
			category: 'coffee',
			price: 22000,
			badge: 'Classic',
			tag: '',
			image: '🧊',
			desc: 'Ekstraksi espresso murni dari biji kopi Gayo Honey Process dengan sentuhan rasa fruity, floral, dan clean aftertaste.'
		},
		{
			id: 'm-3',
			name: 'Spanish Latte Velvet',
			category: 'coffee',
			price: 32000,
			badge: 'Popular',
			tag: '',
			image: '🥛',
			desc: 'Kombinasi espresso kental, fresh milk, dan sweet condensed milk premium dengan tekstur selembut sutra.'
		},
		{
			id: 'm-4',
			name: 'Kyoto Ceremonial Matcha Latte',
			category: 'non-coffee',
			price: 35000,
			badge: 'Premium',
			tag: 'Top Non-Coffee',
			image: '🍵',
			desc: '100% bubuk matcha murni first-harvest impor dari Uji, Kyoto. Karakteristik umami kental, manis alami, dan seimbang.'
		},
		{
			id: 'm-5',
			name: 'Belgian Dark Chocolate (70%)',
			category: 'non-coffee',
			price: 30000,
			badge: 'Decadent',
			tag: '',
			image: '🍫',
			desc: 'Cokelat hitam Belgia murni dipadu steamed whole milk. Sensasi rasa kaya, creamy, dan tidak terlalu manis.'
		},
		{
			id: 'm-6',
			name: 'Golden Earl Grey Artisan Tea',
			category: 'non-coffee',
			price: 24000,
			badge: 'Organic',
			tag: '',
			image: '🫖',
			desc: 'Teh hitam bergamot organik dari kebun teh Ciwidey, disajikan hangat atau dingin dengan irisan lemon segar.'
		},
		{
			id: 'm-7',
			name: 'French Butter Croissant',
			category: 'pastry',
			price: 18000,
			badge: 'Fresh Bake',
			tag: 'Best Pairing',
			image: '🥐',
			desc: 'Pastry klasik Prancis dengan lipatan mentega Elle & Vire murni. Luar renyah berlapis, dalam lembut dan harum.'
		},
		{
			id: 'm-8',
			name: 'Almond Chocolate Pain',
			category: 'pastry',
			price: 24000,
			badge: 'Fresh Bake',
			tag: '',
			image: '🥖',
			desc: 'Croissant renyah dengan isian cokelat couverture leleh dan taburan kacang almond panggang renyah berlimpah.'
		},
		{
			id: 'm-9',
			name: 'Single Origin V60 Filter Brew',
			category: 'manual-brew',
			price: 34000,
			badge: 'Artisanal',
			tag: 'Barista Choice',
			image: '⚗️',
			desc: 'Seduhan manual slow-drip dengan pilihan beans mikro-lot: Aceh Gayo, Flores Bajawa, atau Gunung Halu Jawa Barat.'
		}
	];

	// Outlet data
	let outlets = $state([
		{
			id: 'senopati',
			name: 'Outlet Pusat (Senopati Flagship)',
			address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190',
			hours: 'Senin - Minggu: 07:00 - 22:00 WIB',
			status: 'Buka Sekarang',
			phone: '+62 812-9988-7766',
			mapsUrl: 'https://maps.google.com/?q=Senopati+Jakarta+Selatan',
			facilities: ['WiFi 100 Mbps', 'Stopkontak Tiap Meja', 'Area Smoking & Outdoor', 'Parkir Luas', 'Musholla'],
			highlight: 'Flagship Store & Roastery Bar'
		},
		{
			id: 'bsd',
			name: 'Cabang BSD (GOP 9 Eco Hub)',
			address: 'Green Office Park 9, Ground Floor Lobby B, BSD City, Tangerang 15345',
			hours: 'Senin - Sabtu: 08:00 - 20:00 WIB (Minggu Libur)',
			status: 'Buka Sekarang',
			phone: '+62 813-1122-3344',
			mapsUrl: 'https://maps.google.com/?q=Green+Office+Park+9+BSD',
			facilities: ['Workspace Friendly', 'High-Speed WiFi', 'Outdoor Garden View', 'QR Table Ordering'],
			highlight: 'Co-Working & Creative Space'
		}
	]);

	// Filtered menu
	let filteredMenu = $derived(
		menuCatalog.filter((item) => {
			const matchCategory = activeCategory === 'all' || item.category === activeCategory;
			const matchQuery =
				!menuSearchQuery.trim() ||
				item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
				item.desc.toLowerCase().includes(menuSearchQuery.toLowerCase());
			return matchCategory && matchQuery;
		})
	);

	function openQrModal(item: any) {
		selectedMenuItem = item;
		showQrModal = true;
	}

	function saveCmsChanges() {
		cmsSaveSuccess = true;
		setTimeout(() => {
			cmsSaveSuccess = false;
			showCmsDrawer = false;
		}, 1500);
	}
</script>

<svelte:head>
	<title>HANJO Coffee & Roastery | Rasa Otentik, Biji Kopi Nusantara Pilihan</title>
	<meta name="description" content="Kunjungi HANJO Coffee di Senopati & BSD. Nikmati specialty coffee, matcha ceremonial, French pastry, promo harian, dan pemesanan praktis via QR Kasir." />
	<meta property="og:title" content="HANJO Coffee & Roastery" />
	<meta property="og:description" content="Artisanal Coffee & Crafted Treats dari Biji Kopi Pilihan Nusantara." />
</svelte:head>

<div class="landing-page-wrap">
	<!-- Top Manager Bar / CMS Switch -->
	<aside class="manager-switch-bar">
		<div class="container bar-inner">
			<div class="manager-status">
				<span class="status-indicator"></span>
				<span>Mode Publik Pelanggan (Website Fase 2 Omni)</span>
			</div>
			<div class="manager-controls">
				<button class="cms-toggle-btn" onclick={() => (showCmsDrawer = !showCmsDrawer)}>
					<span>⚙️ Kelola Konten & Promo (CMS)</span>
				</button>
				<a href="/" class="erp-return-link">
					<span>← Kembali ke ERP Dashboard</span>
				</a>
			</div>
		</div>
	</aside>

	<!-- Live Announcement Banner (CMS Managed) -->
	{#if announcementActive && announcementText}
		<div class="live-announcement-banner">
			<div class="container announcement-content">
				<span class="announcement-badge">PENGUMUMAN</span>
				<p class="announcement-p">{announcementText}</p>
				<a href="#promo-section" class="announcement-cta">Lihat Detail →</a>
			</div>
		</div>
	{/if}

	<!-- Customer Navigation Header -->
	<header class="site-header">
		<div class="container header-container">
			<a href="#hero" class="site-logo">
				<div class="logo-emblem">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 8h1a4 4 0 0 1 0 8h-1" />
						<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
						<line x1="6" y1="1" x2="6" y2="4" />
						<line x1="10" y1="1" x2="10" y2="4" />
						<line x1="14" y1="1" x2="14" y2="4" />
					</svg>
				</div>
				<div class="logo-name-col">
					<span class="logo-title">HANJO</span>
					<span class="logo-sub">Coffee & Roastery</span>
				</div>
			</a>

			<nav class="site-nav">
				<a href="#story" class="site-nav-link">Cerita Kami</a>
				<a href="#promo-section" class="site-nav-link">Promo & Diskon</a>
				<a href="#menu-section" class="site-nav-link">Katalog Menu</a>
				<a href="#outlets-section" class="site-nav-link">Lokasi Outlet</a>
				<a href="#contact-section" class="site-nav-link">Kontak</a>
			</nav>

			<div class="header-actions">
				<a href="https://wa.me/6281299887766?text=Halo%20HANJO,%20saya%20mau%20tanya%20menu%20dan%20reservasi" target="_blank" rel="noopener" class="btn btn-whatsapp-header">
					<span>💬 WhatsApp</span>
				</a>
				<a href="#menu-section" class="btn btn-primary btn-order-header">
					<span>Pesan / QR</span>
				</a>
			</div>
		</div>
	</header>

	<!-- MODULE 1: Hero & Brand Profile -->
	<section id="hero" class="hero-section">
		<div class="hero-background-image">
			<img src="/cafe-interior.jpg" alt="HANJO Coffee Interior" class="hero-img-element" />
			<div class="hero-dark-overlay"></div>
		</div>

		<div class="container hero-content-container">
			<div class="hero-badge-pill">
				<span class="sparkle-icon">✨</span>
				<span>Specialty Grade Arabica • Fresh Roasted Daily</span>
			</div>

			<h1 class="hero-heading">
				Cerita Rasa di <span class="gradient-text">Setiap Seduhan.</span>
			</h1>

			<p class="hero-subtitle">
				Dari biji kopi pilihan petani Nusantara hingga cangkir harian Anda. Diseduh dengan presisi oleh barista tersertifikasi di Senopati Flagship & BSD GOP 9.
			</p>

			<div class="hero-cta-buttons">
				<a href="#menu-section" class="btn btn-primary btn-lg">
					<span>Lihat Menu & Promo</span>
					<span>→</span>
				</a>
				<a href="#outlets-section" class="btn btn-secondary btn-lg">
					<span>📍 Kunjungi Outlet Kami</span>
				</a>
			</div>

			<!-- Quick Key Stats -->
			<div class="hero-stats-row">
				<div class="stat-box panel-card">
					<strong class="stat-number">2</strong>
					<span class="stat-label">Outlet Aktif di Jabodetabek</span>
				</div>
				<div class="stat-box panel-card">
					<strong class="stat-number">100%</strong>
					<span class="stat-label">Single Origin & Specialty Blend</span>
				</div>
				<div class="stat-box panel-card">
					<strong class="stat-number">4.9 ★</strong>
					<span class="stat-label">Rating Kepuasan Pelanggan</span>
				</div>
				<div class="stat-box panel-card">
					<strong class="stat-number">15K+</strong>
					<span class="stat-label">Cangkir Terjual Tiap Bulan</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Brand Story & Philosophy Section -->
	<section id="story" class="brand-story-section">
		<div class="container story-grid">
			<div class="story-image-column">
				<div class="story-image-frame panel-card">
					<img src="/stock-promo.jpg" alt="Biji Kopi Hanjo" class="story-img" />
					<div class="story-floating-badge panel-subcard">
						<span class="floating-icon">☕</span>
						<div>
							<strong>Direct-Trade Beans</strong>
							<p>Bermitra langsung dengan petani di Gayo & Toraja</p>
						</div>
					</div>
				</div>
			</div>

			<div class="story-text-column">
				<span class="section-tag">IDENTITAS BRAND KAMI</span>
				<h2 class="section-title">Dedikasi Pada Kualitas, Kehangatan Pada Komunitas</h2>
				<p class="story-p">
					HANJO lahir dari kecintaan mendalam pada kekayaan kopi Indonesia. Kami percaya bahwa secangkir kopi terbaik bukan hanya soal kafein, tapi tentang momen berharga untuk memulai hari, berdiskusi dengan rekan, atau menikmati waktu santai.
				</p>
				<p class="story-p">
					Setiap gram biji kopi dipanggang secara cermat dengan profil roasting optimal untuk mengeluarkan aroma manis karamel alami, keasaman seimbang, dan body yang memikat.
				</p>

				<div class="values-list">
					<div class="value-item">
						<span class="value-icon">🌱</span>
						<div>
							<strong>Bahan Baku Terkurasi</strong>
							<p>Gula aren organik murni tanpa pengawet dan susu segar kualitas utama.</p>
						</div>
					</div>
					<div class="value-item">
						<span class="value-icon">🥐</span>
						<div>
							<strong>Fresh Bake Pastry</strong>
							<p>Dipanggang segar setiap pagi langsung di dapur outlet Senopati.</p>
						</div>
					</div>
					<div class="value-item">
						<span class="value-icon">⚡</span>
						<div>
							<strong>Pemesanan Terintegrasi Omni POS</strong>
							<p>Pesan di meja dengan Scan QR atau langsung di kasir tanpa antre lama.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- MODULE 2: Info Promo & Diskon -->
	<section id="promo-section" class="promo-section">
		<div class="container">
			<div class="section-header-center">
				<span class="section-tag">PENASARAN DENGAN PENAWARAN TERBAIK?</span>
				<h2 class="section-title">Promo & Diskon Eksklusif Hari Ini</h2>
				<p class="section-desc">Gunakan kode voucher saat berkunjung ke outlet atau scan QR di meja kasir kami.</p>
			</div>

			<div class="promo-cards-grid">
				{#each activePromos as promo}
					<div class="promo-card-item panel-card">
						<div class="promo-card-top">
							<span class="pill-badge pill-live">{promo.badge}</span>
							<span class="promo-highlight-badge">{promo.highlight}</span>
						</div>

						<h3 class="promo-item-title">{promo.title}</h3>
						<p class="promo-item-desc">{promo.desc}</p>

						<div class="promo-coupon-box panel-subcard">
							<div class="code-info">
								<span class="code-label">KODE VOUCHER</span>
								<strong class="code-string">{promo.code}</strong>
							</div>
							<button class="copy-code-btn" onclick={() => alert(`Kode ${promo.code} berhasil disalin!`)}>
								Salin
							</button>
						</div>

						<div class="promo-card-footer">
							<span class="validity-text">📅 Berlaku: {promo.validUntil}</span>
							<a href="#outlets-section" class="claim-promo-link">Klaim di Outlet →</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- MODULE 3: Katalog Menu -->
	<section id="menu-section" class="menu-section">
		<div class="container">
			<div class="section-header-center">
				<span class="section-tag">DAFTAR MENU LENGKAP DENGAN HARGA</span>
				<h2 class="section-title">Katalog Menu Favorit HANJO</h2>
				<p class="section-desc">Pilihan kopi terbaik, artisanal matcha, dan pastry renyah siap menemani hari Anda.</p>
			</div>

			<!-- Filter Category Pills & Search -->
			<div class="menu-toolbar panel-card">
				<div class="category-pills-row">
					<button
						class="cat-pill"
						class:active={activeCategory === 'all'}
						onclick={() => (activeCategory = 'all')}
					>
						Semua Menu
					</button>
					<button
						class="cat-pill"
						class:active={activeCategory === 'coffee'}
						onclick={() => (activeCategory = 'coffee')}
					>
						☕ Espresso & Kopi
					</button>
					<button
						class="cat-pill"
						class:active={activeCategory === 'non-coffee'}
						onclick={() => (activeCategory = 'non-coffee')}
					>
						🍵 Non-Coffee & Matcha
					</button>
					<button
						class="cat-pill"
						class:active={activeCategory === 'pastry'}
						onclick={() => (activeCategory = 'pastry')}
					>
						🥐 Pastry & Bakery
					</button>
					<button
						class="cat-pill"
						class:active={activeCategory === 'manual-brew'}
						onclick={() => (activeCategory = 'manual-brew')}
					>
						⚗️ Manual Filter Brew
					</button>
				</div>

				<div class="menu-search-wrap">
					<svg class="search-mini-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						class="menu-search-input"
						placeholder="Cari menu (misal: Aren, Matcha, Croissant)..."
						bind:value={menuSearchQuery}
					/>
				</div>
			</div>

			<!-- Menu Items Grid -->
			<div class="menu-items-grid">
				{#each filteredMenu as item}
					<div class="menu-item-card panel-card">
						<div class="menu-item-header">
							<div class="item-visual-box">
								<span class="item-emoji">{item.image}</span>
							</div>
							<div class="item-tags-wrap">
								{#if item.tag}
									<span class="pill-badge pill-live">{item.tag}</span>
								{/if}
								<span class="pill-badge pill-warning">{item.badge}</span>
							</div>
						</div>

						<div class="menu-item-body">
							<h3 class="menu-item-name">{item.name}</h3>
							<p class="menu-item-tasting-notes">{item.desc}</p>
						</div>

						<div class="menu-item-footer">
							<div class="price-block">
								<span class="price-label">Harga</span>
								<strong class="price-val">{formatRupiah(item.price)}</strong>
							</div>
							<button class="btn btn-secondary btn-sm btn-qr" onclick={() => openQrModal(item)}>
								<span>📱 Scan & Pesan</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- MODULE 4: Lokasi & Jam Buka Outlet -->
	<section id="outlets-section" class="outlets-section">
		<div class="container">
			<div class="section-header-center">
				<span class="section-tag">TEMUKAN KAMI DEKAT ANDA</span>
				<h2 class="section-title">Lokasi & Jam Operasional Outlet</h2>
				<p class="section-desc">Nikmati suasana hangat, internet kencang, dan tempat duduk nyaman untuk santai maupun bekerja.</p>
			</div>

			<div class="outlets-grid">
				{#each outlets as outlet}
					<div class="outlet-card panel-card">
						<div class="outlet-card-top">
							<div>
								<span class="pill-badge pill-success">{outlet.status}</span>
								<h3 class="outlet-title">{outlet.name}</h3>
								<span class="outlet-highlight-text">✨ {outlet.highlight}</span>
							</div>
						</div>

						<div class="outlet-details-list">
							<div class="detail-row">
								<span class="detail-icon">📍</span>
								<div class="detail-text">
									<strong>Alamat:</strong>
									<p>{outlet.address}</p>
								</div>
							</div>

							<div class="detail-row">
								<span class="detail-icon">⏰</span>
								<div class="detail-text">
									<strong>Jam Buka:</strong>
									<p>{outlet.hours}</p>
								</div>
							</div>

							<div class="detail-row">
								<span class="detail-icon">📞</span>
								<div class="detail-text">
									<strong>Kontak Outlet:</strong>
									<p>{outlet.phone}</p>
								</div>
							</div>
						</div>

						<!-- Facilities Chips -->
						<div class="facilities-wrap">
							<span class="facilities-label">Fasilitas Tersedia:</span>
							<div class="chips-flex">
								{#each outlet.facilities as fac}
									<span class="facility-chip">{fac}</span>
								{/each}
							</div>
						</div>

						<div class="outlet-card-actions">
							<a href={outlet.mapsUrl} target="_blank" rel="noopener" class="btn btn-primary btn-maps">
								<span>🗺️ Buka di Google Maps</span>
								<span>↗</span>
							</a>
							<a href={`https://wa.me/${outlet.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(outlet.name)},%20saya%20mau%20reservasi%20meja`} target="_blank" rel="noopener" class="btn btn-secondary btn-wa-outlet">
								<span>Hubungi Kasir</span>
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- MODULE 5: Kontak & Media Sosial -->
	<section id="contact-section" class="contact-section">
		<div class="container contact-container panel-card">
			<div class="contact-left">
				<span class="section-tag">HUBUNGI KAMI DENGAN SATU SENTUHAN</span>
				<h2 class="contact-title">Punya Pertanyaan, Saran, atau Ingin Kerjasama?</h2>
				<p class="contact-p">
					Tim kami siap melayani pesanan katering kantor, reservasi tempat untuk komunitas, maupun feedback seputar rasa dan pelayanan di outlet.
				</p>

				<div class="contact-quick-links">
					<a href="https://wa.me/6281299887766?text=Halo%20HANJO%20Customer%20Care,%20saya%20ingin%20bertanya" target="_blank" rel="noopener" class="quick-contact-pill wa">
						<span class="pill-icon">💬</span>
						<div>
							<strong>Chat WhatsApp Resmi</strong>
							<small>Respons cepat dalam 5 menit</small>
						</div>
					</a>

					<a href="https://instagram.com/hanjo.coffee" target="_blank" rel="noopener" class="quick-contact-pill ig">
						<span class="pill-icon">📸</span>
						<div>
							<strong>Instagram @hanjo.coffee</strong>
							<small>Update event, promo, dan menu baru</small>
						</div>
					</a>

					<a href="mailto:hello@hanjocoffee.com" class="quick-contact-pill email">
						<span class="pill-icon">✉️</span>
						<div>
							<strong>Email: hello@hanjocoffee.com</strong>
							<small>Kemitraan & Corporate Catering</small>
						</div>
					</a>
				</div>
			</div>

			<div class="contact-right panel-subcard">
				<h3 class="form-title">Tinggalkan Pesan untuk Manajer</h3>
				<form class="inquiry-form" onsubmit={(e) => { e.preventDefault(); alert('Terima kasih! Pesan Anda telah diterima oleh Manajer Operasional.'); }}>
					<div class="form-group">
						<label for="contact-name">Nama Lengkap</label>
						<input id="contact-name" type="text" placeholder="Masukkan nama Anda" required />
					</div>
					<div class="form-group">
						<label for="contact-phone">Nomor WhatsApp</label>
						<input id="contact-phone" type="tel" placeholder="Contoh: 08123456789" required />
					</div>
					<div class="form-group">
						<label for="contact-outlet">Pilih Outlet</label>
						<select id="contact-outlet">
							<option>Outlet Pusat (Senopati Flagship)</option>
							<option>Cabang BSD (GOP 9)</option>
							<option>Pertanyaan Umum / Kemitraan</option>
						</select>
					</div>
					<div class="form-group">
						<label for="contact-message">Pesan / Masukan</label>
						<textarea id="contact-message" rows="3" placeholder="Tuliskan pesan atau saran Anda..."></textarea>
					</div>
					<button type="submit" class="btn btn-primary btn-block">
						<span>Kirim Pesan Sekarang</span>
						<span>→</span>
					</button>
				</form>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="site-footer">
		<div class="container footer-content">
			<div class="footer-col-brand">
				<div class="footer-logo">
					<div class="logo-emblem">☕</div>
					<span class="logo-title">HANJO</span>
				</div>
				<p class="footer-bio">
					Artisanal Coffee & Crafted Treats. Sistem omnichannel cerdas menghubungkan pelanggan langsung dengan operasional outlet.
				</p>
				<span class="copyright-str">© 2026 HANJO Coffee Indonesia. All rights reserved.</span>
			</div>

			<div class="footer-col-nav">
				<h4>Navigasi</h4>
				<a href="#hero">Beranda</a>
				<a href="#story">Cerita Brand</a>
				<a href="#promo-section">Promo Berjalan</a>
				<a href="#menu-section">Katalog Menu</a>
				<a href="#outlets-section">Outlet & Peta</a>
			</div>

			<div class="footer-col-nav">
				<h4>Sistem Internal</h4>
				<a href="/">ERP Dashboard</a>
				<a href="/pos">Kasir POS</a>
				<a href="/catalog">Katalog & Resep BOM</a>
				<a href="/inventory">Inventaris Bahan</a>
				<a href="/outlets">Manajemen Cabang</a>
			</div>
		</div>
	</footer>
</div>

<!-- Modal: QR Code Order Simulation -->
{#if showQrModal && selectedMenuItem}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		aria-label="Tutup Modal QR"
		onclick={() => (showQrModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showQrModal = false)}
	>
		<div
			class="qr-modal panel-card"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (showQrModal = false)}
		>
			<div class="qr-modal-head">
				<div class="qr-item-info">
					<span class="qr-item-icon">{selectedMenuItem.image}</span>
					<div>
						<h3 class="qr-item-title">{selectedMenuItem.name}</h3>
						<span class="qr-item-price">{formatRupiah(selectedMenuItem.price)}</span>
					</div>
				</div>
				<button class="close-qr-btn" onclick={() => (showQrModal = false)}>✕</button>
			</div>

			<div class="qr-code-body">
				<div class="qr-code-visual">
					<!-- Simulated QR Pattern -->
					<div class="qr-svg-wrap">
						<svg viewBox="0 0 100 100" width="160" height="160">
							<rect x="0" y="0" width="100" height="100" fill="#ffffff" rx="8" />
							<rect x="10" y="10" width="25" height="25" fill="#111620" />
							<rect x="15" y="15" width="15" height="15" fill="#ffffff" />
							<rect x="18" y="18" width="9" height="9" fill="#10b981" />
							<rect x="65" y="10" width="25" height="25" fill="#111620" />
							<rect x="70" y="15" width="15" height="15" fill="#ffffff" />
							<rect x="73" y="18" width="9" height="9" fill="#10b981" />
							<rect x="10" y="65" width="25" height="25" fill="#111620" />
							<rect x="15" y="70" width="15" height="15" fill="#ffffff" />
							<rect x="18" y="73" width="9" height="9" fill="#10b981" />
							<!-- Code dots -->
							<circle cx="45" cy="20" r="3" fill="#111620" />
							<circle cx="55" cy="25" r="3" fill="#111620" />
							<circle cx="45" cy="45" r="4" fill="#10b981" />
							<circle cx="55" cy="55" r="3" fill="#111620" />
							<circle cx="25" cy="50" r="3" fill="#111620" />
							<circle cx="75" cy="50" r="3" fill="#111620" />
							<circle cx="50" cy="75" r="3" fill="#111620" />
							<circle cx="65" cy="80" r="4" fill="#111620" />
							<circle cx="80" cy="80" r="3" fill="#10b981" />
						</svg>
					</div>
				</div>

				<div class="qr-instructions">
					<p class="qr-scan-guide">
						Arahkan kamera smartphone Anda ke QR Code untuk pesan langsung di meja atau buka struk di Kasir POS.
					</p>
					<span class="pill-badge pill-success">Terkoneksi Otomatis ke Kasir POS</span>
				</div>
			</div>

			<div class="qr-modal-actions">
				<a href={`/pos`} class="btn btn-primary btn-block">
					<span>Buka di Kasir POS (Simulasi Kasir)</span>
					<span>→</span>
				</a>
			</div>
		</div>
	</div>
{/if}

<!-- MODULE 6: Self-Managed Content (CMS Drawer) -->
{#if showCmsDrawer}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		aria-label="Tutup Pengelola CMS"
		onclick={() => (showCmsDrawer = false)}
		onkeydown={(e) => e.key === 'Escape' && (showCmsDrawer = false)}
	>
		<div
			class="cms-drawer panel-card"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (showCmsDrawer = false)}
		>
			<div class="cms-drawer-head">
				<div>
					<span class="pill-badge pill-warning">KONTEN DIKELOLA SENDIRI (CMS)</span>
					<h3 class="cms-title">Editor Banner & Promo Real-Time</h3>
				</div>
				<button class="close-cms-btn" onclick={() => (showCmsDrawer = false)}>✕</button>
			</div>

			<div class="cms-drawer-body">
				{#if cmsSaveSuccess}
					<div class="cms-toast panel-card">
						<span>✅ Perubahan berhasil disimpan dan langsung tayang di Landing Page!</span>
					</div>
				{/if}

				<!-- Announcement Editor -->
				<div class="cms-field-group panel-subcard">
					<div class="group-header">
						<label for="cms-banner-text" class="field-title">Pengumuman Teks Berjalan di Atas</label>
						<input type="checkbox" bind:checked={announcementActive} id="toggle-announce" />
					</div>
					<textarea
						id="cms-banner-text"
						class="cms-input"
						rows="3"
						bind:value={announcementText}
						placeholder="Tuliskan banner pengumuman..."
					></textarea>
				</div>

				<!-- Promo 1 Editor -->
				<div class="cms-field-group panel-subcard">
					<label for="cms-promo1-title" class="field-title">Promo 1 (Hero Promo Card)</label>
					<input
						id="cms-promo1-title"
						type="text"
						class="cms-input"
						bind:value={activePromos[0].title}
						placeholder="Judul Promo"
					/>
					<input
						type="text"
						class="cms-input"
						bind:value={activePromos[0].badge}
						placeholder="Badge (cth: DISKON 30%)"
					/>
					<textarea
						class="cms-input"
						rows="2"
						bind:value={activePromos[0].desc}
						placeholder="Deskripsi promo..."
					></textarea>
					<input
						type="text"
						class="cms-input"
						bind:value={activePromos[0].code}
						placeholder="Kode Voucher"
					/>
				</div>

				<!-- Promo 2 Editor -->
				<div class="cms-field-group panel-subcard">
					<label for="cms-promo2-title" class="field-title">Promo 2 (Bundle Sore)</label>
					<input
						id="cms-promo2-title"
						type="text"
						class="cms-input"
						bind:value={activePromos[1].title}
						placeholder="Judul Promo"
					/>
					<input
						type="text"
						class="cms-input"
						bind:value={activePromos[1].badge}
						placeholder="Badge (cth: HEMAT RP 11.200)"
					/>
					<textarea
						class="cms-input"
						rows="2"
						bind:value={activePromos[1].desc}
						placeholder="Deskripsi..."
					></textarea>
				</div>
			</div>

			<div class="cms-drawer-foot">
				<button class="btn btn-secondary" onclick={() => (showCmsDrawer = false)}>Batal</button>
				<button class="btn btn-primary" onclick={saveCmsChanges}>
					<span>Simpan & Tayangkan Langsung</span>
					<span>✓</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Overall Landing Styles */
	.landing-page-wrap {
		background-color: var(--bg-body);
		color: var(--text-main);
		font-family: var(--font-body);
		min-height: 100vh;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* Manager Switch Bar */
	.manager-switch-bar {
		background-color: #080a0f;
		border-bottom: 1px solid var(--border-panel);
		font-size: 11.5px;
		padding: 8px 0;
	}

	.bar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.manager-status {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-muted);
	}

	.status-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 8px #10b981;
	}

	.manager-controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.cms-toggle-btn {
		background: var(--brand-primary-dim);
		color: var(--brand-primary-light);
		border: 1px solid var(--brand-primary);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		font-size: 11.5px;
		font-weight: 600;
		transition: all 0.15s;
	}

	.cms-toggle-btn:hover {
		background: var(--brand-primary);
		color: #ffffff;
	}

	.erp-return-link {
		color: var(--text-muted);
		text-decoration: underline;
		font-size: 11px;
	}

	.erp-return-link:hover {
		color: var(--text-main);
	}

	/* Live Announcement Banner */
	.live-announcement-banner {
		background: linear-gradient(90deg, #ea580c 0%, #b45309 100%);
		color: #ffffff;
		padding: 10px 0;
		font-size: 13px;
	}

	.announcement-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.announcement-badge {
		background: rgba(0, 0, 0, 0.3);
		padding: 2px 8px;
		border-radius: var(--radius-full);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.5px;
	}

	.announcement-p {
		flex: 1;
		font-weight: 600;
	}

	.announcement-cta {
		color: #ffffff;
		font-weight: 700;
		text-decoration: underline;
		font-size: 12px;
		white-space: nowrap;
	}

	/* Site Header */
	.site-header {
		background-color: rgba(17, 22, 32, 0.9);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-panel);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 70px;
	}

	.site-logo {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-emblem {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		box-shadow: 0 4px 12px var(--brand-primary-glow);
	}

	.logo-name-col {
		display: flex;
		flex-direction: column;
	}

	.logo-title {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 0.5px;
		color: var(--text-main);
		line-height: 1;
	}

	.logo-sub {
		font-size: 10.5px;
		font-weight: 600;
		color: var(--brand-primary);
		letter-spacing: 0.5px;
	}

	.site-nav {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.site-nav-link {
		color: var(--text-muted);
		font-size: 14px;
		font-weight: 500;
		transition: color 0.15s;
	}

	.site-nav-link:hover {
		color: var(--brand-primary);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.btn-whatsapp-header {
		background: rgba(37, 211, 102, 0.15);
		color: #25d366;
		border: 1px solid rgba(37, 211, 102, 0.35);
		padding: 8px 14px;
		font-size: 12.5px;
	}

	.btn-whatsapp-header:hover {
		background: rgba(37, 211, 102, 0.25);
	}

	.btn-order-header {
		padding: 8px 16px;
		font-size: 12.5px;
	}

	/* Hero Section */
	.hero-section {
		position: relative;
		min-height: 580px;
		display: flex;
		align-items: center;
		overflow: hidden;
		padding: 80px 0 60px;
	}

	.hero-background-image {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.hero-img-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.hero-dark-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(11, 14, 20, 0.82) 0%, rgba(11, 14, 20, 0.95) 100%);
	}

	.hero-content-container {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 820px;
	}

	.hero-badge-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		border-radius: var(--radius-full);
		background: var(--brand-primary-dim);
		border: 1px solid var(--brand-primary);
		color: var(--brand-primary-light);
		font-size: 12px;
		font-weight: 700;
		margin-bottom: 20px;
	}

	.hero-heading {
		font-size: 48px;
		font-weight: 800;
		line-height: 1.15;
		margin-bottom: 16px;
		color: var(--text-main);
	}

	.gradient-text {
		background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.hero-subtitle {
		font-size: 17px;
		color: var(--text-muted);
		line-height: 1.6;
		margin-bottom: 32px;
		max-width: 680px;
	}

	.hero-cta-buttons {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 48px;
	}

	.btn-lg {
		padding: 12px 24px;
		font-size: 14.5px;
	}

	.hero-stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		width: 100%;
	}

	.stat-box {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgba(17, 22, 32, 0.8);
		backdrop-filter: blur(8px);
	}

	.stat-number {
		font-size: 24px;
		font-weight: 800;
		color: var(--brand-primary);
		font-family: var(--font-heading);
	}

	.stat-label {
		font-size: 11.5px;
		color: var(--text-subtle);
	}

	/* Section Commons */
	.section-tag {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1.2px;
		color: var(--brand-primary);
		text-transform: uppercase;
		display: inline-block;
		margin-bottom: 8px;
	}

	.section-title {
		font-size: 32px;
		font-weight: 800;
		color: var(--text-main);
		margin-bottom: 8px;
		line-height: 1.25;
	}

	.section-desc {
		font-size: 15px;
		color: var(--text-muted);
		max-width: 600px;
	}

	.section-header-center {
		text-align: center;
		margin-bottom: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* Brand Story */
	.brand-story-section {
		padding: 80px 0;
		border-top: 1px solid var(--border-panel);
	}

	.story-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 50px;
		align-items: center;
	}

	.story-image-frame {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-xl);
	}

	.story-img {
		width: 100%;
		height: 380px;
		object-fit: cover;
		display: block;
	}

	.story-floating-badge {
		position: absolute;
		bottom: 20px;
		left: 20px;
		right: 20px;
		padding: 14px 18px;
		display: flex;
		align-items: center;
		gap: 12px;
		background: rgba(17, 22, 32, 0.92);
		backdrop-filter: blur(8px);
	}

	.floating-icon {
		font-size: 24px;
	}

	.story-floating-badge strong {
		font-size: 13px;
		color: var(--brand-primary);
		display: block;
	}

	.story-floating-badge p {
		font-size: 11.5px;
		color: var(--text-muted);
	}

	.story-text-column {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.story-p {
		font-size: 15px;
		color: var(--text-muted);
		line-height: 1.6;
	}

	.values-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 12px;
	}

	.value-item {
		display: flex;
		gap: 14px;
		align-items: flex-start;
	}

	.value-icon {
		font-size: 22px;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.value-item strong {
		font-size: 14px;
		color: var(--text-main);
	}

	.value-item p {
		font-size: 13px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	/* Promo Section */
	.promo-section {
		padding: 80px 0;
		background: #0d1118;
		border-top: 1px solid var(--border-panel);
	}

	.promo-cards-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.promo-card-item {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		transition: transform 0.2s, border-color 0.2s;
	}

	.promo-card-item:hover {
		transform: translateY(-4px);
		border-color: var(--brand-primary);
	}

	.promo-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.promo-highlight-badge {
		font-size: 11.5px;
		font-weight: 700;
		color: var(--brand-primary);
	}

	.promo-item-title {
		font-size: 17px;
		font-weight: 700;
		color: var(--text-main);
	}

	.promo-item-desc {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.5;
		flex: 1;
	}

	.promo-coupon-box {
		padding: 10px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 4px;
	}

	.code-info {
		display: flex;
		flex-direction: column;
	}

	.code-label {
		font-size: 9.5px;
		color: var(--text-subtle);
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.code-string {
		font-family: 'Courier New', Courier, monospace;
		font-size: 14px;
		color: #f59e0b;
		letter-spacing: 1px;
	}

	.copy-code-btn {
		font-size: 11px;
		font-weight: 700;
		color: var(--brand-primary-light);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		background: var(--brand-primary-dim);
		border: 1px solid var(--brand-primary);
		transition: background 0.15s;
	}

	.copy-code-btn:hover {
		background: var(--brand-primary);
		color: #ffffff;
	}

	.promo-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 10px;
		border-top: 1px solid var(--border-subtle);
		font-size: 11.5px;
	}

	.validity-text {
		color: var(--text-subtle);
	}

	.claim-promo-link {
		color: var(--brand-primary);
		font-weight: 700;
	}

	/* Menu Section */
	.menu-section {
		padding: 80px 0;
		border-top: 1px solid var(--border-panel);
	}

	.menu-toolbar {
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.category-pills-row {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
	}

	.cat-pill {
		padding: 8px 14px;
		border-radius: var(--radius-full);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		white-space: nowrap;
		transition: all 0.15s;
	}

	.cat-pill:hover {
		color: var(--text-main);
		border-color: var(--brand-primary);
	}

	.cat-pill.active {
		background: var(--brand-primary);
		color: #000;
		border-color: var(--brand-primary);
		font-weight: 700;
	}

	.menu-search-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-input);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-md);
		padding: 6px 12px;
		min-width: 260px;
	}

	.search-mini-icon {
		color: var(--text-subtle);
	}

	.menu-search-input {
		background: none;
		border: none;
		outline: none;
		color: var(--text-main);
		font-size: 12.5px;
		width: 100%;
	}

	.menu-items-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.menu-item-card {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: transform 0.2s, border-color 0.2s;
	}

	.menu-item-card:hover {
		transform: translateY(-3px);
		border-color: var(--brand-primary);
	}

	.menu-item-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.item-visual-box {
		width: 50px;
		height: 50px;
		border-radius: var(--radius-md);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26px;
	}

	.item-tags-wrap {
		display: flex;
		gap: 6px;
	}

	.menu-item-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.menu-item-name {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-main);
	}

	.menu-item-tasting-notes {
		font-size: 12.5px;
		color: var(--text-muted);
		line-height: 1.45;
	}

	.menu-item-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
	}

	.price-block {
		display: flex;
		flex-direction: column;
	}

	.price-label {
		font-size: 10px;
		color: var(--text-subtle);
		font-weight: 600;
	}

	.price-val {
		font-size: 17px;
		font-weight: 800;
		color: #f59e0b;
	}

	.btn-qr {
		font-size: 11.5px;
		padding: 6px 12px;
	}

	/* Outlets Section */
	.outlets-section {
		padding: 80px 0;
		background: #0d1118;
		border-top: 1px solid var(--border-panel);
	}

	.outlets-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px;
	}

	.outlet-card {
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.outlet-title {
		font-size: 20px;
		font-weight: 800;
		color: var(--text-main);
		margin-top: 6px;
	}

	.outlet-highlight-text {
		font-size: 12px;
		color: var(--brand-primary);
		font-weight: 600;
	}

	.outlet-details-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.detail-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.detail-icon {
		font-size: 18px;
		line-height: 1.2;
	}

	.detail-text strong {
		font-size: 12.5px;
		color: var(--text-main);
	}

	.detail-text p {
		font-size: 13px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.facilities-wrap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.facilities-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.chips-flex {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.facility-chip {
		font-size: 11.5px;
		color: var(--text-muted);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		padding: 4px 10px;
		border-radius: var(--radius-full);
	}

	.outlet-card-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 6px;
	}

	.btn-maps {
		flex: 1;
	}

	.btn-wa-outlet {
		font-size: 12.5px;
	}

	/* Contact Section */
	.contact-section {
		padding: 80px 0;
		border-top: 1px solid var(--border-panel);
	}

	.contact-container {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 40px;
		padding: 40px;
	}

	.contact-title {
		font-size: 28px;
		font-weight: 800;
		line-height: 1.25;
		margin-bottom: 12px;
	}

	.contact-p {
		font-size: 14.5px;
		color: var(--text-muted);
		line-height: 1.6;
		margin-bottom: 24px;
	}

	.contact-quick-links {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.quick-contact-pill {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		border-radius: var(--radius-md);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		transition: all 0.15s;
	}

	.quick-contact-pill:hover {
		border-color: var(--brand-primary);
		transform: translateX(4px);
	}

	.quick-contact-pill strong {
		font-size: 13.5px;
		color: var(--text-main);
		display: block;
	}

	.quick-contact-pill small {
		font-size: 11.5px;
		color: var(--text-subtle);
	}

	.pill-icon {
		font-size: 22px;
	}

	.contact-right {
		padding: 24px;
	}

	.form-title {
		font-size: 16px;
		font-weight: 700;
		margin-bottom: 16px;
		color: var(--text-main);
	}

	.inquiry-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-size: 11.5px;
		color: var(--text-muted);
		font-weight: 600;
	}

	.form-group input, .form-group select, .form-group textarea {
		background: var(--bg-input);
		border: 1px solid var(--border-panel);
		color: var(--text-main);
		padding: 9px 12px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-family: inherit;
		outline: none;
	}

	.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
		border-color: var(--brand-primary);
	}

	.btn-block {
		width: 100%;
	}

	/* Footer */
	.site-footer {
		background-color: #07090e;
		border-top: 1px solid var(--border-panel);
		padding: 60px 0 40px;
	}

	.footer-content {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 40px;
	}

	.footer-logo {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}

	.footer-bio {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.6;
		max-width: 380px;
		margin-bottom: 16px;
	}

	.copyright-str {
		font-size: 11px;
		color: var(--text-subtle);
	}

	.footer-col-nav {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.footer-col-nav h4 {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-main);
		margin-bottom: 4px;
	}

	.footer-col-nav a {
		font-size: 12.5px;
		color: var(--text-muted);
		transition: color 0.15s;
	}

	.footer-col-nav a:hover {
		color: var(--brand-primary);
	}

	/* Modals & Drawers */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(6px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.qr-modal {
		width: 100%;
		max-width: 420px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.qr-modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.qr-item-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.qr-item-icon {
		font-size: 28px;
	}

	.qr-item-title {
		font-size: 16px;
		font-weight: 700;
	}

	.qr-item-price {
		font-size: 13.5px;
		color: #f59e0b;
		font-weight: 700;
	}

	.close-qr-btn, .close-cms-btn {
		font-size: 18px;
		color: var(--text-subtle);
		padding: 4px 8px;
	}

	.qr-code-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
	}

	.qr-svg-wrap {
		padding: 12px;
		background: #ffffff;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
	}

	.qr-scan-guide {
		font-size: 12.5px;
		color: var(--text-muted);
		line-height: 1.45;
	}

	/* CMS Drawer */
	.cms-drawer {
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		padding: 24px;
		gap: 16px;
	}

	.cms-drawer-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.cms-title {
		font-size: 18px;
		font-weight: 800;
		margin-top: 4px;
	}

	.cms-drawer-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
		flex: 1;
		padding-right: 4px;
	}

	.cms-toast {
		background: rgba(16, 185, 129, 0.15);
		border-color: rgba(16, 185, 129, 0.4);
		color: #34d399;
		padding: 12px;
		font-size: 12.5px;
		font-weight: 600;
	}

	.cms-field-group {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.field-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--brand-primary);
	}

	.cms-input {
		background: var(--bg-input);
		border: 1px solid var(--border-panel);
		color: var(--text-main);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		font-size: 12.5px;
		font-family: inherit;
		outline: none;
	}

	.cms-drawer-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--border-panel);
	}

	/* Responsive Media Queries */
	@media (max-width: 1024px) {
		.hero-stats-row {
			grid-template-columns: repeat(2, 1fr);
		}
		.story-grid {
			grid-template-columns: 1fr;
		}
		.promo-cards-grid {
			grid-template-columns: 1fr;
		}
		.menu-items-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.outlets-grid {
			grid-template-columns: 1fr;
		}
		.contact-container {
			grid-template-columns: 1fr;
		}
		.footer-content {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.site-nav {
			display: none;
		}
		.hero-heading {
			font-size: 34px;
		}
		.menu-items-grid {
			grid-template-columns: 1fr;
		}
		.menu-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
		.menu-search-wrap {
			min-width: 100%;
		}
	}
</style>
