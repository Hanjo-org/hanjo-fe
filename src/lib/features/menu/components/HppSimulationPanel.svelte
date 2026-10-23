<script lang="ts">
	/**
	 * Komponen Panel Simulasi HPP Dinamis Varian per Outlet (§6.4, T-04.7, AC-04.2, AC-04.9)
	 */
	import { menuStore } from '../stores/menu.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Skeleton from '../../../components/feedback/Skeleton.svelte';

	interface Props {
		variantId?: string;
		variantName?: string;
	}

	let { variantId = menuStore.simVariantId || 'var-aren-iced', variantName = 'Varian Menu' }: Props = $props();

	// Perbarui variantId di store bila prop berubah
	$effect(() => {
		if (variantId && menuStore.simVariantId !== variantId) {
			menuStore.simVariantId = variantId;
			menuStore.refreshHppSimulation();
		}
	});

	function toggleOption(optId: string) {
		if (menuStore.simSelectedOptionIds.includes(optId)) {
			menuStore.simSelectedOptionIds = menuStore.simSelectedOptionIds.filter((id) => id !== optId);
		} else {
			menuStore.simSelectedOptionIds = [...menuStore.simSelectedOptionIds, optId];
		}
		menuStore.refreshHppSimulation();
	}

	function isOptionSelected(optId: string): boolean {
		return menuStore.simSelectedOptionIds.includes(optId);
	}
</script>

