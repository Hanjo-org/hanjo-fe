/**
 * Simulasi Latensi Jaringan dan Injeksi Galat
 * Referensi: MILESTONE.md §5
 *
 * Menguji perilaku UI saat memuat (loading state) dan saat terjadi gangguan jaringan.
 */

export interface LatencyConfig {
	minMs: number;
	maxMs: number;
	errorRate: number; // 0.0 - 1.0 (mis. 0.05 = 5% kegagalan)
	enabled: boolean;
}

class MockLatencyManager {
	private config: LatencyConfig = {
		minMs: 50,
		maxMs: 250,
		errorRate: 0,
		enabled: true
	};

	configure(newConfig: Partial<LatencyConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	getConfig(): LatencyConfig {
		return { ...this.config };
	}

	/**
	 * Menjalankan delay buatan sebelum respons dikembalikan
	 */
	async delay(): Promise<void> {
		if (!this.config.enabled) return;

		// Cek injeksi galat acak (bila disetel)
		if (this.config.errorRate > 0 && Math.random() < this.config.errorRate) {
			const status = Math.random() < 0.5 ? 500 : 429;
			throw new Error(`[Mock Latency] Injeksi galat buatan: status ${status}`);
		}

		const delayMs =
			Math.floor(Math.random() * (this.config.maxMs - this.config.minMs + 1)) + this.config.minMs;

		if (delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}

export const latency = new MockLatencyManager();
