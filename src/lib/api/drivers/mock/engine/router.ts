/**
 * Mock Request Router & Middleware Dispatcher
 * Referensi: MILESTONE.md §5
 *
 * Mengatur pencocokan rute (method + path), ekstraksi parameter URL,
 * dan eksekusi rantai middleware dalam urutan baku yang ditentukan dokumen milestone:
 * auth → feature_flag → permission → scope_outlet → validate → idempotency → period_guard → handler → audit → notify
 */

import type { ApiRequest, ApiResponse } from '../../../contract/types.js';
import { ApiErrors } from '../../../contract/errors.js';
import { latency } from './latency.js';

export interface RouteContext {
	req: ApiRequest;
	params: Record<string, string>;
	query: URLSearchParams;
	user?: any;
	state: Record<string, any>;
}

export type RouteHandler = (ctx: RouteContext) => Promise<any> | any;

export interface RouteMetadata {
	requireAuth?: boolean;
	featureFlag?: string;
	permission?: { action: string; resource: string } | string;
	requireStepUp?: boolean;
	checkPeriod?: boolean;
	description?: string;
}

export interface RouteDefinition {
	method: string;
	pattern: string;
	regex: RegExp;
	paramNames: string[];
	meta: RouteMetadata;
	handler: RouteHandler;
}

export type MiddlewareFn = (ctx: RouteContext, next: () => Promise<any>) => Promise<any>;

class MockRouter {
	private routes: RouteDefinition[] = [];
	private middlewares: MiddlewareFn[] = [];

	/**
	 * Mendaftarkan middleware global
	 */
	use(middleware: MiddlewareFn): void {
		this.middlewares.push(middleware);
	}

	/**
	 * Mendaftarkan endpoint ke tabel rute
	 */
	register(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		pathPattern: string,
		metaOrHandler: RouteMetadata | RouteHandler,
		maybeHandler?: RouteHandler
	): void {
		const meta: RouteMetadata = typeof metaOrHandler === 'function' ? {} : metaOrHandler;
		const handler: RouteHandler = typeof metaOrHandler === 'function' ? metaOrHandler : maybeHandler!;

		if (!handler) {
			throw new Error(`Handler tidak boleh kosong untuk rute ${method} ${pathPattern}`);
		}

		// Parse parameter path seperti :id, :key
		const paramNames: string[] = [];
		const regexStr = pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
			paramNames.push(name);
			return '([^/]+)';
		});

		const regex = new RegExp(`^${regexStr}$`);

		this.routes.push({
			method: method.toUpperCase(),
			pattern: pathPattern,
			regex,
			paramNames,
			meta,
			handler
		});
	}

	get(pattern: string, metaOrHandler: RouteMetadata | RouteHandler, handler?: RouteHandler): void {
		this.register('GET', pattern, metaOrHandler, handler);
	}

	post(pattern: string, metaOrHandler: RouteMetadata | RouteHandler, handler?: RouteHandler): void {
		this.register('POST', pattern, metaOrHandler, handler);
	}

	put(pattern: string, metaOrHandler: RouteMetadata | RouteHandler, handler?: RouteHandler): void {
		this.register('PUT', pattern, metaOrHandler, handler);
	}

	delete(pattern: string, metaOrHandler: RouteMetadata | RouteHandler, handler?: RouteHandler): void {
		this.register('DELETE', pattern, metaOrHandler, handler);
	}

	patch(pattern: string, metaOrHandler: RouteMetadata | RouteHandler, handler?: RouteHandler): void {
		this.register('PATCH', pattern, metaOrHandler, handler);
	}

	/**
	 * Menangani permintaan API yang masuk
	 */
	async dispatch(req: ApiRequest): Promise<any> {
		// 1. Terapkan latensi simulasi
		await latency.delay();

		// 2. Normalisasi path dan parsing query
		const url = new URL(req.path, 'http://localhost');
		const pathname = url.pathname;
		const method = req.method.toUpperCase();

		// 3. Cocokkan rute
		let matchedRoute: RouteDefinition | null = null;
		const params: Record<string, string> = {};

		for (const route of this.routes) {
			if (route.method !== method) continue;

			const match = pathname.match(route.regex);
			if (match) {
				matchedRoute = route;
				route.paramNames.forEach((name, index) => {
					params[name] = decodeURIComponent(match[index + 1]);
				});
				break;
			}
		}

		if (!matchedRoute) {
			throw ApiErrors.notFound(`Endpoint ${method} ${pathname} tidak ditemukan`);
		}

		// 4. Bangun konteks
		const ctx: RouteContext = {
			req,
			params,
			query: url.searchParams,
			state: {}
		};

		// 5. Eksekusi middleware chain lalu handler
		let index = 0;
		const runner = async (): Promise<any> => {
			if (index < this.middlewares.length) {
				const mw = this.middlewares[index++];
				return await mw(ctx, runner);
			}
			return await matchedRoute!.handler(ctx);
		};

		return await runner();
	}
}

export const router = new MockRouter();
