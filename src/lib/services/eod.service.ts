/**
 * Service: Status Tutup Hari / End of Day (EOD) (T-01.14, AC-01.12, AC-01.13)
 * Referensi: MILESTONE.md §MS-01, MS-01.md §T-01.14
 */

import { apiClient } from '../api/client.js';
import { Endpoints } from '../api/contract/endpoints.js';
import type {
	OutletEodStatusCardData,
	SmEodStatusCardData,
	CompleteEodRequest
} from '../api/contract/types.js';

export class EodService {
	/**
	 * Mengambil status EOD (outlet konsolidasi untuk Owner/Admin, atau checklist untuk SM)
	 */
	async getStatus(outletId?: string, date?: string, role?: string): Promise<OutletEodStatusCardData | SmEodStatusCardData> {
		const query: Record<string, unknown> = {};
		if (outletId) query.outlet_id = outletId;
		if (date) query.date = date;
		if (role) query.role = role;

		return apiClient.get<OutletEodStatusCardData | SmEodStatusCardData>(Endpoints.EOD.STATUS, { query });
	}

	/**
	 * SM menyelesaikan tutup hari operasional gerai (T-01.14 & AC-01.13)
	 */
	async completeEod(payload: CompleteEodRequest): Promise<SmEodStatusCardData> {
		return apiClient.post<SmEodStatusCardData>(Endpoints.EOD.COMPLETE, payload);
	}

	/**
	 * Mengambil ringkasan tutup hari harian seluruh gerai
	 */
	async getSummary(date?: string): Promise<OutletEodStatusCardData> {
		const query = date ? { date } : undefined;
		return apiClient.get<OutletEodStatusCardData>(Endpoints.EOD.SUMMARY, { query });
	}
}

export const eodService = new EodService();
