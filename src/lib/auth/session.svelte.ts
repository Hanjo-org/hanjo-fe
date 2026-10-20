/**
 * Sesi Pengguna & State Manajemen Autentikasi (Svelte 5 Runes)
 * Referensi: MILESTONE.md §7, T-00.8, T-01.2
 *
 * Mengelola state reaktif sesi login pengguna, peran aktif, organisasi aktif,
 * outlet terpilih, dan sinkronisasi hak akses can() terpusat.
 */

import type { User, UserRole, AuthLoginRequest, StepUpResponse, Organization, Outlet } from '../api/contract/types.js';
import { Endpoints } from '../api/contract/endpoints.js';
import { apiClient } from '../api/client.js';
import { can as checkPermission, type CanContext } from './can.js';
import {
	DEMO_ORGANIZATIONS,
	DEMO_OUTLETS,
	getAccessibleOrganizations,
	getAccessibleOutlets,
	getAccessibleOutletEntities,
	isOrgInScope,
	isInScope
} from './scope.js';
import { isFeatureEnabled, type FeatureFlagKey } from '../config/feature_flags.js';
import { DEMO_USERS, DEMO_USERS_BY_ROLE } from '../config/demo_accounts.js';

function getInitialUser(): User | null {
	if (typeof window !== 'undefined' && window.localStorage) {
		const savedUserId = localStorage.getItem('hanjo_mock_user_id');
		if (savedUserId && DEMO_USERS[savedUserId]) {
			return DEMO_USERS[savedUserId];
		}
		const savedRole = localStorage.getItem('hanjo_mock_user_role') as UserRole;
		if (savedRole && DEMO_USERS_BY_ROLE[savedRole]) {
			return DEMO_USERS_BY_ROLE[savedRole];
		}
	}
	return DEMO_USERS['usr-rina'];
}

function getInitialOrg(user: User | null): string {
	if (typeof window !== 'undefined' && window.localStorage) {
		const saved = localStorage.getItem('hanjo_active_org');
		if (saved && isOrgInScope(user, saved)) {
			return saved === 'all' ? '*' : saved;
		}
	}
	if (user?.role === 'store_manager') {
		return user.organization_id || 'org-jodi';
	}
	return '*';
}

function getInitialOutlet(user: User | null): string {
	if (typeof window !== 'undefined' && window.localStorage) {
		const saved = localStorage.getItem('hanjo_active_outlet');
		if (saved && isInScope(user, saved)) {
			return saved === 'all' ? '*' : saved;
		}
	}
	if (user?.role === 'store_manager' && user.outlet_ids?.length) {
		return user.outlet_ids[0];
	}
	return '*';
}

const initialUser = getInitialUser();

class SessionState {
	user = $state<User | null>(initialUser);
	token = $state<string | null>(initialUser ? `mock-token-${initialUser.id}` : null);
	activeOrganizationId = $state<string>(getInitialOrg(initialUser));
	activeOutletId = $state<string>(getInitialOutlet(initialUser));
	featureFlags = $state<Record<string, boolean>>({});
	isLoading = $state<boolean>(false);
	error = $state<string | null>(null);

	// Derived state
	isAuthenticated = $derived(this.user !== null);
	role = $derived<UserRole | null>(this.user?.role ?? null);
	currentUser = $derived(this.user);
	currentRole = $derived<UserRole>(this.user?.role ?? 'owner');
	isStoreManager = $derived(this.user?.role === 'store_manager');

	// Hirarki Organisasi & Outlet yang boleh diakses pengguna aktif
	accessibleOrganizations = $derived<Organization[]>(getAccessibleOrganizations(this.user));
	accessibleOutlets = $derived<string[]>(getAccessibleOutlets(this.user));
	accessibleOutletEntities = $derived<Outlet[]>(
		getAccessibleOutletEntities(this.user, this.activeOrganizationId)
	);

	// Label aktif
	activeOrganization = $derived(
		this.activeOrganizationId === '*' || this.activeOrganizationId === 'all'
			? null
			: DEMO_ORGANIZATIONS.find((o) => o.id === this.activeOrganizationId) || null
	);

	private _businessDate = $state<string>('2026-10-13');

	get businessDate(): string {
		return this._businessDate;
	}