<div class="hpp-panel">
	<div class="hpp-panel-header">
		<div>
			<h3 class="text-base font-semibold text-[var(--text-main)] flex items-center gap-2">
				<Icon name="calculator" size={18} class="text-[var(--brand-primary)]" />
				<span>Simulasi HPP Dinamis &amp; Margin Laba Kotor (§6.4)</span>
			</h3>
			<p class="text-xs text-[var(--text-muted)] mt-1">
				Kalkulasi biaya bahan baku riil berdasarkan rata-rata bergerak outlet dan dampak opsi modifier.
			</p>
		</div>

		<!-- Pemilih Outlet Simulasi -->
		<div class="flex items-center gap-2">
			<span class="text-xs text-[var(--text-muted)]">Outlet Acuan:</span>
			<select
				class="form-input-lg !min-h-[36px] !py-1 text-xs"
				bind:value={menuStore.simOutletId}
				onchange={() => menuStore.refreshHppSimulation()}
				id="select-sim-outlet"
			>
				<option value="out-jkt-01">Jodi Senopati (Jakarta)</option>
				<option value="out-bdg-01">Jodi Dago (Bandung)</option>
				<option value="out-sub-01">Jodi Gubeng (Surabaya - Resep Override)</option>
				<option value="out-ubud-01">Kaveloka Ubud (Bali)</option>
				<option value="out-plg-01">Plaga Farm Bistro</option>
			</select>
		</div>
	</div>

	<!-- Pemilih Modifier Opsional untuk Uji Dampak Resep (§6.3) -->
	<div class="mb-5 p-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
		<span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
			Uji Opsi Modifier Tambahan (§6.3):
		</span>
		<div class="flex flex-wrap gap-2">
			{#each menuStore.modifierGroups as grp}
				{#each grp.options as opt}
					{#if opt.recipe_effects && opt.recipe_effects.length > 0}
						<button
							type="button"
							class="modifier-chip {isOptionSelected(opt.id) ? 'selected' : ''}"
							onclick={() => toggleOption(opt.id)}
						>
							<span class="w-2 h-2 rounded-full {isOptionSelected(opt.id) ? 'bg-[var(--brand-primary)]' : 'bg-slate-500'}"></span>
							<span>{opt.name}</span>
							<span class="text-[0.725rem] text-[var(--text-muted)]">
								{parseFloat(opt.price_delta) > 0 ? `(+${formatRupiah(opt.price_delta)})` : '(Rp0)'}
							</span>
						</button>
					{/if}
				{/each}
			{/each}
		</div>
	</div>

	{#if menuStore.isHppLoading}
		<div class="space-y-3 py-4">
			<Skeleton width="100%" height="80px" />
			<Skeleton width="100%" height="140px" />
		</div>
	{:else if menuStore.simHppResult}
		<!-- 3 Hero KPI Strip -->
		<div class="hpp-kpi-grid">
			<div class="hpp-kpi-card">
				<span class="hpp-kpi-label">HPP Total Varian</span>
				<span class="hpp-kpi-val text-amber-400">
					{formatRupiah(menuStore.simHppResult.total_hpp)}
				</span>
				<span class="hpp-kpi-sub">
					Versi Resep: v{menuStore.simHppResult.recipe_version_number}
					{#if menuStore.simHppResult.recipe_scope === 'outlet_override'}
						<span class="badge-override ml-1">Override Outlet</span>
					{/if}
				</span>
			</div>

			<div class="hpp-kpi-card">
				<span class="hpp-kpi-label">Harga Jual Dasar</span>
				<span class="hpp-kpi-val text-sky-400">
					{formatRupiah(menuStore.simHppResult.selling_price)}
				</span>
				<span class="hpp-kpi-sub">Laba Kotor: {formatRupiah(menuStore.simHppResult.gross_margin_amount)}</span>
			</div>

			<div class="hpp-kpi-card">
				<span class="hpp-kpi-label">Margin Laba Kotor</span>
				<span class="hpp-kpi-val text-emerald-400">
					{menuStore.simHppResult.gross_margin_pct}%
				</span>
				<span class="hpp-kpi-sub">Target Sehat F&amp;B: &ge; 65.0%</span>
			</div>
		</div>

		<!-- Warning Pill jika Bahan Belum Ada Biaya (AC-04.9) -->
		{#if !menuStore.simHppResult.is_complete}
			<div class="formula-callout !bg-amber-950/20 !border-amber-500/40 text-amber-300">
				<Icon name="exclamation-triangle" size={18} class="text-amber-400 shrink-0 mt-0.5" />
				<div>
					<span class="font-semibold block mb-0.5">Lencana: HPP Tidak Lengkap (AC-04.9)</span>
					<p class="text-xs">
						Bahan baku <strong>{menuStore.simHppResult.missing_cost_items.join(', ')}</strong> belum memiliki catatan biaya rata-rata di outlet ini. Segera verifikasi penerimaan barang atau atur harga beli awal.
					</p>
				</div>
			</div>
		{/if}

		<!-- Tabel Rincian Breakdown Biaya Per Bahan -->
		<div class="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
			<table class="recipe-table">
				<thead>
					<tr>
						<th>Bahan Baku</th>
						<th>Takaran Pakai</th>
						<th>Waste %</th>
						<th>Kuantitas Kotor</th>
						<th>Biaya Satuan</th>
						<th>Subtotal Biaya</th>
						<th>Sumber Biaya</th>
					</tr>
				</thead>
				<tbody>
					{#each menuStore.simHppResult.breakdown as row}
						<tr>
							<td>
								<div class="font-medium text-[var(--text-main)]">{row.stock_item_name}</div>
								{#if row.effect_note}
									<div class="text-[0.725rem] text-indigo-400 mt-0.5">
										⚡ {row.effect_note}
									</div>
								{/if}
							</td>
							<td class="font-mono text-xs">{parseFloat(row.quantity)} {row.serving_unit}</td>
							<td class="text-xs">{parseFloat(row.waste_pct)}%</td>
							<td class="font-mono text-xs text-[var(--text-muted)]">
								{parseFloat(row.gross_quantity).toFixed(2)} {row.serving_unit}
							</td>
							<td class="font-mono text-xs">
								{#if row.is_cost_missing}
									<span class="badge-hpp-incomplete">Belum ada biaya</span>
								{:else}
									{formatRupiah(row.unit_cost)}/{row.serving_unit}
								{/if}
							</td>
							<td class="font-mono text-xs font-semibold text-[var(--text-main)]">
								{formatRupiah(row.subtotal_cost)}
							</td>
							<td>
								<span class="text-[0.7rem] px-2 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
									{row.cost_source === 'outlet_avg_cost' ? 'Moving Avg Gerai' : row.cost_source === 'last_purchase_price' ? 'Ref HQ' : 'Tidak Ada'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
