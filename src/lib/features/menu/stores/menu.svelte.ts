/**
 * State Controller: Menu, Varian, Modifier, Resep Berversi, Harga & Ketersediaan (MS-04)
 * Menggunakan Svelte 5 Runes ($state, $derived)
 *
 * Mengikuti Golden Rule 2: Logika state terpisah dari file .svelte.
 */

import { menuService, type MenuFilterQuery } from '../../../services/menu.service.js';
import { catalogService } from '../../../services/catalog.service.js';
import { session } from '../../../auth/session.svelte.js';
import { toast } from '../../../components/feedback/toast.svelte.js';
import type {
	MenuItem,
	MenuCategory,
	ModifierGroup,
	ModifierOption,
	Recipe,
	RecipeIngredient,
	ProductionRecipe,
	SalesChannel,
	ChannelMarkup,
	MenuAvailability,
	PricingPreviewResponse,
	HppPreviewResponse,
	StockItem
} from '../../../api/contract/types.js';

export class MenuStore {
	// =========================================================================
	// 1. Data Mentah State
	// =========================================================================
	menuItems = $state<MenuItem[]>([]);
	categories = $state<MenuCategory[]>([]);
	modifierGroups = $state<ModifierGroup[]>([]);
	recipes = $state<Recipe[]>([]);
	channels = $state<SalesChannel[]>([]);
	availability = $state<MenuAvailability[]>([]);
	productionRecipes = $state<ProductionRecipe[]>([]);
	stockItems = $state<StockItem[]>([]);

	// =========================================================================
	// 2. Filter & Pencarian Menu
	// =========================================================================
	searchQuery = $state<string>('');
	selectedCategoryFilter = $state<string>('all');
	selectedScopeFilter = $state<'all' | 'all_outlets' | 'outlet_set'>('all');
	selectedStatusFilter = $state<'all' | 'active' | 'archived'>('active');
	selectedOutletFilter = $state<string>('out-jkt-01');

	// =========================================================================
	// 3. Detail Drawer & Tabs (Progressive Disclosure)
	// =========================================================================
	selectedMenuItem = $state<MenuItem | null>(null);
	isDetailDrawerOpen = $state<boolean>(false);
	detailDrawerTab = $state<'info' | 'variants' | 'recipe' | 'pricing' | 'hpp' | 'availability'>('info');

	// =========================================================================
	// 4. Modal Formulir (Menu, Resep, Modifier, Kalkulator)
	// =========================================================================
	isMenuModalOpen = $state<boolean>(false);
	editingMenuItem = $state<MenuItem | null>(null);

	isRecipeModalOpen = $state<boolean>(false);
	editingRecipe = $state<Partial<Recipe> | null>(null);

	isModifierModalOpen = $state<boolean>(false);
	editingModifierGroup = $state<Partial<ModifierGroup> | null>(null);

	isPricingCalculatorOpen = $state<boolean>(false);

	// =========================================================================
	// 5. Simulator HPP Interaktif (§6.4, T-04.7)
	// =========================================================================
	simVariantId = $state<string>('var-aren-iced');
	simOutletId = $state<string>('out-jkt-01');
	simSelectedOptionIds = $state<string[]>([]);
	simHppResult = $state<HppPreviewResponse | null>(null);
	isHppLoading = $state<boolean>(false);

	// =========================================================================
	// 6. Simulator Harga Channel Interaktif (§6.1, T-04.8)
	// =========================================================================
	calcVariantId = $state<string>('var-aren-iced');
	calcOutletId = $state<string>('out-jkt-01');
	calcChannelCode = $state<string>('pos');
	calcOptionIds = $state<string[]>([]);
	calcPricingResult = $state<PricingPreviewResponse | null>(null);
	isCalcLoading = $state<boolean>(false);

	// Loading & Error
	isLoading = $state<boolean>(false);
	error = $state<string | null>(null);