	/**
	 * Cek otorisasi untuk user yang sedang aktif di sesi ini
	 */
	can(actionOrPermission: string, resourceOrContext?: string | CanContext, maybeContext?: CanContext): boolean {
		const context: CanContext = typeof resourceOrContext === 'object'
			? { ...resourceOrContext }
			: { ...(maybeContext || {}) };

		// Otomatis gunakan outlet aktif jika context belum menyertakannya
		if (!context.outletId && this.activeOutletId && this.activeOutletId !== '*') {
			context.outletId = this.activeOutletId;
		}

		return checkPermission(this.user, actionOrPermission, resourceOrContext, context);
	}

	/**
	 * Cek apakah sebuah feature flag aktif pada sesi ini
	 */
	hasFeature(flag: FeatureFlagKey): boolean {
		return isFeatureEnabled(flag, this.featureFlags);
	}

	/**
	 * Mengubah organisasi aktif saat ini
	 */
	setOrganization(orgId: string): void {
		const normalizedOrgId = orgId === 'all' ? '*' : orgId;
		if (this.user && !isOrgInScope(this.user, normalizedOrgId)) {
			console.warn(`[Session] Organisasi ${normalizedOrgId} di luar cakupan akses pengguna ${this.user.name}`);
			return;
		}

		this.activeOrganizationId = normalizedOrgId;

		// Jika outlet aktif saat ini tidak berada di bawah organisasi yang baru dipilih, reset ke '*'
		if (this.activeOutletId && this.activeOutletId !== '*') {
			const currentOutlet = DEMO_OUTLETS.find((o) => o.id === this.activeOutletId);
			if (currentOutlet && normalizedOrgId !== '*' && currentOutlet.organization_id !== normalizedOrgId) {
				// Bila SM, pilih outlet pertama dalam organisasi tersebut
				if (this.isStoreManager) {
					const orgOutlets = this.accessibleOutletEntities;
					this.activeOutletId = orgOutlets[0]?.id || '*';
				} else {
					this.activeOutletId = '*';
				}
			}
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('hanjo_active_org', normalizedOrgId);
			localStorage.setItem('hanjo_active_outlet', this.activeOutletId);
		}
	}

	/**
	 * Mengubah outlet aktif saat ini
	 */
	setActiveOutlet(outletId: string): void {
		const normalizedId = outletId === 'all' ? '*' : outletId;
		if (this.user && !isInScope(this.user, normalizedId)) {
			console.warn(`[Session] Outlet ${normalizedId} di luar cakupan akses pengguna ${this.user.name}`);
			return;
		}

		this.activeOutletId = normalizedId;

		// Jika memilih outlet spesifik, otomatis sinkronkan organisasi aktifnya
		if (normalizedId !== '*') {
			const found = DEMO_OUTLETS.find((o) => o.id === normalizedId);
			if (found && found.organization_id) {
				this.activeOrganizationId = found.organization_id;
				if (typeof window !== 'undefined') {
					localStorage.setItem('hanjo_active_org', found.organization_id);
				}
			}
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('hanjo_active_outlet', normalizedId);
		}
	}

	setOutlet(outletId: string): void {
		this.setActiveOutlet(outletId);
	}

