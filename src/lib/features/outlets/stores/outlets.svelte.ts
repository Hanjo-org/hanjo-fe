/**
 * State Controller: Master Organisasi, Outlet, Grup & Mitra (MS-02)
 * Menggunakan Svelte 5 Runes ($state, $derived)
 */

import { organizationService } from '../../../services/organization.service.js';
import { session } from '../../../auth/session.svelte.js';
import type {
	Organization,
	Outlet,
	OutletGroup,
	OutletOwnership,
	DeactivationConflictData
} from '../../../api/contract/types.js';

export class OutletsStore {
	// State data
	organizations = $state<Organization[]>([]);
	outlets = $state<Outlet[]>([]);
	groups = $state<OutletGroup[]>([]);
	owners = $state<{ name: string; email?: string; phone?: string; outlet_count: number }[]>([]);

	// Filter state
	activeTab = $state<'outlets' | 'organizations' | 'groups' | 'owners'>('outlets');
	selectedOrgFilter = $state<string>('*');
	selectedOwnerTypeFilter = $state<'all' | 'own_company' | 'partner'>('all');
	selectedStatusFilter = $state<'all' | 'active' | 'inactive'>('all');
	selectedGroupFilter = $state<string>('all');
	searchQuery = $state<string>('');

	// Loading & Error states
	isLoading = $state<boolean>(false);
	error = $state<string | null>(null);

	// Modal & Drawer detail states
	selectedOutlet = $state<Outlet | null>(null);
	outletOwnerships = $state<OutletOwnership[]>([]);
	ownershipMeta = $state<{ has_empty_shares: boolean; total_share_pct: number } | null>(null);
	blockingConflict = $state<DeactivationConflictData | null>(null);

	// Derived state
	filteredOutlets = $derived.by(() => {
		let list = this.outlets;
		if (this.selectedOrgFilter && this.selectedOrgFilter !== '*') {
			list = list.filter((o) => o.organization_id === this.selectedOrgFilter);
		}
		if (this.selectedOwnerTypeFilter !== 'all') {
			list = list.filter((o) => o.owner_type === this.selectedOwnerTypeFilter);
		}
		if (this.selectedStatusFilter !== 'all') {
			list = list.filter((o) =>
				this.selectedStatusFilter === 'active' ? o.active !== false : o.active === false
			);
		}
		if (this.selectedGroupFilter !== 'all') {
			list = list.filter((o) => o.group_id === this.selectedGroupFilter);
		}
		if (this.searchQuery.trim()) {
			const q = this.searchQuery.toLowerCase();
			list = list.filter(
				(o) =>
					o.name.toLowerCase().includes(q) ||
					o.code.toLowerCase().includes(q) ||
					o.city.toLowerCase().includes(q)
			);
		}
		return list;
	});

	isPartnerOwnershipEnabled = $derived(
		session.featureFlags ? session.featureFlags.partner_ownership !== false : true
	);

	/**
	 * Memuat seluruh data pendukung master organisasi & outlet
	 */
	async loadAll(): Promise<void> {
		this.isLoading = true;
		this.error = null;
		try {
			await Promise.all([
				this.loadOrganizations(),
				this.loadOutlets(),
				this.loadGroups(),
				this.isPartnerOwnershipEnabled ? this.loadOwners() : Promise.resolve()
			]);
		} catch (err: any) {
			this.error = err.message || 'Gagal memuat data outlet dan organisasi.';
			console.error('[OutletsStore] Galat loadAll:', err);
		} finally {
			this.isLoading = false;
		}
	}

	async loadOrganizations(): Promise<void> {
		this.organizations = await organizationService.getOrganizations();
	}

	async loadOutlets(): Promise<void> {
		this.outlets = await organizationService.getOutlets({
			role: session.role || 'owner'
		});
	}

	async loadGroups(): Promise<void> {
		this.groups = await organizationService.getOutletGroups();
	}

	async loadOwners(): Promise<void> {
		if (!this.isPartnerOwnershipEnabled) return;
		try {
			this.owners = await organizationService.getOutletOwners();
		} catch (err) {
			console.warn('[OutletsStore] loadOwners skipped (feature disabled or error):', err);
		}
	}

	async loadOutletOwnerships(outletId: string): Promise<void> {
		if (!this.isPartnerOwnershipEnabled) {
			this.outletOwnerships = [];
			return;
		}
		try {
			this.outletOwnerships = await organizationService.getOutletOwnerships(outletId);
		} catch (err) {
			this.outletOwnerships = [];
		}
	}

	// -------------------------------------------------------------------------
	// Aksi Mutasi Organisasi
	// -------------------------------------------------------------------------

	async createOrganization(data: Partial<Organization>): Promise<Organization> {
		const newOrg = await organizationService.createOrganization(data);
		await this.loadOrganizations();
		return newOrg;
	}

	async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
		const updated = await organizationService.updateOrganization(id, data);
		await this.loadOrganizations();
		return updated;
	}

	async activateOrganization(id: string): Promise<void> {
		await organizationService.activateOrganization(id);
		await this.loadOrganizations();
	}

	async deactivateOrganization(id: string): Promise<{ success: boolean; conflict?: DeactivationConflictData }> {
		try {
			await organizationService.deactivateOrganization(id);
			await this.loadOrganizations();
			return { success: true };
		} catch (err: any) {
			if (err.details?.blocking_documents) {
				const conflict: DeactivationConflictData = {
					can_deactivate: false,
					message: err.message,
					blocking_documents: err.details.blocking_documents
				};
				this.blockingConflict = conflict;
				return { success: false, conflict };
			}
			throw err;
		}
	}

	// -------------------------------------------------------------------------
	// Aksi Mutasi Outlet
	// -------------------------------------------------------------------------

	async createOutlet(data: Partial<Outlet>): Promise<Outlet> {
		const newOutlet = await organizationService.createOutlet(data);
		await Promise.all([this.loadOutlets(), this.loadOrganizations()]);
		return newOutlet;
	}

	async updateOutlet(id: string, data: Partial<Outlet>): Promise<Outlet> {
		const updated = await organizationService.updateOutlet(id, data);
		await Promise.all([this.loadOutlets(), this.loadOrganizations()]);
		return updated;
	}

	async activateOutlet(id: string): Promise<void> {
		await organizationService.activateOutlet(id);
		await Promise.all([this.loadOutlets(), this.loadOrganizations()]);
	}

	async deactivateOutlet(id: string): Promise<{ success: boolean; conflict?: DeactivationConflictData }> {
		try {
			await organizationService.deactivateOutlet(id);
			await Promise.all([this.loadOutlets(), this.loadOrganizations()]);
			return { success: true };
		} catch (err: any) {
			if (err.details?.blocking_documents) {
				const conflict: DeactivationConflictData = {
					can_deactivate: false,
					message: err.message,
					blocking_documents: err.details.blocking_documents
				};
				this.blockingConflict = conflict;
				return { success: false, conflict };
			}
			throw err;
		}
	}

	// -------------------------------------------------------------------------
	// Aksi Mutasi Grup & Kepemilikan
	// -------------------------------------------------------------------------

	async createGroup(data: Partial<OutletGroup>): Promise<OutletGroup> {
		const newGrp = await organizationService.createOutletGroup(data);
		await this.loadGroups();
		return newGrp;
	}

	async saveOwnerships(outletId: string, ownerships: OutletOwnership[]): Promise<void> {
		const updated = await organizationService.saveOutletOwnerships(outletId, ownerships);
		this.outletOwnerships = updated;
		await Promise.all([this.loadOutlets(), this.loadOwners()]);
	}
}

export const outletsStore = new OutletsStore();
