<script lang="ts">
	import './command_palette.css';
	import { COMMAND_PALETTE_ITEMS } from '../../config/navigation.js';
	import { session } from '../../auth/session.svelte.js';
	import { navService } from '../../services/nav.service.js';
	import Icon from '../data/Icon.svelte';
	import type { SearchResultItem } from '../../api/contract/types.js';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, onClose }: Props = $props();

	let searchQuery = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);
	let entityResults = $state<SearchResultItem[]>([]);
	let isLoadingEntities = $state(false);
	let selectedIndex = $state(0);
	let searchTimeout: any = null;

	$effect(() => {
		if (isOpen) {
			searchQuery = '';
			entityResults = [];
			selectedIndex = 0;
			setTimeout(() => inputRef?.focus(), 50);
		}
	});

	// Halaman & menu yang dapat diakses pengguna sesuai izin PBAC
	const accessiblePages = $derived.by(() => {
		const accessible = COMMAND_PALETTE_ITEMS.filter((item) => {
			if (item.permission) {
				return session.can(item.permission);
			}
			if (item.roles) {
				return item.roles.includes(session.currentRole);
			}
			return true;
		});

		const q = searchQuery.toLowerCase().trim();
		if (!q) return accessible;

		return accessible.filter(
			(item) =>
				item.title.toLowerCase().includes(q) ||
				item.section.toLowerCase().includes(q) ||
				item.tags.some((t) => t.toLowerCase().includes(q))
		);
	});

	// Panggil API pencarian entitas global (T-01.4, AC-01.7) dengan debounce
	$effect(() => {
		const q = searchQuery.trim();
		if (searchTimeout) clearTimeout(searchTimeout);

		if (!q) {
			entityResults = [];
			isLoadingEntities = false;
			return;
		}

		isLoadingEntities = true;
		searchTimeout = setTimeout(async () => {
			try {
				entityResults = await navService.search(q, {
					role: session.currentRole,
					outlet_id: session.activeOutletId !== 'all' && session.activeOutletId !== '*' ? session.activeOutletId : undefined
				});
			} catch (err) {
				console.error('Gagal mencari entitas:', err);
				entityResults = [];
			} finally {
				isLoadingEntities = false;
			}
		}, 150);
	});

	// Gabungan seluruh item untuk navigasi keyboard
	const allItems = $derived.by(() => {
		const items: Array<{ id: string; href: string }> = [];
		for (const page of accessiblePages) {
			items.push({ id: page.href + page.title, href: page.href });
		}
		for (const entity of entityResults) {
			items.push({ id: entity.id, href: entity.href });
		}
		return items;
	});

	function handleSelect(href: string) {
		onClose?.();
		if (typeof window !== 'undefined') {
			window.location.href = href;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose?.();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (allItems.length > 0) {
				selectedIndex = (selectedIndex + 1) % allItems.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (allItems.length > 0) {
				selectedIndex = (selectedIndex - 1 + allItems.length) % allItems.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (allItems.length > 0 && allItems[selectedIndex]) {
				handleSelect(allItems[selectedIndex].href);
			}
		}
	}

	function getEntityIcon(type: string): string {
		switch (type) {
			case 'po':
				return 'cube';
			case 'invoice':
				return 'receipt-percent';
			case 'item':
				return 'cube';
			case 'recipe':
				return 'book-open';
			case 'outlet':
				return 'building-storefront';
			case 'supplier':
				return 'building-office';
			default:
				return 'document-text';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="palette-backdrop" onclick={onClose}>
		<div class="palette-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Pencarian Cepat" tabindex="-1">
			<div class="search-header">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<input
					bind:this={inputRef}
					type="text"
					class="search-input"
					placeholder="Ketik untuk mencari menu, PO, nota, bahan, outlet..."
					bind:value={searchQuery}
				/>
				<span class="esc-badge">ESC</span>
			</div>

			<div class="results-list">
				{#if isLoadingEntities}
					<div class="palette-loading">
						<span>Mencari data entitas...</span>
					</div>
				{/if}

				{#if accessiblePages.length === 0 && entityResults.length === 0 && !isLoadingEntities}
					<div class="empty-results">
						<span>Tidak ada hasil yang cocok dengan "{searchQuery}"</span>
					</div>
				{:else}
					<!-- Bagian 1: Halaman & Menu Navigasi -->
					{#if accessiblePages.length > 0}
						<div class="category-heading">HALAMAN &amp; MENU</div>
						{#each accessiblePages as pageItem, i (pageItem.href + pageItem.title)}
							<button
								type="button"
								class="result-item"
								class:is-selected={selectedIndex === i}
								onclick={() => handleSelect(pageItem.href)}
							>
								<span class="item-icon">
									<Icon name={pageItem.icon} size={16} />
								</span>
								<div class="item-details">
									<div class="item-title-row">
										<span class="item-title">{pageItem.title}</span>
									</div>
									<span class="item-subtitle">{pageItem.section}</span>
								</div>
								<Icon name="arrow-right" size={14} class="item-arrow" />
							</button>
						{/each}
					{/if}

					<!-- Bagian 2: Entitas & Dokumen Operasional (T-01.4) -->
					{#if entityResults.length > 0}
						<div class="category-heading">ENTITAS &amp; DOKUMEN</div>
						{#each entityResults as entity, j (entity.id)}
							<button
								type="button"
								class="result-item"
								class:is-selected={selectedIndex === accessiblePages.length + j}
								onclick={() => handleSelect(entity.href)}
							>
								<span class="item-icon">
									<Icon name={getEntityIcon(entity.type)} size={16} />
								</span>
								<div class="item-details">
									<div class="item-title-row">
										<span class="item-title">{entity.title}</span>
										<span class="entity-type-badge badge-{entity.type}">{entity.type.toUpperCase()}</span>
										{#if entity.badge}
											<span class="entity-type-badge">{entity.badge}</span>
										{/if}
									</div>
									<span class="item-subtitle">{entity.subtitle}</span>
								</div>
								<Icon name="arrow-right" size={14} class="item-arrow" />
							</button>
						{/each}
					{/if}
				{/if}
			</div>

			<div class="palette-footer">
				<span>Gunakan <strong>↑↓</strong> untuk navigasi, <strong>Enter</strong> untuk memilih</span>
				<span>Peran: <strong>{session.currentRole.toUpperCase()}</strong></span>
			</div>
		</div>
	</div>
{/if}