	/**
	 * Inisialisasi sesi dari backend/mock saat aplikasi pertama kali dimuat
	 */
	async init(): Promise<void> {
		this.isLoading = true;
		this.error = null;

		try {
			const res = await apiClient.get<{
				user: User;
				feature_flags: Record<string, boolean>;
				permissions: string[];
				business_date?: string;
			}>(Endpoints.AUTH.ME);

			this.user = res.user;
			this.featureFlags = res.feature_flags || {};
			if (res.business_date) {
				this._businessDate = res.business_date;
			}

			// Pulihkan organisasi & outlet aktif atau sesuaikan dengan scope pengguna
			if (typeof window !== 'undefined') {
				localStorage.setItem('hanjo_mock_user_id', res.user.id);
				localStorage.setItem('hanjo_mock_user_role', res.user.role);

				const savedOrg = localStorage.getItem('hanjo_active_org');
				const savedOutlet = localStorage.getItem('hanjo_active_outlet');

				if (savedOrg && isOrgInScope(this.user, savedOrg)) {
					this.activeOrganizationId = savedOrg === 'all' ? '*' : savedOrg;
				} else if (this.user.role === 'store_manager') {
					this.activeOrganizationId = this.user.organization_id || 'org-jodi';
				} else {
					this.activeOrganizationId = '*';
				}

				if (savedOutlet && isInScope(this.user, savedOutlet)) {
					this.activeOutletId = savedOutlet === 'all' ? '*' : savedOutlet;
				} else {
					// Jika SM, otomatis pilih outlet tugas pertamanya atau biarkan '*' jika multi-outlet
					if (this.user.role === 'store_manager' && this.user.outlet_ids?.length) {
						this.activeOutletId = this.user.outlet_ids[0];
					} else {
						this.activeOutletId = '*';
					}
				}
			}
		} catch (err: any) {
			this.user = null;
			this.error = err.message || 'Gagal memuat sesi pengguna';
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Masuk menggunakan kredensial atau peran demo
	 */
	async login(emailOrPayload: string | AuthLoginRequest, maybePassword?: string): Promise<User> {
		this.isLoading = true;
		this.error = null;

		const payload: AuthLoginRequest = typeof emailOrPayload === 'string'
			? { email: emailOrPayload, password: maybePassword || '' }
			: emailOrPayload;

		try {
			const res = await apiClient.post<{
				token: string;
				user: User;
				feature_flags: Record<string, boolean>;
			}>(Endpoints.AUTH.LOGIN, payload);

			this.token = res.token;
			this.user = res.user;
			this.featureFlags = res.feature_flags || {};

			if (this.user.role === 'store_manager') {
				this.activeOrganizationId = this.user.organization_id || 'org-jodi';
				if (this.user.outlet_ids?.length) {
					this.activeOutletId = this.user.outlet_ids[0];
				} else {
					this.activeOutletId = '*';
				}
			} else {
				this.activeOrganizationId = '*';
				this.activeOutletId = '*';
			}

			if (typeof window !== 'undefined') {
				localStorage.setItem('hanjo_mock_user_id', this.user.id);
				localStorage.setItem('hanjo_mock_user_role', this.user.role);
				localStorage.setItem('hanjo_active_org', this.activeOrganizationId);
				localStorage.setItem('hanjo_active_outlet', this.activeOutletId);
			}

			return this.user;
		} catch (err: any) {
			this.error = err.message || 'Login gagal';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Keluar dari sesi
	 */
	async logout(): Promise<void> {
		this.isLoading = true;
		try {
			await apiClient.post(Endpoints.AUTH.LOGOUT);
		} finally {
			this.user = null;
			this.token = null;
			this.activeOrganizationId = '*';
			this.activeOutletId = '*';
			this.isLoading = false;
			if (typeof window !== 'undefined') {
				localStorage.removeItem('hanjo_mock_user_id');
				localStorage.removeItem('hanjo_mock_user_role');
				localStorage.removeItem('hanjo_active_org');
				localStorage.removeItem('hanjo_active_outlet');
			}
		}
	}

	/**
	 * Pengalih peran instan (Dev-Only Switch Role)
	 */
	async switchRole(role?: UserRole, userId?: string): Promise<User> {
		this.isLoading = true;
		try {
			const payload: Record<string, unknown> = {};
			if (role) payload.role = role;
			if (userId) payload.userId = userId;

			const res = await apiClient.post<{
				token: string;
				user: User;
				feature_flags: Record<string, boolean>;
			}>(Endpoints.AUTH.DEV_SWITCH_ROLE, payload);

			this.token = res.token;
			this.user = res.user;
			this.featureFlags = res.feature_flags || {};

			// Jika beralih ke SM, otomatis kunci ke organisasi dan outlet tugasnya
			if (this.user.role === 'store_manager') {
				this.activeOrganizationId = this.user.organization_id || 'org-jodi';
				if (this.user.outlet_ids?.length) {
					this.activeOutletId = this.user.outlet_ids[0];
				} else {
					this.activeOutletId = '*';
				}
			} else {
				this.activeOrganizationId = '*';
				this.activeOutletId = '*';
			}

			if (typeof window !== 'undefined') {
				localStorage.setItem('hanjo_mock_user_id', this.user.id);
				localStorage.setItem('hanjo_mock_user_role', this.user.role);
				localStorage.setItem('hanjo_active_org', this.activeOrganizationId);
				localStorage.setItem('hanjo_active_outlet', this.activeOutletId);
			}

			return this.user;
		} catch (err: any) {
			this.error = err.message || 'Gagal mengganti peran';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Verifikasi Step-Up untuk aksi-aksi sensitif (mis. buka periode atau persetujuan bernilai besar)
	 */
	async verifyStepUp(passwordOrPin: string): Promise<StepUpResponse> {
		return await apiClient.post<StepUpResponse>(Endpoints.AUTH.STEP_UP, {
			password: passwordOrPin
		});
	}
}

export const session = new SessionState();
