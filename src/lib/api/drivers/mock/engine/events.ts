/**
 * In-Memory Event Bus untuk Domain Events
 * Referensi: MILESTONE.md §5
 *
 * Handler memancarkan event domain; subscriber memperbarui ledger,
 * proyeksi, notifikasi, dan audit log secara reaktif.
 */

import { clock } from './clock.js';

export type DomainEventType =
	| 'UserLoggedIn'
	| 'UserLoggedOut'
	| 'OutletCreated'
	| 'OutletActivated'
	| 'OutletDeactivated'
	| 'StockItemCreated'
	| 'StockMoved'
	| 'StockBelowMinimum'
	| 'GoodsReceived'
	| 'InvoiceVerified'
	| 'CostTrueUpPosted'
	| 'ApprovalRequested'
	| 'ApprovalDecided'
	| 'BillCreated'
	| 'PaymentRecorded'
	| 'PaymentVerified'
	| 'PettyCashExpenseCreated'
	| 'PettyCashVerified'
	| 'PeriodClosed'
	| 'PeriodReopened'
	| 'SaleIngested'
	| 'MenuProposalSubmitted'
	| 'MenuProposalDecided';

export interface DomainEvent<T = unknown> {
	eventId: string;
	eventType: DomainEventType;
	aggregateId: string;
	aggregateType: string;
	occurredAt: string; // ISO 8601 UTC dari clock.nowIso()
	payload: T;
	actorId?: string;
	outletId?: string;
}

export type DomainEventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

class MockEventBus {
	private listeners: Map<DomainEventType, Set<DomainEventHandler<any>>> = new Map();
	private allListeners: Set<DomainEventHandler<any>> = new Set();
	private eventHistory: DomainEvent[] = [];
	private maxHistory: number = 1000;

	/**
	 * Mendaftarkan handler untuk tipe event tertentu
	 */
	on<T = unknown>(eventType: DomainEventType, handler: DomainEventHandler<T>): () => void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}
		const set = this.listeners.get(eventType)!;
		set.add(handler);

		// Return unsubscribe function
		return () => {
			set.delete(handler);
		};
	}

	/**
	 * Mendaftarkan handler untuk semua event (mis. untuk audit logger)
	 */
	onAny(handler: DomainEventHandler<any>): () => void {
		this.allListeners.add(handler);
		return () => {
			this.allListeners.delete(handler);
		};
	}

	/**
	 * Memancarkan event domain ke semua subscriber
	 */
	async emit<T = unknown>(
		eventType: DomainEventType,
		aggregateId: string,
		aggregateType: string,
		payload: T,
		meta?: { actorId?: string; outletId?: string }
	): Promise<DomainEvent<T>> {
		const event: DomainEvent<T> = {
			eventId: crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}_${Math.random()}`,
			eventType,
			aggregateId,
			aggregateType,
			occurredAt: clock.nowIso(),
			payload,
			actorId: meta?.actorId,
			outletId: meta?.outletId
		};

		// Simpan di riwayat event
		this.eventHistory.push(event as DomainEvent);
		if (this.eventHistory.length > this.maxHistory) {
			this.eventHistory.shift();
		}

		// Panggil specific listeners
		const handlers = this.listeners.get(eventType);
		if (handlers) {
			for (const handler of handlers) {
				try {
					await handler(event);
				} catch (err) {
					console.error(`[EventBus] Error handling event ${eventType}:`, err);
				}
			}
		}

		// Panggil global listeners
		for (const handler of this.allListeners) {
			try {
				await handler(event);
			} catch (err) {
				console.error(`[EventBus] Error in global event handler for ${eventType}:`, err);
			}
		}

		return event;
	}

	/**
	 * Mendapatkan riwayat event yang tersimpan
	 */
	getHistory(filter?: { eventType?: DomainEventType; aggregateId?: string }): DomainEvent[] {
		return this.eventHistory.filter((evt) => {
			if (filter?.eventType && evt.eventType !== filter.eventType) return false;
			if (filter?.aggregateId && evt.aggregateId !== filter.aggregateId) return false;
			return true;
		});
	}

	/**
	 * Membersihkan riwayat dan listener
	 */
	clear(): void {
		this.eventHistory = [];
		this.listeners.clear();
		this.allListeners.clear();
	}
}

export const eventBus = new MockEventBus();
