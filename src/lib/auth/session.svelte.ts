/**
 * Sesi Pengguna & State Manajemen Autentikasi (Svelte 5 Runes)
 * Referensi: MILESTONE.md §7, T-00.8
 *
 * Mengelola state reaktif sesi login pengguna, peran aktif, outlet terpilih,
 * dan sinkronisasi hak akses can() terpusat.
 */

import type { User, UserRole, AuthLoginRequest, StepUpResponse } from '../api/contract/types.js';
import { Endpoints } from '../api/contract/endpoints.js';
import { apiClient } from '../api/client.js';
import { can as checkPermission, type CanContext } from './can.js';
import { getAccessibleOutlets, isInScope } from './scope.js';
import { isFeatureEnabled, type FeatureFlagKey } from '../config/feature_flags.js';

class SessionState {
	user = $state<User | null>(null);
	token = $state<string | null>(null);
	activeOutletId = $state<string>('*');
	featureFlags = $state<Record<string, boolean>>({});
	isLoading = $state<boolean>(true);
	error = $state<string | null>(null);

	// Derived state
	isAuthenticated = $derived(this.user !== null);
	role = $derived<UserRole | null>(this.user?.role ?? null);
	currentUser = $derived(this.user);
	currentRole = $derived<UserRole>(this.user?.role ?? 'owner');
	isStoreManager = $derived(this.user?.role === 'store_manager');
	accessibleOutlets = $derived(getAccessibleOutlets(this.user));
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
	 * Mengubah outlet aktif saat ini
	 */
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

			// Pulihkan outlet aktif atau sesuaikan dengan scope pengguna
			if (typeof window !== 'undefined') {
				const savedOutlet = localStorage.getItem('hanjo_active_outlet');
				if (savedOutlet && isInScope(this.user, savedOutlet)) {
					this.activeOutletId = savedOutlet === 'all' ? '*' : savedOutlet;
				} else {
					// Jika SM, otomatis pilih outlet tugas pertamanya
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

			if (this.user.role === 'store_manager' && this.user.outlet_ids?.length) {
				this.activeOutletId = this.user.outlet_ids[0];
			} else {
				this.activeOutletId = '*';
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
			this.activeOutletId = '*';
			this.isLoading = false;
			if (typeof window !== 'undefined') {
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

			// Jika beralih ke SM, otomatis kunci ke outlet tugasnya
			if (this.user.role === 'store_manager' && this.user.outlet_ids?.length) {
				this.activeOutletId = this.user.outlet_ids[0];
			} else {
				this.activeOutletId = '*';
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
