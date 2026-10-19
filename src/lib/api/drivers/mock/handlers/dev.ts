/**
 * Mock Handler: Panel Sumber Data & Dev Control (T-00.13, AC-00.7, AC-00.9)
 *
 * Mengelola status runtime mock: clock deterministik, latensi buatan,
 * dan reset seed demo ke kondisi awal.
 */

import { router } from '../engine/router.js';
import { clock } from '../engine/clock.js';
import { latency } from '../engine/latency.js';
import { db } from '../engine/db.js';

export function registerDevHandlers(): void {
	// GET /api/v1/dev/state
	router.register('GET', '/api/v1/dev/state', async () => {
		return {
			data: {
				data_source: 'mock',
				clock: {
					is_frozen: clock.isFrozen(),
					now_iso: clock.nowIso(),
					business_date: clock.businessDate()
				},
				latency: latency.getConfig(),
				active_seed: 'hanjo_erp_demo_seed_2026'
			}
		};
	});

	// POST /api/v1/dev/clock
	router.register('POST', '/api/v1/dev/clock', async (ctx) => {
		const body = (ctx.req.body as any) || {};
		const action = body.action;

		switch (action) {
			case 'freeze':
				clock.freeze(body.iso || clock.nowIso());
				break;
			case 'unfreeze':
				clock.unfreeze();
				break;
			case 'advance_hours':
				clock.advanceHours(body.hours || 1);
				break;
			case 'advance_days':
				clock.advanceDays(body.days || 1);
				break;
			case 'reset':
				clock.reset();
				break;
			default:
				break;
		}

		return {
			data: {
				success: true,
				is_frozen: clock.isFrozen(),
				now_iso: clock.nowIso(),
				business_date: clock.businessDate()
			}
		};
	});

	// POST /api/v1/dev/latency
	router.register('POST', '/api/v1/dev/latency', async (ctx) => {
		const body = (ctx.req.body as any) || {};
		latency.configure({
			minMs: body.min_ms ?? 0,
			maxMs: body.max_ms ?? 0,
			errorRate: body.error_rate ?? 0,
			enabled: body.enabled ?? true
		});

		return {
			data: {
				success: true,
				latency: latency.getConfig()
			}
		};
	});

	// POST /api/v1/dev/reset
	router.register('POST', '/api/v1/dev/reset', async () => {
		// Reset clock & in-memory state
		clock.reset();
		latency.configure({ minMs: 50, maxMs: 150, errorRate: 0, enabled: true });

		return {
			data: {
				success: true,
				message: 'Data demo dan clock berhasil di-reset ke kondisi awal',
				business_date: clock.businessDate()
			}
		};
	});
}
