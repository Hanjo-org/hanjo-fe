/**
 * Service: Organisasi, Multi-Outlet, Grup & Mitra (MS-02)
 * Referensi: PRD 8.1, MILESTONE.md §MS-02, Invarian Monorepo §2.2
 *
 * Mengikuti Golden Rule 1: UI memanggil Domain Service -> ApiClient -> DataDriver.
 */

import { apiClient } from '../api/client.js';
import { Endpoints } from '../api/contract/endpoints.js';
import type {
	Organization,
	Outlet,
	OutletGroup,
	OutletOwnership
} from '../api/contract/types.js';

export interface OutletFilterQuery {
	organization_id?: string;
	owner_type?: string;
	status?: string;
	group_id?: string;
	search?: string;
	role?: string;
}

export interface OrgFilterQuery {
	search?: string;
	status?: string;
}

export class OrganizationService {
	// =========================================================================
	// 1. Organisasi Induk
	// =========================================================================

	async getOrganizations(query?: OrgFilterQuery): Promise<Organization[]> {
		return apiClient.get<Organization[]>(Endpoints.ORG.ORGANIZATIONS, {
			query: query as Record<string, unknown>
		});
	}

	async getOrganization(id: string): Promise<Organization> {
		return apiClient.get<Organization>(Endpoints.ORG.ORGANIZATION_DETAIL(id));
	}

	async createOrganization(data: Partial<Organization>): Promise<Organization> {
		return apiClient.post<Organization>(Endpoints.ORG.ORGANIZATIONS, data);
	}

	async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
		return apiClient.put<Organization>(Endpoints.ORG.ORGANIZATION_DETAIL(id), data);
	}

	async activateOrganization(id: string): Promise<Organization> {
		return apiClient.post<Organization>(Endpoints.ORG.ORGANIZATION_ACTIVATE(id));
	}

	async deactivateOrganization(id: string): Promise<Organization> {
		return apiClient.post<Organization>(Endpoints.ORG.ORGANIZATION_DEACTIVATE(id));
	}

	// =========================================================================
	// 2. Outlet / Gerai
	// =========================================================================

	async getOutlets(query?: OutletFilterQuery): Promise<Outlet[]> {
		return apiClient.get<Outlet[]>(Endpoints.ORG.OUTLETS, {
			query: query as Record<string, unknown>
		});
	}

	async getOutlet(id: string, role?: string): Promise<Outlet> {
		return apiClient.get<Outlet>(Endpoints.ORG.OUTLET_DETAIL(id), {
			query: role ? { role } : undefined
		});
	}

	async getOutletById(id: string, role?: string): Promise<Outlet> {
		return this.getOutlet(id, role);
	}

	async createOutlet(data: Partial<Outlet>): Promise<Outlet> {
		return apiClient.post<Outlet>(Endpoints.ORG.OUTLETS, data);
	}

	async updateOutlet(id: string, data: Partial<Outlet>): Promise<Outlet> {
		return apiClient.put<Outlet>(Endpoints.ORG.OUTLET_DETAIL(id), data);
	}

	async activateOutlet(id: string): Promise<Outlet> {
		return apiClient.post<Outlet>(Endpoints.ORG.OUTLET_ACTIVATE(id));
	}

	async deactivateOutlet(id: string): Promise<Outlet> {
		return apiClient.post<Outlet>(Endpoints.ORG.OUTLET_DEACTIVATE(id));
	}

	// =========================================================================
	// 3. Grup Outlet
	// =========================================================================

	async getOutletGroups(): Promise<OutletGroup[]> {
		return apiClient.get<OutletGroup[]>(Endpoints.ORG.OUTLET_GROUPS);
	}

	async createOutletGroup(data: Partial<OutletGroup>): Promise<OutletGroup> {
		return apiClient.post<OutletGroup>(Endpoints.ORG.OUTLET_GROUPS, data);
	}

	// =========================================================================
	// 4. Kepemilikan Mitra / Investor (Flag: partner_ownership)
	// =========================================================================

	async getOutletOwners(): Promise<{ name: string; email?: string; phone?: string; outlet_count: number }[]> {
		return apiClient.get(Endpoints.ORG.OUTLET_OWNERS);
	}

	async getOutletOwnerships(outletId: string): Promise<OutletOwnership[]> {
		return apiClient.get<OutletOwnership[]>(Endpoints.ORG.OUTLET_OWNERSHIPS(outletId));
	}

	async saveOutletOwnerships(outletId: string, ownerships: OutletOwnership[]): Promise<OutletOwnership[]> {
		return apiClient.post<OutletOwnership[]>(Endpoints.ORG.OUTLET_OWNERSHIPS(outletId), { ownerships });
	}
}

export const organizationService = new OrganizationService();
