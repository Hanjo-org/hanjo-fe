/**
 * Service: Proyeksi Kartu Dashboard (MS-01B & MS-01C)
 * Referensi: PRD 8.1, MILESTONE.md §MS-01, AC-01.1
 *
 * Mengikuti Golden Rule 1: UI memanggil Domain Service -> ApiClient -> DataDriver.
 */

import { apiClient } from '../api/client.js';
import { Endpoints } from '../api/contract/endpoints.js';
import type {
	DashboardCardKey,
	DashboardCardQuery,
	DashboardCardResponse
} from '../api/contract/types.js';

export class DashboardService {
	/**
	 * Mengambil data proyeksi untuk satu kartu dashboard mandiri
	 */
	async getCard<T = unknown>(
		cardKey: DashboardCardKey,
		query?: DashboardCardQuery
	): Promise<DashboardCardResponse<T>> {
		return apiClient.get<DashboardCardResponse<T>>(Endpoints.NAV.DASHBOARD_CARDS(cardKey), {
			query: query as Record<string, unknown>
		});
	}
}

export const dashboardService = new DashboardService();
