/**
 * Toast Notification Reactive Store (Svelte 5 Runes)
 * Referensi: MILESTONE.md §T-00.3, AGENTS.md §2
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
	id: string;
	title: string;
	message?: string;
	type: ToastType;
	duration?: number;
	dismissible?: boolean;
	createdAt: number;
}

class ToastManager {
	private _items = $state<ToastItem[]>([]);
	private _timerMap = new Map<string, number>();

	get items(): ToastItem[] {
		return this._items;
	}

	add(options: {
		title: string;
		message?: string;
		type?: ToastType;
		duration?: number;
		dismissible?: boolean;
	}): string {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
		const duration = options.duration ?? 4000;
		const dismissible = options.dismissible ?? true;

		const newItem: ToastItem = {
			id,
			title: options.title,
			message: options.message,
			type: options.type ?? 'info',
			duration,
			dismissible,
			createdAt: Date.now()
		};

		// Tambahkan di awal daftar (paling baru di atas)
		this._items = [newItem, ...this._items].slice(0, 5); // Maksimal 5 toast sekaligus

		if (duration > 0) {
			const timerId = window.setTimeout(() => {
				this.dismiss(id);
			}, duration);
			this._timerMap.set(id, timerId);
		}

		return id;
	}

	dismiss(id: string) {
		const timer = this._timerMap.get(id);
		if (timer) {
			clearTimeout(timer);
			this._timerMap.delete(id);
		}
		this._items = this._items.filter((item) => item.id !== id);
	}

	clear() {
		this._timerMap.forEach((timer) => clearTimeout(timer));
		this._timerMap.clear();
		this._items = [];
	}

	success(title: string, message?: string, duration?: number): string {
		return this.add({ title, message, type: 'success', duration });
	}

	error(title: string, message?: string, duration?: number): string {
		return this.add({ title, message, type: 'error', duration: duration ?? 6000 });
	}

	warning(title: string, message?: string, duration?: number): string {
		return this.add({ title, message, type: 'warning', duration: duration ?? 5000 });
	}

	info(title: string, message?: string, duration?: number): string {
		return this.add({ title, message, type: 'info', duration });
	}
}

export const toast = new ToastManager();
