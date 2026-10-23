/**
 * Service: Master Pemasok / Suppliers (MS-03)
 * Referensi: MILESTONE.md §MS-03, AGENTS.md Golden Rule 1
 *
 * Mengikuti Golden Rule 1: UI -> Domain Service -> ApiClient -> DataDriver.
 */

import { apiClient } from '../api/client.js';
import { Endpoints } from '../api/contract/endpoints.js';
import type { Supplier } from '../api/contract/types.js';

export interface SupplierFilterQuery {
	type?: string;
	status?: string;
	search?: string;
}

export class SupplierService {
	async getSuppliers(query?: SupplierFilterQuery): Promise<Supplier[]> {
		return apiClient.get<Supplier[]>(Endpoints.CATALOG.SUPPLIERS, {
			query: query as Record<string, unknown>
		});
	}

	async getSupplier(id: string): Promise<Supplier> {
		return apiClient.get<Supplier>(Endpoints.CATALOG.SUPPLIER_DETAIL(id));
	}

	async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
		return apiClient.post<Supplier>(Endpoints.CATALOG.SUPPLIERS, data);
	}

	async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
		return apiClient.put<Supplier>(Endpoints.CATALOG.SUPPLIER_DETAIL(id), data);
	}

	async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
		return apiClient.delete<{ success: boolean; message: string }>(Endpoints.CATALOG.SUPPLIER_DETAIL(id));
	}
}

export const supplierService = new SupplierService();
