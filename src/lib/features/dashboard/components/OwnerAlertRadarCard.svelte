<script lang="ts">
	/**
	 * OwnerAlertRadarCard.svelte
	 * Notifikasi dan Persetujuan (Owner Cockpit)
	 * Menjawab kebutuhan Owner:
	 * Notifikasi persetujuan tertunda & bahan hampir habis dengan menu aksi titik tiga.
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type {
		ActionCenterCardData,
		StockIssuesCardData,
		OutletEodStatusCardData
	} from '../../../api/contract/types.js';

	const actionState = $derived(dashboardStore.getCardState<ActionCenterCardData>('action_center'));
	const stockState = $derived(dashboardStore.getCardState<StockIssuesCardData>('stock_issues'));
	const eodState = $derived(dashboardStore.getCardState<OutletEodStatusCardData>('outlet_eod_status'));

	const actionItems = $derived(actionState.data?.items || []);
	const stockItems = $derived(stockState.data?.items || []);
	const pendingOutlets = $derived(eodState.data?.outlets.filter((o) => o.eod_status !== 'completed') || []);

	let activeTab = $state<'approvals' | 'stock'>('approvals');
	const totalIssues = $derived(actionItems.length + stockItems.length);

	// State menu dropdown titik tiga (⋮)
	let activeDropdownId = $state<string | null>(null);

	// Tutup dropdown saat klik di luar
	$effect(() => {
		const handleWindowClick = () => {
			if (activeDropdownId) activeDropdownId = null;
		};
		window.addEventListener('click', handleWindowClick);
		return () => window.removeEventListener('click', handleWindowClick);
	});

	// Direktori Kontak Store Manager per Outlet
	interface ManagerContact {
		name: string;
		phone: string;
		role: string;
	}

	const STORE_MANAGERS: Record<string, ManagerContact> = {
		'Jodi Senopati': { name: 'Budi Santoso', phone: '+6281234567890', role: 'Store Manager (Jodi Senopati)' },
		'Jodi Dago': { name: 'Siti Rahma', phone: '+6281398765432', role: 'Store Manager (Jodi Dago)' },
		'Jodi Gubeng': { name: 'Dimas Anggara', phone: '+6282145678901', role: 'Store Manager (Jodi Gubeng)' },
		'Kaveloka Ubud': { name: 'Wayan Suartana', phone: '+6281923456789', role: 'Store Manager (Kaveloka Ubud)' },
		'Plaga Farm Bistro': { name: 'Made Ariawan', phone: '+6281876543210', role: 'Store Manager (Plaga Farm Bistro)' }
	};

	function getManager(outletName: string): ManagerContact {
		for (const key of Object.keys(STORE_MANAGERS)) {
			if (outletName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(outletName.toLowerCase())) {
				return STORE_MANAGERS[key];
			}
		}
		return { name: 'Budi Santoso', phone: '+6281234567890', role: `Store Manager (${outletName || 'Gerai'})` };
	}

	// Modal Hubungi Store Manager
	let contactModal = $state<{
		isOpen: boolean;
		outletName: string;
		topic: string;
		manager: ManagerContact;
	} | null>(null);

	function openContactModal(outletName: string, topic: string) {
		contactModal = {
			isOpen: true,
			outletName,
			topic,
			manager: getManager(outletName)
		};
	}
</script>

<DashboardCardFrame
	cardKey="action_center"
	title="Notifikasi dan Persetujuan"
	icon="bell"
	subtitle="Hanya menampilkan hal yang memerlukan persetujuan atau perhatian mendesak Owner"
	badgeText="{totalIssues} Perlu Perhatian"
	badgeVariant={totalIssues > 0 ? 'warning' : 'success'}
	drilldownUrl="/approvals"
	drilldownLabel="Inbox Persetujuan"
	colSpan="col-12 col-lg-5"
>
	<!-- Tab Switcher -->
	<div class="dash-tab-switch mb-3">
		<button
			type="button"
			class="dash-tab-btn flex items-center gap-1.5"
			class:active={activeTab === 'approvals'}
			onclick={() => (activeTab = 'approvals')}
		>
			<Icon name="bolt" size={13} />
			<span>Butuh Persetujuan ({actionItems.length})</span>
		</button>
		<button
			type="button"
			class="dash-tab-btn flex items-center gap-1.5"
			class:active={activeTab === 'stock'}
			onclick={() => (activeTab = 'stock')}
		>
			<Icon name="exclamation-triangle" size={13} />
			<span>Bahan Hampir Habis ({stockItems.length})</span>
		</button>
	</div>

	{#if activeTab === 'approvals'}
		<!-- Tab 1: Butuh Persetujuan / Otorisasi -->
		{#if actionItems.length === 0}
			<div class="p-6 text-center text-muted">
				<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
				<p>Tidak ada otorisasi tertunda. Seluruh persetujuan beres!</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each actionItems as item}
					<div class="dash-subbox flex items-start justify-between gap-3 p-3">
						<div class="flex flex-col gap-1">
							<div class="flex items-center gap-2">
								<Badge variant={item.badgeColor} text={item.badge} size="sm" />
								<span class="font-bold text-xs" style="color: var(--text-main);">{item.title}</span>
							</div>
							<p class="text-xs m-0" style="color: var(--text-muted); line-height: 1.4;">
								{item.desc}
							</p>
						</div>

						<!-- Aksi Titik Tiga (⋮) untuk View Owner -->
						<div class="relative flex-shrink-0">
							<button
								type="button"
								class="action-dots-btn"
								aria-label="Menu Opsi Persetujuan"
								onclick={(e) => {
									e.stopPropagation();
									activeDropdownId = activeDropdownId === `act-${item.id}` ? null : `act-${item.id}`;
								}}
							>
								<Icon name="ellipsis-vertical" size={16} />
							</button>

							{#if activeDropdownId === `act-${item.id}`}
								<div class="dots-dropdown-menu" role="menu" tabindex="-1">
									{#if item.actionLabel.includes('PO') || item.title.toLowerCase().includes('pembelian')}
										<a
											href="/procurement"
											class="dots-dropdown-item font-semibold text-primary"
											onclick={() => (activeDropdownId = null)}
										>
											<Icon name="shopping-cart" size={14} />
											<span>Buat PO / Setujui PO</span>
										</a>
									{:else}
										<a
											href={item.actionUrl}
											class="dots-dropdown-item font-semibold text-primary"
											onclick={() => (activeDropdownId = null)}
										>
											<Icon name="bolt" size={14} />
											<span>{item.actionLabel}</span>
										</a>
									{/if}
									<button
										type="button"
										class="dots-dropdown-item"
										onclick={() => {
											openContactModal('Jodi Senopati', item.title);
											activeDropdownId = null;
										}}
									>
										<Icon name="phone" size={14} />
										<span>Hubungi Store Manager</span>
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Tab 2: Peringatan Bahan Hampir Habis & Operasional -->
		{#if stockItems.length === 0 && pendingOutlets.length === 0}
			<div class="p-6 text-center text-muted">
				<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
				<p>Seluruh stok bahan aman dan operasional gerai berjalan normal.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each stockItems as itm}
					<div class="dash-subbox flex items-center justify-between gap-3 p-3" style="border-left: 3px solid var(--pill-danger-border);">
						<div class="flex flex-col gap-0.5">
							<div class="flex items-center gap-2">
								<span class="font-bold text-xs" style="color: var(--text-main);">{itm.item_name}</span>
								<Badge variant="danger" text="Hampir Habis" size="sm" />
							</div>
							<span class="text-xs" style="color: var(--text-muted);">
								{itm.outlet_name} • Fisik: <strong style="color: var(--pill-danger-text);">{itm.current_qty} {itm.unit}</strong> (Min: {itm.min_qty} {itm.unit})
							</span>
						</div>

						<!-- Sisa Hari & Menu Aksi Titik Tiga (⋮) untuk View Owner -->
						<div class="flex items-center gap-2 flex-shrink-0">
							<span class="text-xs font-bold" style="color: var(--pill-danger-text);">Sisa ~{itm.est_days_left} hari</span>
							<div class="relative">
								<button
									type="button"
									class="action-dots-btn"
									aria-label="Menu Opsi Bahan"
									onclick={(e) => {
										e.stopPropagation();
										activeDropdownId = activeDropdownId === `stock-${itm.id}` ? null : `stock-${itm.id}`;
									}}
								>
									<Icon name="ellipsis-vertical" size={16} />
								</button>

								{#if activeDropdownId === `stock-${itm.id}`}
									<div class="dots-dropdown-menu" role="menu" tabindex="-1">
										<a
											href="/procurement?item={encodeURIComponent(itm.item_name)}&outlet={encodeURIComponent(itm.outlet_name)}"
											class="dots-dropdown-item font-semibold text-primary"
											onclick={() => (activeDropdownId = null)}
										>
											<Icon name="shopping-cart" size={14} />
											<span>Buat PO</span>
										</a>
										<button
											type="button"
											class="dots-dropdown-item"
											onclick={() => {
												openContactModal(itm.outlet_name, itm.item_name);
												activeDropdownId = null;
											}}
										>
											<Icon name="phone" size={14} />
											<span>Hubungi Store Manager</span>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}

				{#if pendingOutlets.length > 0}
					<div class="dash-banner dash-banner-warning flex items-center justify-between mt-1">
						<div class="flex items-center gap-2">
							<Icon name="moon" size={14} />
							<span class="text-xs">
								<strong>Tutup Hari (EOD):</strong> {pendingOutlets.length} gerai belum menyelesaikan tutup kas laci.
							</span>
						</div>
						<a href="/reports" class="text-xs font-bold underline">
							Pantau EOD
						</a>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</DashboardCardFrame>

<!-- Modal Interaktif Kontak Store Manager -->
{#if contactModal?.isOpen}
	<div
		class="contact-modal-backdrop"
		role="presentation"
		onclick={() => (contactModal = null)}
		onkeydown={(e) => e.key === 'Escape' && (contactModal = null)}
	>
		<div
			class="contact-modal-box"
			role="dialog"
			aria-modal="true"
			aria-labelledby="contact-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between pb-3 mb-3 border-b" style="border-color: var(--border-panel);">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
						<Icon name="phone" size={16} />
					</div>
					<div>
						<h3 id="contact-modal-title" class="text-sm font-bold m-0" style="color: var(--text-main);">Hubungi Store Manager</h3>
						<span class="text-[11px]" style="color: var(--text-muted);">{contactModal.outletName}</span>
					</div>
				</div>
				<button
					type="button"
					class="text-xs text-muted hover:text-main p-1 cursor-pointer"
					onclick={() => (contactModal = null)}
					aria-label="Tutup"
				>
					✕
				</button>
			</div>

			<div class="dash-subbox p-3 mb-4">
				<div class="text-xs font-semibold" style="color: var(--text-main);">
					{contactModal.manager.name}
				</div>
				<div class="text-[11px] mb-2" style="color: var(--text-muted);">
					{contactModal.manager.role}
				</div>
				<div class="text-[11px] p-2 rounded" style="background: rgba(0,0,0,0.2); color: var(--text-subtle);">
					Perihal: <strong style="color: var(--text-main);">{contactModal.topic}</strong>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<a
					href="https://wa.me/{contactModal.manager.phone.replace(/[^0-9]/g, '')}?text={encodeURIComponent(`Halo ${contactModal.manager.name}, ini Owner. Mengenai ${contactModal.topic} di ${contactModal.outletName}, tolong segera dicek ya.`)}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-bold text-white cursor-pointer"
					style="background: #25D366; text-decoration: none;"
				>
					<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
						<path d="M12.031 2c-5.508 0-9.984 4.477-9.984 9.984 0 1.76.459 3.477 1.332 4.996L2 22l5.176-1.355a9.946 9.946 0 0 0 4.855 1.258h.004c5.508 0 9.984-4.477 9.984-9.984 0-2.668-1.04-5.176-2.926-7.062A9.925 9.925 0 0 0 12.031 2zm0 18.281h-.003a8.27 8.27 0 0 1-4.215-1.152l-.303-.18-3.133.82.836-3.055-.197-.313a8.236 8.236 0 0 1-1.264-4.417c0-4.567 3.717-8.284 8.284-8.284 2.213 0 4.293.863 5.857 2.428a8.226 8.226 0 0 1 2.428 5.857c0 4.567-3.717 8.284-8.284 8.284z"/>
					</svg>
					<span>Chat via WhatsApp ({contactModal.manager.phone})</span>
				</a>

				<a
					href="tel:{contactModal.manager.phone}"
					class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-bold cursor-pointer"
					style="background: var(--bg-panel-sub); border: 1px solid var(--border-panel); color: var(--text-main); text-decoration: none;"
				>
					<Icon name="phone" size={14} />
					<span>Panggilan Telepon Langsung</span>
				</a>
			</div>
		</div>
	</div>
{/if}
