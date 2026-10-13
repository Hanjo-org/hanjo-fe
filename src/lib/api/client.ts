// Hanjo ERP & POS API Client

const API_BASE = 'http://localhost:8080/api/v1';

export interface Category {
	id: string;
	name: string;
	slug: string;
	description: string;
	sort_order: number;
	is_active: boolean;
}

export interface RecipeItem {
	ingredient_id: string;
	ingredient_name?: string;
	quantity: number;
	unit: string;
}

export interface Variant {
	id: string;
	name: string;
	sku: string;
	price: number;
	cost: number;
	is_default: boolean;
	sort_order: number;
	recipes?: RecipeItem[];
}

export interface ModifierOption {
	id: string;
	name: string;
	price_adjustment: number;
	sort_order: number;
}

export interface ModifierGroup {
	id: string;
	name: string;
	is_required: boolean;
	max_select: number;
	sort_order: number;
	options: ModifierOption[];
}

export interface Product {
	id: string;
	category_id: string;
	category_name?: string;
	sku: string;
	name: string;
	description: string;
	product_type: string;
	status: string;
	image_url: string;
	variants: Variant[];
	modifier_groups: ModifierGroup[];
}

export interface Ingredient {
	id: string;
	name: string;
	sku: string;
	unit: string;
	minimum_stock: number;
	reorder_point: number;
	cost_per_unit: number;
	status: string;
}

export interface StockLevel {
	id: string;
	outlet_id: string;
	ingredient_id: string;
	ingredient_name?: string;
	current_qty: number;
	unit: string;
	last_updated: string;
}

export interface LowStockAlert {
	ingredient_id: string;
	ingredient_name: string;
	sku: string;
	outlet_id: string;
	current_qty: number;
	minimum_stock: number;
	reorder_point: number;
	unit: string;
}

export interface Outlet {
	id: string;
	name: string;
	code: string;
	street: string;
	city: string;
	status: string;
	tax_rate: number;
	service_charge: number;
}

export interface POSSession {
	id: string;
	outlet_id: string;
	cashier_id: string;
	opened_at: string;
	closed_at?: string;
	opening_cash: number;
	status: 'open' | 'closed';
}

export interface CartModifier {
	modifier_name: string;
	option_name: string;
	price_adjustment: number;
}

export interface CartItem {
	id: string;
	product_id: string;
	variant_id: string;
	product_name: string;
	variant_name: string;
	quantity: number;
	unit_price: number;
	modifiers: CartModifier[];
	subtotal: number;
	note: string;
}

export interface TransactionResponse {
	id: string;
	transaction_number: string;
	session_id: string;
	outlet_id: string;
	transaction_type: string;
	table_number: string;
	subtotal: number;
	discount_total: number;
	tax_amount: number;
	service_charge: number;
	grand_total: number;
	status: string;
	completed_at?: string;
	created_at: string;
	items: any[];
	payments: any[];
}

// Fallback Mock Data for standalone demonstration
export const MOCK_OUTLET: Outlet = {
	id: '01927364-0001-7000-8000-000000000001',
	name: 'Hanjo Senopati',
	code: 'JKT-01',
	street: 'Jl. Senopati No. 42',
	city: 'Jakarta Selatan',
	status: 'open',
	tax_rate: 0.10, // 10% PB1
	service_charge: 0.05, // 5% Service Charge
};

export const MOCK_CATEGORIES: Category[] = [
	{ id: 'cat-1', name: 'Signature Coffee', slug: 'signature-coffee', description: 'Kopi kreasi barista khas Hanjo', sort_order: 1, is_active: true },
	{ id: 'cat-2', name: 'Espresso Based', slug: 'espresso-based', description: 'Klasik espresso murni dan kopi susu', sort_order: 2, is_active: true },
	{ id: 'cat-3', name: 'Non-Coffee', slug: 'non-coffee', description: 'Matcha, cokelat artisan, dan teh', sort_order: 3, is_active: true },
	{ id: 'cat-4', name: 'Pastry & Bakery', slug: 'pastry-bakery', description: 'Freshly baked croissant & toast', sort_order: 4, is_active: true },
];

