/**
 * Reactive Store: Lencana Navigasi (Svelte 5 Runes)
 * Referensi: PRD 8.4, AGENTS.md §2 & §3, MS-01 T-01.1 & T-01.3
 */

import { navService } from '../../../services/nav.service.js';
import { session } from '../../../auth/session.svelte.js';
import type { NavBadges } from '../../../api/contract/types.js';

class BadgesStore {
	badges = $state<NavBadges>({});
	isLoading = $state(false);
	error = $state<string | null>(null);

	/**
	 * Muat ulang badge dari API
	 */
	async refresh(): Promise<void> {
		try {
			this.isLoading = true;
			this.error = null;
			this.badges = await navService.getBadges(session.currentRole);
		} catch (err: any) {
			this.error = err?.message || 'Gagal memuat lencana navigasi';
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Mengambil jumlah lencana untuk kunci tertentu
	 */
	get(key?: string): number {
		if (!key) return 0;
		return this.badges[key] ?? 0;
	}
}

export const navBadges = new BadgesStore();
