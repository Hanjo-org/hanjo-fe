<script lang="ts">
	/**
	 * Komponen Modal Simulasi Harga Channel & Pembulatan (§6.1, T-04.8, AC-04.1)
	 */
	import { menuStore } from '../stores/menu.svelte.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import Button from '../../../components/forms/Button.svelte';
	import Modal from '../../../components/feedback/Modal.svelte';

	function toggleCalcOption(optId: string) {
		if (menuStore.calcOptionIds.includes(optId)) {
			menuStore.calcOptionIds = menuStore.calcOptionIds.filter((id) => id !== optId);
		} else {
			menuStore.calcOptionIds = [...menuStore.calcOptionIds, optId];
		}
		menuStore.refreshPricingCalculation();
	}
</script>

<Modal
	open={menuStore.isPricingCalculatorOpen}
	title="Kalkulator Harga Jual Channel &amp; Pembulatan (§6.1)"
	maxWidth="720px"
	onclose={() => (menuStore.isPricingCalculatorOpen = false)}
>
	<div class="space-y-5">
		<!-- Header Info -->
		<div class="formula-callout">
			<Icon name="information-circle" size={20} class="text-indigo-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-semibold block mb-0.5">Formula Resmi Channel Pricing (§6.1):</span>
				<code class="text-xs text-indigo-300 font-mono">
					harga_akhir = pembulatan((harga_dasar + &Sigma; price_delta) &times; (1 + markup_pct/100))
				</code>
				<p class="text-xs text-[var(--text-muted)] mt-1">
					Mode pembulatan: <code>nearest | up | down</code> dengan kelipatan langkah <code>100 | 500 | 1000</code>.
				</p>
			</div>
		</div>

		<!-- Grid Pengaturan Input Simulasi -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- 1. Varian Menu -->
			<div>
				<label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5" for="calc-select-variant">
					Pilih Varian Menu:
				</label>
				<select
					class="form-input-lg"
					bind:value={menuStore.calcVariantId}
					onchange={() => menuStore.refreshPricingCalculation()}
					id="calc-select-variant"
				>
					{#each menuStore.menuItems as m}
						<optgroup label={m.name}>
							{#each m.variants as v}
								<option value={v.id}>
									{m.name} - {v.name} ({formatRupiah(v.base_price)})
								</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</div>

			<!-- 2. Outlet Acuan -->
			<div>
				<label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5" for="calc-select-outlet">
					Gerai / Outlet:
				</label>
				<select
					class="form-input-lg"
					bind:value={menuStore.calcOutletId}
					onchange={() => menuStore.refreshPricingCalculation()}
					id="calc-select-outlet"
				>
					<option value="out-jkt-01">Jodi Senopati (Jakarta)</option>
					<option value="out-bdg-01">Jodi Dago (Bandung)</option>
					<option value="out-sub-01">Jodi Gubeng (Surabaya - Ada Override)</option>
					<option value="out-ubud-01">Kaveloka Ubud</option>
					<option value="out-plg-01">Plaga Farm Bistro</option>
				</select>
			</div>

			<!-- 3. Sales Channel -->
			<div>
				<label class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5" for="calc-select-channel">
					Channel Penjualan:
				</label>
				<select
					class="form-input-lg"
					bind:value={menuStore.calcChannelCode}
					onchange={() => menuStore.refreshPricingCalculation()}
					id="calc-select-channel"
				>
					{#each menuStore.channels as chn}
						<option value={chn.code}>
							{chn.name} (+{parseFloat(chn.default_markup_pct)}%, {chn.rounding_mode} {chn.rounding_step})
						</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Pilihan Modifier Opsi (Price Deltas) -->
		<div>
			<span class="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
				Pilih Tambahan Opsi Modifier (&Sigma; Price Delta):
			</span>
			<div class="flex flex-wrap gap-2">
				{#each menuStore.modifierGroups as grp}
					{#each grp.options as opt}
						{#if parseFloat(opt.price_delta) > 0}
							<button
								type="button"
								class="modifier-chip {menuStore.calcOptionIds.includes(opt.id) ? 'selected' : ''}"
								onclick={() => toggleCalcOption(opt.id)}
							>
								<span>{opt.name}</span>
								<span class="font-mono text-xs text-sky-400">
									+{formatRupiah(opt.price_delta)}
								</span>
							</button>
						{/if}
					{/each}
				{/each}
			</div>
		</div>

		<!-- Hasil Perhitungan Instan -->
		{#if menuStore.calcPricingResult}
			<div class="p-5 rounded-xl bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] space-y-4">
				<div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
					<div>
						<span class="text-xs text-[var(--text-muted)] uppercase tracking-wider block">Harga Jual Akhir Channel</span>
						<span class="text-2xl font-bold font-mono text-emerald-400">
							{formatRupiah(menuStore.calcPricingResult.final_price)}
						</span>
					</div>

					<div class="text-right">
						<span class="text-xs text-[var(--text-muted)] block">Channel: <strong>{menuStore.calcPricingResult.channel_name}</strong></span>
						<span class="text-xs text-indigo-400 font-mono">
							Markup {parseFloat(menuStore.calcPricingResult.markup_pct)}% | Pembulatan {menuStore.calcPricingResult.rounding_mode} {menuStore.calcPricingResult.rounding_step}
						</span>
					</div>
				</div>

				<!-- Rincian Langkah Formula -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
					<div class="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
						<span class="text-[var(--text-muted)] block">Harga Dasar:</span>
						<span class="font-mono font-semibold text-[var(--text-main)]">
							{formatRupiah(menuStore.calcPricingResult.base_price)}
						</span>
						{#if menuStore.calcPricingResult.price_override_applied}
							<span class="badge-override !text-[0.65rem] !py-0 mt-1">Override Outlet</span>
						{/if}
					</div>

					<div class="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
						<span class="text-[var(--text-muted)] block">&Sigma; Delta Modifier:</span>
						<span class="font-mono font-semibold text-[var(--text-main)]">
							+{formatRupiah(menuStore.calcPricingResult.modifier_price_delta)}
						</span>
					</div>

					<div class="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
						<span class="text-[var(--text-muted)] block">Subtotal Dasar:</span>
						<span class="font-mono font-semibold text-[var(--text-main)]">
							{formatRupiah(menuStore.calcPricingResult.subtotal_before_markup)}
						</span>
					</div>

					<div class="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
						<span class="text-[var(--text-muted)] block">Markup Terhitung:</span>
						<span class="font-mono font-semibold text-sky-400">
							+{formatRupiah(menuStore.calcPricingResult.markup_amount)}
						</span>
					</div>
				</div>

				<!-- Formula Audit Text -->
				<div class="text-[0.775rem] text-[var(--text-muted)] font-mono bg-[var(--bg-panel)] p-2.5 rounded border border-[var(--border-subtle)]">
					{menuStore.calcPricingResult.calculation_formula}
				</div>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (menuStore.isPricingCalculatorOpen = false)}>
			Tutup
		</Button>
	{/snippet}
</Modal>