export const MOCK_INGREDIENTS: Ingredient[] = [
	{ id: 'ing-1', name: 'Biji Kopi Arabica Aceh Gayo', sku: 'ING-BEANS-01', unit: 'kg', minimum_stock: 5, reorder_point: 10, cost_per_unit: 220000, status: 'active' },
	{ id: 'ing-2', name: 'Susu Fresh Milk Greenfield', sku: 'ING-MILK-01', unit: 'liter', minimum_stock: 20, reorder_point: 40, cost_per_unit: 24000, status: 'active' },
	{ id: 'ing-3', name: 'Gula Aren Organik Cair', sku: 'ING-AREN-01', unit: 'liter', minimum_stock: 10, reorder_point: 20, cost_per_unit: 35000, status: 'active' },
	{ id: 'ing-4', name: 'Pure Uji Matcha Powder', sku: 'ING-MATCHA-01', unit: 'gram', minimum_stock: 150, reorder_point: 300, cost_per_unit: 850, status: 'active' },
	{ id: 'ing-5', name: 'Cup Plastik 16oz + Straw', sku: 'ING-CUP-16', unit: 'pcs', minimum_stock: 100, reorder_point: 250, cost_per_unit: 850, status: 'active' },
	{ id: 'ing-6', name: 'Butter Croissant Dough', sku: 'ING-CROIS-01', unit: 'pcs', minimum_stock: 15, reorder_point: 30, cost_per_unit: 11000, status: 'active' },
];

export const MOCK_STOCK: StockLevel[] = [
	{ id: 'stk-1', outlet_id: MOCK_OUTLET.id, ingredient_id: 'ing-1', ingredient_name: 'Biji Kopi Arabica Aceh Gayo', current_qty: 24.5, unit: 'kg', last_updated: '2026-10-12T10:00:00Z' },
	{ id: 'stk-2', outlet_id: MOCK_OUTLET.id, ingredient_id: 'ing-2', ingredient_name: 'Susu Fresh Milk Greenfield', current_qty: 18.2, unit: 'liter', last_updated: '2026-10-12T10:00:00Z' },
	{ id: 'stk-3', outlet_id: MOCK_OUTLET.id, ingredient_id: 'ing-3', ingredient_name: 'Gula Aren Organik Cair', current_qty: 28.0, unit: 'liter', last_updated: '2026-10-12T10:00:00Z' },
	{ id: 'stk-4', outlet_id: MOCK_OUTLET.id, ingredient_id: 'ing-4', ingredient_name: 'Pure Uji Matcha Powder', current_qty: 120.0, unit: 'gram', last_updated: '2026-10-12T10:00:00Z' },
	{ id: 'stk-5', outlet_id: MOCK_OUTLET.id, ingredient_id: 'ing-5', ingredient_name: 'Cup Plastik 16oz + Straw', current_qty: 480.0, unit: 'pcs', last_updated: '2026-10-12T10:00:00Z' },
];

