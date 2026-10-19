/**
 * HTTP Data Driver (untuk backend riil Go)
 * Referensi: MILESTONE.md §3.3
 *
 * Mengimplementasikan `DataDriver` menggunakan standard `fetch`.
 * Menyertakan header autentikasi token, `If-Match`, `Idempotency-Key`,
 * dan memetakan respon status HTTP ke `ApiResponse<T>`.
 */

import type { ApiRequest, ApiResponse, DataDriver, Envelope } from '../../contract/types.js';

export class HttpDriver implements DataDriver {
	private baseUrl: string;

	constructor(baseUrl: string = '') {
		this.baseUrl = baseUrl;
	}

	async request<T>(req: ApiRequest): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${req.path}`;
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...(req.headers || {})
		};

		if (req.idempotencyKey) {
			headers['Idempotency-Key'] = req.idempotencyKey;
		}

		if (req.ifMatchVersion !== undefined) {
			headers['If-Match'] = String(req.ifMatchVersion);
		}

		try {
			const res = await fetch(url, {
				method: req.method,
				headers,
				body: req.body ? JSON.stringify(req.body) : undefined,
				signal: req.signal
			});

			const responseHeaders: Record<string, string> = {};
			res.headers.forEach((val, key) => {
				responseHeaders[key.toLowerCase()] = val;
			});

			let body: Envelope<T>;
			const text = await res.text();
			try {
				body = text ? JSON.parse(text) : { data: null };
			} catch {
				body = {
					error: {
						code: 'server_error',
						message: 'Gagal melakukan parsing respon server JSON'
					}
				} as any;
			}

			return {
				status: res.status,
				headers: responseHeaders,
				body
			};
		} catch (error: any) {
			if (error.name === 'AbortError') {
				throw error;
			}

			return {
				status: 0,
				headers: {},
				body: {
					error: {
						code: 'server_error',
						message: error.message || 'Koneksi jaringan terputus'
					}
				} as any
			};
		}
	}
}

export const httpDriver = new HttpDriver();
