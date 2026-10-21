<script lang="ts">
	import './header.css';
	import { onMount } from 'svelte';
	import { session } from '../../auth/session.svelte.js';
	import { DEMO_USER_LIST } from '../../config/demo_accounts.js';
	import { themeStore } from '../../theme.svelte.js';
	import { DEMO_ORGANIZATIONS, DEMO_OUTLETS } from '../../auth/scope.js';
	import { navService } from '../../services/nav.service.js';
	import { relativeTime } from '../../utils/format.js';
	import type { NotificationItem } from '../../api/contract/types.js';

	interface Props {
		onOpenSearch?: () => void;
	}

	let { onOpenSearch }: Props = $props();

	let showOutletDropdown = $state(false);
	let showUserMenu = $state(false);
	let showNotifications = $state(false);
	let notifications = $state<NotificationItem[]>([]);

	// Cek apakah user saat ini dibatasi (Store Manager / Brand Manager / Kasir)
	const isStoreManager = $derived(session.currentRole === 'store_manager' || session.currentRole === 'cashier');
	const isBrandManager = $derived(session.currentRole === 'brand_manager');
	const isRestrictedScope = $derived(isStoreManager || isBrandManager);

	const roleDisplayMap: Record<string, string> = {
		owner: 'Owner & Pimpinan',
		hq_admin: 'Admin Pusat (HQ)',
		finance: 'Finance & Akuntansi',
		brand_manager: 'Brand Manager',
		store_manager: 'Store Manager',
		cashier: 'Kasir POS'
	};

	// Daftar organisasi & outlet yang boleh dipilih user
	const accessibleOrgs = $derived(session.accessibleOrganizations);
	const accessibleOutletIds = $derived(session.accessibleOutlets);

	const availableOutlets = $derived.by(() => {
		if (!isRestrictedScope) {
			return DEMO_OUTLETS;
		}
		return DEMO_OUTLETS.filter((o) => accessibleOutletIds.includes(o.id));
	});

	// Label organisasi yang sedang aktif
	const currentOrgLabel = $derived.by(() => {
		if (isRestrictedScope) {
			const org = DEMO_ORGANIZATIONS.find((o) => o.id === (session.currentUser?.organization_id || 'org-jodi'));
			return org ? org.name : 'Seduhan Kopi Jodi';
		}
		if (session.activeOrganizationId === 'all' || session.activeOrganizationId === '*') {
			return 'Semua Organisasi';
		}
		const found = DEMO_ORGANIZATIONS.find((o) => o.id === session.activeOrganizationId);
		return found ? found.name : 'Organisasi';
	});

	// Label outlet yang sedang aktif
	const currentOutletLabel = $derived.by(() => {
		if (session.activeOutletId === 'all' || session.activeOutletId === '*') {
			return isBrandManager ? 'Semua Gerai Brand' : 'Semua Outlet';
		}
		const found = DEMO_OUTLETS.find((o) => o.id === session.activeOutletId);
		return found ? found.name : (availableOutlets[0]?.name || 'Pilih Outlet');
	});

	const isLocked = $derived(isStoreManager && availableOutlets.length <= 1);

	// Hitung jumlah notifikasi belum dibaca
	const unreadCount = $derived(notifications.filter((n) => !n.read).length);

	async function loadNotifications() {
		try {
			notifications = await navService.getNotifications();
		} catch (err) {
			console.error('Gagal memuat notifikasi:', err);
		}
	}

	// Realtime WIB Clock & Format Hari Bisnis
	let currentTimeWib = $state('21:00');

	const formattedBusinessDate = $derived.by(() => {
		if (!session.businessDate) return '13 Okt 2026';
		const parts = session.businessDate.split('-');
		if (parts.length === 3) {
			const day = parts[2];
			const monthIdx = parseInt(parts[1], 10) - 1;
			const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
			const month = months[monthIdx] || parts[1];
			const year = parts[0];
			return `${day} ${month} ${year}`;
		}
		return session.businessDate;
	});

	onMount(() => {
		loadNotifications();

		// Realtime WIB clock updater
		const updateWibTime = () => {
			const now = new Date();
			const wibHours = String((now.getUTCHours() + 7) % 24).padStart(2, '0');
			const wibMinutes = String(now.getUTCMinutes()).padStart(2, '0');
			currentTimeWib = `${wibHours}:${wibMinutes}`;
		};
		updateWibTime();
		const timer = setInterval(updateWibTime, 20000);
		return () => clearInterval(timer);
	});

	function handleSelectGlobalAll() {
		session.setOrganization('*');
		session.setOutlet('*');
		showOutletDropdown = false;
	}

	function handleSelectOrgAll(orgId: string) {
		session.setOrganization(orgId);
		session.setOutlet('*');
		showOutletDropdown = false;
	}

	function handleSelectOutlet(outletId: string, orgId?: string) {
		if (orgId) {
			session.setOrganization(orgId);
		}
		session.setOutlet(outletId);
		showOutletDropdown = false;
	}

	async function handleMarkAsRead(item: NotificationItem) {
		if (!item.read) {
			item.read = true;
			try {
				await navService.markNotificationAsRead(item.id);
			} catch (err) {
				console.error('Gagal menandai notifikasi dibaca:', err);
			}
		}
		if (item.link && typeof window !== 'undefined') {
			window.location.href = item.link;
		}
		showNotifications = false;
	}

	async function handleMarkAllAsRead() {
		for (const n of notifications) {
			n.read = true;
		}
		try {
			await navService.markAllNotificationsAsRead();
		} catch (err) {
			console.error('Gagal menandai seluruh notifikasi dibaca:', err);
		}
	}

	async function handleSwitchDemoUser(userId: string) {
		await session.switchRole(undefined, userId);
		showUserMenu = false;
	}

	function handleLogout() {
		session.logout();
		showUserMenu = false;
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
	}

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('#header-outlet-picker')) {
			showOutletDropdown = false;
		}
		if (!target.closest('#header-user-menu')) {
			showUserMenu = false;
		}
		if (!target.closest('#header-notification-menu')) {
			showNotifications = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<header class="app-header">
	<div class="header-left">
		<!-- 1. Search Ctrl+K Button (Paling Kiri Sesuai Arahan) -->
		{#if onOpenSearch}
			<button
				type="button"
				class="search-trigger-btn"
				onclick={onOpenSearch}
				aria-label="Cari Cepat"
				title="Cari menu, PO, nota (Ctrl+K)"
			>
				<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<span class="search-label">Cari menu, PO, nota...</span>
				<span class="kbd-shortcut">Ctrl+K</span>
			</button>
		{/if}

		<!-- 2. Role-Scoped Organization & Outlet Hierarchical Picker (Di sebelah kanan pencarian) -->
		<div id="header-outlet-picker" class="outlet-picker-wrapper">
			<button
				type="button"
				class="outlet-picker-btn"
				class:is-open={showOutletDropdown}
				class:is-locked={isLocked}
				disabled={isLocked}
				onclick={() => (showOutletDropdown = !showOutletDropdown)}
				aria-expanded={showOutletDropdown}
				aria-label="Pilih Organisasi dan Outlet Aktif"
			>
				<span class="outlet-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
						<polyline points="9 22 9 12 15 12 15 22"></polyline>
					</svg>
				</span>
				<div class="outlet-info">
					<span class="org-name-sub">{currentOrgLabel}</span>
					<span class="outlet-name">{currentOutletLabel}</span>
				</div>
			</button>

			{#if showOutletDropdown && !isLocked}
				<div class="outlet-dropdown-menu">
					<div class="dropdown-header">PILIH ORGANISASI &amp; OUTLET</div>

					<!-- 1. Opsi Konsolidasi Global (Khusus HQ: Owner, HQ Admin, Finance) -->
					{#if !isRestrictedScope}
						<button
							type="button"
							class="dropdown-item"
							class:selected={session.activeOrganizationId === '*' && (session.activeOutletId === '*' || session.activeOutletId === 'all')}
							onclick={handleSelectGlobalAll}
						>
							<div class="item-text">
								<span class="item-title">Semua Organisasi &amp; Outlet</span>
								<span class="item-desc">Konsolidasi seluruh brand, unit bisnis &amp; cabang gerai</span>
							</div>
							{#if session.activeOrganizationId === '*' && (session.activeOutletId === '*' || session.activeOutletId === 'all')}
								<span class="check-mark">✓</span>
							{/if}
						</button>
						<div class="dropdown-divider"></div>

						<!-- Loop Organisasi Terdaftar -->
						{#each accessibleOrgs as org (org.id)}
							{@const orgOutlets = DEMO_OUTLETS.filter((o) => o.organization_id === org.id)}
							<div class="org-section-header">
								<span class="org-section-title">{org.name}</span>
								<span class="org-badge-code">{org.code}</span>
							</div>

							<!-- Opsi Semua Outlet dalam Organisasi Ini -->
							<button
								type="button"
								class="dropdown-item"
								class:selected={session.activeOrganizationId === org.id && (session.activeOutletId === '*' || session.activeOutletId === 'all')}
								onclick={() => handleSelectOrgAll(org.id)}
							>
								<div class="item-text">
									<span class="item-title">Semua Outlet di {org.name}</span>
									<span class="item-desc">Konsolidasi {orgOutlets.length} outlet ({orgOutlets.map((o) => o.city).join(', ')})</span>
								</div>
								{#if session.activeOrganizationId === org.id && (session.activeOutletId === '*' || session.activeOutletId === 'all')}
									<span class="check-mark">✓</span>
								{/if}
							</button>

							<!-- Daftar Outlet Individual di Bawah Organisasi Ini -->
							{#each orgOutlets as outlet (outlet.id)}
								<button
									type="button"
									class="dropdown-item is-child"
									class:selected={session.activeOutletId === outlet.id}
									onclick={() => handleSelectOutlet(outlet.id, org.id)}
								>
									<div class="item-text">
										<span class="item-title">{outlet.name}</span>
										<span class="item-desc">{outlet.city} · {outlet.code}</span>
									</div>
									{#if session.activeOutletId === outlet.id}
										<span class="check-mark">✓</span>
									{/if}
								</button>
							{/each}
							<div class="dropdown-divider"></div>
						{/each}
					{:else if isBrandManager}
						<!-- 2. Tampilan Brand Manager Multi-Outlet (mis. Sari mengelola Brand Jodi) -->
						<div class="org-section-header">
							<span class="org-section-title">{currentOrgLabel}</span>
							<span class="org-badge-code">Brand Anda</span>
						</div>

						{#if availableOutlets.length > 1}
							<button
								type="button"
								class="dropdown-item"
								class:selected={session.activeOutletId === '*' || session.activeOutletId === 'all'}
								onclick={() => session.setOutlet('*')}
							>
								<div class="item-text">
									<span class="item-title">Semua Gerai Brand (Konsolidasi)</span>
									<span class="item-desc">Konsolidasi {availableOutlets.length} gerai di bawah naungan {currentOrgLabel}</span>
								</div>
								{#if session.activeOutletId === '*' || session.activeOutletId === 'all'}
									<span class="check-mark">✓</span>
								{/if}
							</button>
						{/if}

						{#each availableOutlets as outlet (outlet.id)}
							<button
								type="button"
								class="dropdown-item is-child"
								class:selected={session.activeOutletId === outlet.id}
								onclick={() => handleSelectOutlet(outlet.id)}
							>
								<div class="item-text">
									<span class="item-title">{outlet.name}</span>
									<span class="item-desc">{outlet.city} · {outlet.code}</span>
								</div>
								{#if session.activeOutletId === outlet.id}
									<span class="check-mark">✓</span>
								{/if}
							</button>
						{/each}
					{:else}
						<!-- 3. Tampilan Store Manager Single-Outlet (Terkunci pada Gerai Tugas) -->
						<div class="org-section-header">
							<span class="org-section-title">{currentOrgLabel}</span>
							<span class="org-badge-code">Gerai Tugas</span>
						</div>

						{#each availableOutlets as outlet (outlet.id)}
							<div class="dropdown-item is-child selected" style="cursor: default; opacity: 0.95;">
								<div class="item-text">
									<span class="item-title">{outlet.name}</span>
									<span class="item-desc">{outlet.city} · {outlet.code} &bull; Terkunci untuk Store Manager</span>
								</div>
								<span class="check-mark">🔒</span>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>


	</div>

	<div class="header-right">
		<!-- 1. Tanggal dan Jam (Dibuat kecil di sebelah kiri lonceng) -->
		<div class="header-datetime-compact wib-date-badge" title="Hari Bisnis & Waktu Operasional (Asia/Jakarta WIB)">
			<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="datetime-icon">
				<circle cx="12" cy="12" r="10"></circle>
				<polyline points="12 6 12 12 16 14"></polyline>
			</svg>
			<span class="datetime-date">{formattedBusinessDate}</span>
			<span class="datetime-dot">&bull;</span>
			<span class="datetime-time">{currentTimeWib} WIB</span>
		</div>

		<!-- 2. Notification Bell Trigger & Dropdown (T-01.2) -->
		<div id="header-notification-menu" class="notification-menu-wrapper">
			<button
				type="button"
				class="notification-trigger-btn"
				class:is-active={showNotifications}
				onclick={() => {
					showNotifications = !showNotifications;
					if (showNotifications) loadNotifications();
				}}
				aria-label="Notifikasi ({unreadCount} belum dibaca)"
				title="Notifikasi ({unreadCount} belum dibaca)"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
					<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
				</svg>
				{#if unreadCount > 0}
					<span class="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
				{/if}
			</button>

			{#if showNotifications}
				<div class="notification-dropdown-menu">
					<div class="notif-header">
						<div class="notif-title-row">
							<span class="notif-heading">Notifikasi</span>
							{#if unreadCount > 0}
								<span class="unread-pill">{unreadCount} baru</span>
							{/if}
						</div>
						{#if unreadCount > 0}
							<button type="button" class="mark-all-read-btn" onclick={handleMarkAllAsRead}>
								Tandai Semua Dibaca
							</button>
						{/if}
					</div>

					<div class="notif-list">
						{#if notifications.length === 0}
							<div class="notif-empty">
								<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
									<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
								</svg>
								<span>Tidak ada notifikasi baru</span>
							</div>
						{:else}
							{#each notifications as item (item.id)}
								<button
									type="button"
									class="notif-item"
									class:is-unread={!item.read}
									onclick={() => handleMarkAsRead(item)}
								>
									<div class="notif-indicator notif-type-{item.type}"></div>
									<div class="notif-content">
										<div class="notif-item-title-row">
											<span class="notif-item-title">{item.title}</span>
											{#if !item.read}
												<span class="unread-dot" title="Belum dibaca"></span>
											{/if}
										</div>
										<p class="notif-item-message">{item.message}</p>
										<span class="notif-item-time">{relativeTime(item.created_at)}</span>
									</div>
								</button>
							{/each}
						{/if}
					</div>

					<div class="notif-footer">
						<a href="/approvals" onclick={() => (showNotifications = false)}>
							Lihat Semua Persetujuan
						</a>
					</div>
				</div>
			{/if}
		</div>

		<!-- Theme Toggle Button -->
		<button
			type="button"
			class="theme-toggle-btn"
			onclick={() => themeStore.toggle()}
			title={themeStore.current === 'dark' ? 'Mode Gelap (Klik untuk beralih ke Mode Terang)' : 'Mode Terang (Klik untuk beralih ke Mode Gelap)'}
			aria-label="Alih Tema Gelap / Terang"
		>
			{#if themeStore.current === 'dark'}
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="5"></circle>
					<line x1="12" y1="1" x2="12" y2="3"></line>
					<line x1="12" y1="21" x2="12" y2="23"></line>
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
					<line x1="1" y1="12" x2="3" y2="12"></line>
					<line x1="21" y1="12" x2="23" y2="12"></line>
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
				</svg>
			{/if}
		</button>

		<!-- User Menu & Role Switcher -->
		<div id="header-user-menu" class="user-menu-wrapper">
			<button
				type="button"
				class="user-profile-btn"
				class:is-active={showUserMenu}
				onclick={() => (showUserMenu = !showUserMenu)}
				aria-expanded={showUserMenu}
				aria-label="Menu Pengguna"
			>
				<div class="avatar-circle">
					{session.currentUser?.name?.charAt(0) || 'U'}
				</div>
				<div class="user-details-text">
					<span class="name">{session.currentUser?.name || 'Pengguna'}</span>
					<span class="role">{roleDisplayMap[session.currentRole] || session.currentRole}</span>
				</div>
			</button>

			{#if showUserMenu}
				<div class="user-dropdown-menu">
					<div class="user-card-header">
						<span class="full-name">{session.currentUser?.name}</span>
						<span class="email-sub">{session.currentUser?.email}</span>
						<span class="role-pill">{roleDisplayMap[session.currentRole] || session.currentRole}</span>
					</div>

					<div class="dropdown-divider"></div>

					<div class="switch-role-section">
						<span class="switch-title">GANTI AKUN DEMO:</span>
						{#each DEMO_USER_LIST as demoUser (demoUser.id)}
							<button
								type="button"
								class="demo-user-btn"
								class:is-active={session.currentUser?.id === demoUser.id}
								onclick={() => handleSwitchDemoUser(demoUser.id)}
							>
								<div class="demo-user-avatar">{demoUser.name.charAt(0)}</div>
								<div class="demo-user-text">
									<span class="demo-name">{demoUser.name}</span>
									<span class="demo-role-tag">{roleDisplayMap[demoUser.role] || demoUser.role}</span>
								</div>
								{#if session.currentUser?.id === demoUser.id}
									<span class="active-dot" aria-hidden="true">●</span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="dropdown-divider"></div>

					<button type="button" class="logout-btn" onclick={handleLogout}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						<span>Keluar dari Sesi</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>