export const MOCK_PRODUCTS: Product[] = [
	{
		id: 'prod-1',
		category_id: 'cat-1',
		category_name: 'Signature Coffee',
		sku: 'COF-AREN-01',
		name: 'Hanjo Aren Latte',
		description: 'Kopi susu gula aren autentik dengan crema espresso gayo yang tebal dan wangi karamel alami.',
		product_type: 'single',
		status: 'active',
		image_url: '☕',
		variants: [
			{
				id: 'var-aren-iced',
				name: 'Iced - Regular',
				sku: 'COF-AREN-ICED',
				price: 24000,
				cost: 7500,
				is_default: true,
				sort_order: 1,
				recipes: [
					{ ingredient_id: 'ing-1', ingredient_name: 'Biji Kopi Gayo', quantity: 0.018, unit: 'kg' },
					{ ingredient_id: 'ing-2', ingredient_name: 'Fresh Milk', quantity: 0.120, unit: 'liter' },
					{ ingredient_id: 'ing-3', ingredient_name: 'Gula Aren', quantity: 0.025, unit: 'liter' },
					{ ingredient_id: 'ing-5', ingredient_name: 'Cup 16oz', quantity: 1, unit: 'pcs' },
				]
			},
			{
				id: 'var-aren-hot',
				name: 'Hot - Regular',
				sku: 'COF-AREN-HOT',
				price: 22000,
				cost: 6800,
				is_default: false,
				sort_order: 2,
				recipes: [
					{ ingredient_id: 'ing-1', ingredient_name: 'Biji Kopi Gayo', quantity: 0.018, unit: 'kg' },
					{ ingredient_id: 'ing-2', ingredient_name: 'Fresh Milk', quantity: 0.150, unit: 'liter' },
					{ ingredient_id: 'ing-3', ingredient_name: 'Gula Aren', quantity: 0.020, unit: 'liter' },
				]
			}
		],
		modifier_groups: [
			{
				id: 'mg-sugar',
				name: 'Sugar Level',
				is_required: false,
				max_select: 1,
				sort_order: 1,
				options: [
					{ id: 'opt-s100', name: 'Normal Sugar (100%)', price_adjustment: 0, sort_order: 1 },
					{ id: 'opt-s50', name: 'Less Sugar (50%)', price_adjustment: 0, sort_order: 2 },
					{ id: 'opt-s0', name: 'No Sugar (0%)', price_adjustment: 0, sort_order: 3 },
				]
			},
			{
				id: 'mg-extra',
				name: 'Add-on Extra',
				is_required: false,
				max_select: 2,
				sort_order: 2,
				options: [
					{ id: 'opt-shot', name: 'Extra Espresso Shot', price_adjustment: 5000, sort_order: 1 },
					{ id: 'opt-oat', name: 'Swap Oat Milk (Oatside)', price_adjustment: 6000, sort_order: 2 },
				]
			}
		]
	},
	{
		id: 'prod-2',
		category_id: 'cat-2',
		category_name: 'Espresso Based',
		sku: 'COF-AME-01',
		name: 'Americano',
		description: 'Double shot espresso murni dengan air mineral segar. Body clean dengan hint citrus dan dark chocolate.',
		product_type: 'single',
		status: 'active',
		image_url: '🧊',
		variants: [
			{
				id: 'var-ame-iced',
				name: 'Iced',
				sku: 'COF-AME-ICED',
				price: 20000,
				cost: 4800,
				is_default: true,
				sort_order: 1,
				recipes: [
					{ ingredient_id: 'ing-1', ingredient_name: 'Biji Kopi Gayo', quantity: 0.018, unit: 'kg' },
					{ ingredient_id: 'ing-5', ingredient_name: 'Cup 16oz', quantity: 1, unit: 'pcs' },
				]
			},
			{
				id: 'var-ame-hot',
				name: 'Hot',
				sku: 'COF-AME-HOT',
				price: 18000,
				cost: 4200,
				is_default: false,
				sort_order: 2,
				recipes: [
					{ ingredient_id: 'ing-1', ingredient_name: 'Biji Kopi Gayo', quantity: 0.018, unit: 'kg' },
				]
			}
		],
		modifier_groups: []
	},
	{
		id: 'prod-3',
		category_id: 'cat-3',
		category_name: 'Non-Coffee',
		sku: 'NC-MAT-01',
		name: 'Kyoto Matcha Latte',
		description: 'Matcha grade seremonial Jepang dipadukan dengan steamed fresh milk gurih dan seimbang.',
		product_type: 'single',
		status: 'active',
		image_url: '🍵',
		variants: [
			{
				id: 'var-mat-iced',
				name: 'Iced',
				sku: 'NC-MAT-ICED',
				price: 28000,
				cost: 9200,
				is_default: true,
				sort_order: 1,
				recipes: [
					{ ingredient_id: 'ing-4', ingredient_name: 'Uji Matcha Powder', quantity: 15, unit: 'gram' },
					{ ingredient_id: 'ing-2', ingredient_name: 'Fresh Milk', quantity: 0.150, unit: 'liter' },
					{ ingredient_id: 'ing-5', ingredient_name: 'Cup 16oz', quantity: 1, unit: 'pcs' },
				]
			}
		],
		modifier_groups: [
			{
				id: 'mg-mat-sugar',
				name: 'Tingkat Manis',
				is_required: false,
				max_select: 1,
				sort_order: 1,
				options: [
					{ id: 'm-s1', name: 'Normal', price_adjustment: 0, sort_order: 1 },
					{ id: 'm-s2', name: 'Less Sweet', price_adjustment: 0, sort_order: 2 },
				]
			}
		]
	},
	{
		id: 'prod-4',
		category_id: 'cat-4',
		category_name: 'Pastry & Bakery',
		sku: 'PAS-CROIS-01',
		name: 'Butter Croissant Flaky',
		description: 'French style golden croissant dengan 100% butter Prancis asli. Renyah di luar dan lembut di dalam.',
		product_type: 'single',
		status: 'active',
		image_url: '🥐',
		variants: [
			{
				id: 'var-crois',
				name: 'Warm Baked',
				sku: 'PAS-CROIS-01',
				price: 22000,
				cost: 11000,
				is_default: true,
				sort_order: 1,
				recipes: [
					{ ingredient_id: 'ing-6', ingredient_name: 'Butter Croissant Dough', quantity: 1, unit: 'pcs' },
				]
			}
		],
		modifier_groups: []
	}
];

export async function fetchCategories(): Promise<Category[]> {
	try {
		const res = await fetch(`${API_BASE}/categories`);
		if (res.ok) {
			const json = await res.json();
			return json.data || json;
		}
	} catch (e) {
		console.warn('Backend offline, using mock categories', e);
	}
	return MOCK_CATEGORIES;
}

export async function fetchProducts(): Promise<Product[]> {
	try {
		const res = await fetch(`${API_BASE}/products`);
		if (res.ok) {
			const json = await res.json();
			return json.data || json;
		}
	} catch (e) {
		console.warn('Backend offline, using mock products', e);
	}
	return MOCK_PRODUCTS;
}

export function formatRupiah(amount: number): string {
	return 'Rp ' + amount.toLocaleString('id-ID');
}
