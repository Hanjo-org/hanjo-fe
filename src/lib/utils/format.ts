/**
 * Utilitas Format Angka, Mata Uang Rupiah, dan Tanggal WIB
 * Referensi: MILESTONE.md §4.1, §4.2, T-00.4
 */

import { clock } from '../api/drivers/mock/engine/clock.js';

/**
 * Format angka atau string desimal menjadi Rupiah (mis. "Rp 25.000")
 */
export function formatRupiah(amount: number | string | null | undefined): string {
	if (amount === null || amount === undefined || amount === '') {
		return 'Rp 0';
	}

	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(num)) return 'Rp 0';

	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(num);
}

/**
 * Format angka standar Indonesia (mis. "1.250,50")
 */
export function formatNumber(
	val: number | string | null | undefined,
	minDecimals: number = 0,
	maxDecimals: number = 2
): string {
	if (val === null || val === undefined || val === '') return '0';
	const num = typeof val === 'string' ? parseFloat(val) : val;
	if (isNaN(num)) return '0';

	return new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: minDecimals,
		maximumFractionDigits: maxDecimals
	}).format(num);
}

/**
 * Format tanggal dalam zona waktu Asia/Jakarta (WIB)
 * Contoh: "15 Okt 2026, 14:30 WIB"
 */
export function formatDate(
	dateVal: string | Date | null | undefined,
	includeTime: boolean = false
): string {
	if (!dateVal) return '—';
	const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
	if (isNaN(d.getTime())) return '—';

	const options: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		...(includeTime
			? {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				}
			: {})
	};

	const formatted = new Intl.DateTimeFormat('id-ID', options).format(d);
	return includeTime ? `${formatted} WIB` : formatted;
}

/**
 * Format waktu relatif terhadap clock.now()
 * Contoh: "5 menit lalu", "2 jam lalu", "kemarin"
 */
export function relativeTime(dateVal: string | Date | null | undefined): string {
	if (!dateVal) return '—';
	const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
	if (isNaN(d.getTime())) return '—';

	const nowMs = clock.nowMs();
	const diffMs = nowMs - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return 'Baru saja';
	if (diffMin < 60) return `${diffMin} menit lalu`;
	if (diffHour < 24) return `${diffHour} jam lalu`;
	if (diffDay === 1) return 'Kemarin';
	if (diffDay < 30) return `${diffDay} hari lalu`;

	return formatDate(d);
}
