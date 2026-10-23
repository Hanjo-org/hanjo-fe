/**
 * Logika Domain Murni: Channel Pricing & Pembulatan (§6.1)
 *
 * Formula: harga_akhir = pembulatan((harga_dasar + Σ price_delta) × (1 + markup_pct/100))
 * Mode pembulatan: 'nearest' | 'up' | 'down'
 * Langkah pembulatan: 100 | 500 | 1000
 *
 * Vektor Uji (§6.1):
 * 1. dasar 28.000, modifier +3.000, markup 5%, nearest 500 = 32.500
 * 2. dasar 28.000, tanpa modifier, markup 0% = 28.000
 * 3. dasar 25.000, markup 5%, up 1.000 = 27.000
 */

import type { DecimalString, PricingRoundingRule } from '../api/contract/types.js';

export interface ChannelPricingInput {
	basePrice: number | string;
	modifierPriceDeltas?: (number | string)[];
	markupPct?: number | string; // e.g. 5 atau "5.00"
	roundingMode?: 'nearest' | 'up' | 'down';
	roundingStep?: 100 | 500 | 1000;
}

export interface ChannelPricingResult {
	basePrice: DecimalString;
	modifierTotalDelta: DecimalString;
	subtotalBeforeMarkup: DecimalString;
	markupPct: DecimalString;
	markupAmount: DecimalString;
	rawPrice: DecimalString;
	roundingMode: 'nearest' | 'up' | 'down';
	roundingStep: number;
	finalPrice: DecimalString;
	finalPriceNumber: number;
	formulaText: string;
}

/**
 * Menerapkan aturan pembulatan angka ke kelipatan langkah tertentu.
 */
export function applyRounding(
	amount: number,
	mode: 'nearest' | 'up' | 'down' = 'nearest',
	step: number = 500
): number {
	if (step <= 0) return Math.round(amount);

	const ratio = amount / step;

	let roundedUnits = 0;
	if (mode === 'up') {
		roundedUnits = Math.ceil(ratio);
	} else if (mode === 'down') {
		roundedUnits = Math.floor(ratio);
	} else {
		// nearest
		roundedUnits = Math.round(ratio);
	}

	return roundedUnits * step;
}

/**
 * Menghitung harga jual akhir channel berdasarkan harga dasar, delta modifier, markup persentase,
 * dan aturan pembulatan (§6.1).
 */
export function calculateChannelPrice(input: ChannelPricingInput): ChannelPricingResult {
	const base = typeof input.basePrice === 'string' ? parseFloat(input.basePrice) || 0 : input.basePrice;
	
	const deltas = (input.modifierPriceDeltas || []).map((d) =>
		typeof d === 'string' ? parseFloat(d) || 0 : d
	);
	const totalModifierDelta = deltas.reduce((acc, curr) => acc + curr, 0);

	const subtotal = base + totalModifierDelta;

	const markupPctNum =
		typeof input.markupPct === 'string' ? parseFloat(input.markupPct) || 0 : input.markupPct ?? 0;

	const markupMultiplier = 1 + markupPctNum / 100;
	const rawPrice = subtotal * markupMultiplier;
	const markupAmount = rawPrice - subtotal;

	const mode = input.roundingMode || 'nearest';
	const step = input.roundingStep || 500;

	const finalPriceNumber = applyRounding(rawPrice, mode, step);

	const formulaText = `pembulatan((${base.toLocaleString('id-ID')} + ${totalModifierDelta.toLocaleString('id-ID')}) × (1 + ${markupPctNum}%)) [${mode} ${step}] = ${finalPriceNumber.toLocaleString('id-ID')}`;

	return {
		basePrice: base.toFixed(2),
		modifierTotalDelta: totalModifierDelta.toFixed(2),
		subtotalBeforeMarkup: subtotal.toFixed(2),
		markupPct: markupPctNum.toFixed(2),
		markupAmount: markupAmount.toFixed(2),
		rawPrice: rawPrice.toFixed(2),
		roundingMode: mode,
		roundingStep: step,
		finalPrice: finalPriceNumber.toFixed(2),
		finalPriceNumber,
		formulaText
	};
}
