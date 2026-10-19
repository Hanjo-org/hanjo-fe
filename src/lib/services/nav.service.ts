/**
 * Service: Shell, Navigasi, dan Notifikasi
 * Referensi: PRD 8.4, MILESTONE.md §MS-01, MS-01.md §T-01.3
 */

import { apiClient } from '../api/client.js';
import { Endpoints } from '../api/contract/endpoints.js';
import type { NavBadges, NotificationItem, SearchResultItem, UserRole } from '../api/contract/types.js';

export class NavService {
	/**
	 * Mengambil jumlah lencana navigasi (badges) aktif berdasarkan peran pengguna
	 */
	async getBadges(role?: UserRole): Promise<NavBadges> {
		const query = role ? { role } : undefined;
		return apiClient.get<NavBadges>(Endpoints.NAV.BADGES, { query });
	}

	/**
	 * Mengambil daftar notifikasi pengguna
	 */
	async getNotifications(): Promise<NotificationItem[]> {
		return apiClient.get<NotificationItem[]>(Endpoints.NAV.NOTIFICATIONS);
	}

	/**
	 * Menandai satu notifikasi telah dibaca
	 */
	async markNotificationAsRead(id: string): Promise<void> {
		await apiClient.post(`/api/v1/notifications/${id}/read`);
	}

	/**
	 * Menandai seluruh notifikasi telah dibaca
	 */
	async markAllNotificationsAsRead(): Promise<void> {
		await apiClient.post('/api/v1/notifications/read-all');
	}

	/**
	 * Pencarian entitas dan dokumen global (T-01.4, AC-01.7)
	 */
	async search(
		query: string,
		params?: { role?: UserRole; outlet_id?: string; types?: string }
	): Promise<SearchResultItem[]> {
		if (!query.trim()) return [];
		return apiClient.get<SearchResultItem[]>(Endpoints.NAV.SEARCH, {
			query: {
				q: query.trim(),
				...params
			}
		});
	}
}

export const navService = new NavService();

