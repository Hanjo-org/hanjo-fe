/**
 * Logika Domain Murni: Validasi Menu, Varian, Modifier & Visibilitas Outlet (§MS-04)
 */

import type { MenuItem, ModifierGroup, BusinessDate } from '../api/contract/types.js';

export interface ModifierGroupValidationResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Validasi grup modifier:
 * - min_select <= max_select
 * - Opsi minimal sama dengan min_select bila min_select > 0
 * - Nilai min_select >= 0 dan max_select >= 1
 */
export function validateModifierGroup(group: Partial<ModifierGroup>): ModifierGroupValidationResult {
	const errors: string[] = [];

	const min = group.min_select ?? 0;
	const max = group.max_select ?? 1;

	if (min < 0) {
		errors.push('Batas minimum pilihan (min_select) tidak boleh negatif.');
	}

	if (max < 1) {
		errors.push('Batas maksimum pilihan (max_select) minimal 1.');
	}

	if (min > max) {
		errors.push(`Batas minimum pilihan (${min}) tidak boleh melebihi batas maksimum (${max}).`);
	}

	const optionsCount = group.options?.length ?? 0;
	if (min > 0 && optionsCount < min) {
		errors.push(
			`Grup modifier wajib (${min} pilihan) harus memiliki sekurang-kurangnya ${min} opsi pilihan (saat ini: ${optionsCount}).`
		);
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Menentukan apakah suatu menu item dapat dilihat / diakses oleh outlet tertentu (AC-04.7).
 * - all_outlets: berlaku di seluruh gerai
 * - outlet_set: hanya berlaku di outlet yang terdaftar di target_outlet_ids
 * - time_limited: hanya berlaku jika hari ini berada di antara available_from dan available_until
 */
export function isMenuItemVisibleForOutlet(
	item: MenuItem,
	outletId: string,
	currentDateStr?: BusinessDate
): boolean {
	if (item.status === 'archived') return false;

	// 1. Cek cakupan outlet
	if (item.scope_type === 'outlet_set') {
		const targetIds = item.target_outlet_ids || [];
		if (!targetIds.includes(outletId)) {
			return false;
		}
	}

	// 2. Cek jendela waktu jika menu bersifat musiman / terbatas waktu
	if (item.is_time_limited && currentDateStr) {
		if (item.available_from && currentDateStr < item.available_from) {
			return false;
		}
		if (item.available_until && currentDateStr > item.available_until) {
			return false;
		}
	}

	return true;
}