	// =========================================================================
	// 7. Derived Computations
	// =========================================================================
	filteredMenuItems = $derived.by(() => {
		let list = this.menuItems;

		if (this.selectedCategoryFilter !== 'all') {
			list = list.filter((m) => m.category_id === this.selectedCategoryFilter);
		}

		if (this.selectedScopeFilter !== 'all') {
			list = list.filter((m) => m.scope_type === this.selectedScopeFilter);
		}

		if (this.selectedStatusFilter !== 'all') {
			list = list.filter((m) => m.status === this.selectedStatusFilter);
		}

		const query = this.searchQuery.toLowerCase().trim();
		if (query) {
			list = list.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.code.toLowerCase().includes(query) ||
					m.variants.some((v) => v.name.toLowerCase().includes(query) || v.sku.toLowerCase().includes(query))
			);
		}

		return list;
	});

	totalVariantsCount = $derived.by(() => {
		return this.menuItems.reduce((acc, m) => acc + (m.variants?.length || 0), 0);
	});

	activeRecipesCount = $derived.by(() => {
		return this.recipes.filter((r) => r.is_active).length;
	});

	// =========================================================================
	// 8. Actions & API Loading
	// =========================================================================
	async loadAll(): Promise<void> {
		this.isLoading = true;
		this.error = null;

		try {
			const [menus, cats, mods, rcps, chns, avails, prods, rawItems] = await Promise.all([
				menuService.getMenuItems({ outlet_id: this.selectedOutletFilter }),
				menuService.getCategories(),
				menuService.getModifierGroups(),
				menuService.getRecipes(),
				menuService.getSalesChannels(),
				menuService.getMenuAvailability({ outlet_id: this.selectedOutletFilter }),
				menuService.getProductionRecipes(),
				catalogService.getItems()
			]);

			this.menuItems = menus;
			this.categories = cats;
			this.modifierGroups = mods;
			this.recipes = rcps;
			this.channels = chns;
			this.availability = avails;
			this.productionRecipes = prods;
			this.stockItems = rawItems;

			// Jalankan kalkulasi simulasi awal untuk item default
			if (this.simVariantId) {
				await this.refreshHppSimulation();
			}
			if (this.calcVariantId) {
				await this.refreshPricingCalculation();
			}
		} catch (err: any) {
			this.error = err.message || 'Gagal memuat katalog menu dan resep.';
			toast.error(this.error || 'Gagal memuat katalog menu dan resep.');
		} finally {
			this.isLoading = false;
		}
	}

	async refreshHppSimulation(): Promise<void> {
		if (!this.simVariantId) return;
		this.isHppLoading = true;
		try {
			this.simHppResult = await menuService.getHppPreview({
				variant_id: this.simVariantId,
				outlet_id: this.simOutletId,
				option_ids: this.simSelectedOptionIds
			});
		} catch (err: any) {
			console.error('Simulasi HPP gagal:', err);
		} finally {
			this.isHppLoading = false;
		}
	}

	async refreshPricingCalculation(): Promise<void> {
		if (!this.calcVariantId) return;
		this.isCalcLoading = true;
		try {
			this.calcPricingResult = await menuService.getPricingPreview({
				variant_id: this.calcVariantId,
				outlet_id: this.calcOutletId,
				channel_code: this.calcChannelCode,
				option_ids: this.calcOptionIds
			});
		} catch (err: any) {
			console.error('Kalkulasi harga channel gagal:', err);
		} finally {
			this.isCalcLoading = false;
		}
	}

	openDetailDrawer(item: MenuItem, tab: 'info' | 'variants' | 'recipe' | 'pricing' | 'hpp' | 'availability' = 'info'): void {
		this.selectedMenuItem = item;
		this.detailDrawerTab = tab;
		this.isDetailDrawerOpen = true;

		// Set default varian untuk simulasi
		if (item.variants && item.variants.length > 0) {
			this.simVariantId = item.variants[0].id;
			this.calcVariantId = item.variants[0].id;
			this.refreshHppSimulation();
			this.refreshPricingCalculation();
		}
	}

	closeDetailDrawer(): void {
		this.isDetailDrawerOpen = false;
		this.selectedMenuItem = null;
	}

	async saveMenuItem(data: Partial<MenuItem>): Promise<void> {
		try {
			if (this.editingMenuItem?.id) {
				const updated = await menuService.updateMenuItem(this.editingMenuItem.id, data);
				const idx = this.menuItems.findIndex((m) => m.id === updated.id);
				if (idx >= 0) this.menuItems[idx] = updated;
				toast.success(`Menu "${updated.name}" berhasil diperbarui.`);
			} else {
				const created = await menuService.createMenuItem(data);
				this.menuItems.unshift(created);
				toast.success(`Menu baru "${created.name}" berhasil ditambahkan.`);
			}
			this.isMenuModalOpen = false;
			this.editingMenuItem = null;
		} catch (err: any) {
			toast.error(err.message || 'Gagal menyimpan menu.');
			throw err;
		}
	}

	async saveRecipe(data: Partial<Recipe>): Promise<void> {
		try {
			const created = await menuService.createRecipe(data);
			this.recipes.unshift(created);
			toast.success(`Resep Versi ${created.version_number} untuk "${created.variant_name || 'Varian'}" berhasil dirilis.`);
			this.isRecipeModalOpen = false;
			this.editingRecipe = null;
			await this.refreshHppSimulation();
		} catch (err: any) {
			toast.error(err.message || 'Gagal merilis versi resep.');
			throw err;
		}
	}

	async saveModifierGroup(data: Partial<ModifierGroup>): Promise<void> {
		try {
			if (this.editingModifierGroup?.id) {
				const updated = await menuService.updateModifierGroup(this.editingModifierGroup.id, data);
				const idx = this.modifierGroups.findIndex((g) => g.id === updated.id);
				if (idx >= 0) this.modifierGroups[idx] = updated;
				toast.success(`Grup modifier "${updated.name}" berhasil diperbarui.`);
			} else {
				const created = await menuService.createModifierGroup(data);
				this.modifierGroups.push(created);
				toast.success(`Grup modifier "${created.name}" berhasil dibuat.`);
			}
			this.isModifierModalOpen = false;
			this.editingModifierGroup = null;
		} catch (err: any) {
			toast.error(err.message || 'Gagal menyimpan grup modifier.');
			throw err;
		}
	}

	async toggleMenuAvailability(entry: MenuAvailability, reason?: string): Promise<void> {
		try {
			if (entry.is_available) {
				const res = await menuService.markSoldOut(entry.id, reason);
				const idx = this.availability.findIndex((a) => a.id === entry.id);
				if (idx >= 0) this.availability[idx] = res;
				toast.success(`Menu "${entry.menu_item_name}" ditandai HABIS di channel ${entry.channel_code}.`);
			} else {
				const res = await menuService.restoreAvailability(entry.id);
				const idx = this.availability.findIndex((a) => a.id === entry.id);
				if (idx >= 0) this.availability[idx] = res;
				toast.success(`Menu "${entry.menu_item_name}" kembali TERSEDIA.`);
			}
		} catch (err: any) {
			toast.error(err.message || 'Gagal memperbarui status ketersediaan menu.');
		}
	}
}

export const menuStore = new MenuStore();
