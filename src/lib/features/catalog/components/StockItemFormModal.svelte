<script lang="ts">
	/**
	 * Form Modal: Tambah & Ubah Bahan Baku (Stock Item)
	 * Menggunakan komponen form terpadu: Input, Select, CurrencyInput, Checkbox, Textarea, Button.
	 * Mengikuti Golden Rule 2 (Thin Svelte), Golden Rule 10 (Tokens), Golden Rule 14 (Padding).
	 */
	import Modal from '#lib/components/feedback/Modal.svelte';
	import Icon from '#lib/components/data/Icon.svelte';
	import Input from '#lib/components/forms/Input.svelte';
	import Select from '#lib/components/forms/Select.svelte';
	import CurrencyInput from '#lib/components/forms/CurrencyInput.svelte';
	import Checkbox from '#lib/components/forms/Checkbox.svelte';
	import Textarea from '#lib/components/forms/Textarea.svelte';
	import Button from '#lib/components/forms/Button.svelte';
	import type { StockItem, ItemCategory, Unit, DecimalString } from '#lib/api/contract/types.js';

	interface Props {
		open: boolean;
		item: StockItem | null;
		categories: ItemCategory[];
		units: Unit[];
		onclose: () => void;
		onsave: (data: Partial<StockItem>) => Promise<boolean>;
	}

	let { open, item, categories, units, onclose, onsave }: Props = $props();

	// Local Form State
	let name = $state('');
	let code = $state('');
	let category_id = $state('');
	let base_unit_id = $state('');
	let is_producible = $state(false);
	let can_buy_external = $state(true);
	let storage_temperature = $state<'ambient' | 'chilled' | 'frozen'>('ambient');
	let hq_ref_code = $state('');
	let hq_ref_price = $state<DecimalString>('0.00');
	let description = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	// Opsi dropdown terstandarisasi untuk Select.svelte
	const categoryOptions = $derived(
		categories.map((cat) => ({
			value: cat.id,
			label: cat.name,
			subtitle: cat.code
		}))
	);

	const unitOptions = $derived(
		units.map((u) => ({
			value: u.id,
			label: `${u.name} (${u.symbol})`,
			subtitle: u.type
		}))
	);

	const storageOptions = [
		{ value: 'ambient', label: 'Suhu Ruang (Ambient)', subtitle: 'Suhu ruangan standar' },
		{ value: 'chilled', label: 'Dingin / Kulkas (Chilled 2°C - 4°C)', subtitle: 'Produk susu, keju, sirup dingin' },
		{ value: 'frozen', label: 'Beku / Freezer (Frozen < -18°C)', subtitle: 'Daging, es batu, bahan beku' }
	];

	// Sinkronisasi saat item prop berubah
	$effect(() => {
		if (item) {
			name = item.name || '';
			code = item.code || '';
			category_id = item.category_id || (categories[0]?.id || '');
			base_unit_id = item.base_unit_id || (units[0]?.id || '');
			is_producible = item.is_producible || false;
			can_buy_external = item.can_buy_external ?? true;
			storage_temperature = item.storage_temperature || 'ambient';
			hq_ref_code = item.hq_ref_code || '';
			hq_ref_price = (item.hq_ref_price || '0.00') as DecimalString;
			description = item.description || '';
		} else {
			name = '';
			code = '';
			category_id = categories[0]?.id || '';
			base_unit_id = units[0]?.id || '';
			is_producible = false;
			can_buy_external = true;
			storage_temperature = 'ambient';
			hq_ref_code = '';
			hq_ref_price = '0.00';
			description = '';
		}
		errorMessage = null;
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) {
			errorMessage = 'Nama bahan baku wajib diisi';
			return;
		}
		if (!code.trim()) {
			errorMessage = 'Kode bahan baku (SKU) wajib diisi';
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		const success = await onsave({
			name: name.trim(),
			code: code.trim().toUpperCase(),
			category_id,
			base_unit_id,
			is_producible,
			can_buy_external,
			storage_temperature,
			hq_ref_code: hq_ref_code.trim(),
			hq_ref_price: hq_ref_price || '0.00',
			description: description.trim()
		});

		isSubmitting = false;
		if (!success) {
			errorMessage = 'Gagal menyimpan data bahan. Periksa kembali isian Anda.';
		}
	}
</script>

<Modal
	{open}
	title={item ? 'Ubah Bahan Baku' : 'Tambah Bahan Baku Baru'}
	subtitle={item ? `Perbarui spesifikasi bahan SKU ${item.code}` : 'Daftarkan bahan baku baru ke dalam katalog pusat'}
	maxWidth="640px"
	{onclose}
>
	<form id="stock-item-form" onsubmit={handleSubmit} class="space-y-5">
		{#if errorMessage}
			<div class="detail-notice-callout warning">
				<Icon name="exclamation-triangle" size={18} />
				<span>{errorMessage}</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			<!-- Nama Bahan -->
			<div class="md:col-span-2">
				<Input
					id="item-name"
					label="Nama Bahan Baku"
					placeholder="Contoh: Espresso Blend House Arabica"
					bind:value={name}
					required
				/>
			</div>

			<!-- Kode Bahan (SKU) -->
			<Input
				id="item-code"
				label="Kode Bahan / SKU"
				placeholder="KOP-ESP-01"
				bind:value={code}
				disabled={!!item}
				helperText={item ? 'Kode SKU tidak dapat diubah setelah terdaftar' : undefined}
				required
			/>

			<!-- Kategori -->
			<Select
				id="item-category"
				label="Kategori Bahan"
				bind:value={category_id}
				options={categoryOptions}
				placeholder="Pilih Kategori..."
				required
			/>

			<!-- Satuan Dasar (Base Unit) -->
			<Select
				id="item-base-unit"
				label="Satuan Dasar (Base Unit)"
				bind:value={base_unit_id}
				options={unitOptions}
				disabled={!!item && item.has_stock_movements}
				helperText={item && item.has_stock_movements ? 'Terkunci permanen: Bahan telah memiliki mutasi stok (AC-03.1)' : undefined}
				placeholder="Pilih Satuan..."
				required
			/>

			<!-- Suhu Penyimpanan -->
			<Select
				id="item-storage"
				label="Suhu Penyimpanan"
				bind:value={storage_temperature}
				options={storageOptions}
			/>

			<!-- Kode Referensi HQ -->
			<Input
				id="item-hq-code"
				label="Kode Referensi Pusat (HQ Ref Code)"
				placeholder="HQ-ROAST-01"
				bind:value={hq_ref_code}
			/>

			<!-- Harga Referensi HQ -->
			<CurrencyInput
				id="item-hq-price"
				label="Harga Referensi Pusat (HQ Ref Price)"
				bind:value={hq_ref_price}
				placeholder="0"
				helperText="Murni referensi pusat (tidak mempengaruhi HPP/saldo)"
			/>
		</div>

		<!-- Flag Checklist dengan Padding & Margin Lega (Invarian §2.7) -->
		<div class="checklist-panel">
			<Checkbox
				id="chk-producible"
				label="Bahan Olahan Outlet (Producible)"
				description="Bahan ini diracik sendiri di outlet (contoh: Cold Brew batch, Sirup Gula Aren batch)"
				bind:checked={is_producible}
			/>

			<div class="checklist-divider"></div>

			<Checkbox
				id="chk-external"
				label="Boleh Pengadaan Langsung (Beli Luar)"
				description="Outlet diizinkan menerbitkan PO pengadaan ke pemasok eksternal tanpa lewat gudang pusat"
				bind:checked={can_buy_external}
			/>
		</div>

		<!-- Deskripsi -->
		<Textarea
			id="item-desc"
			label="Deskripsi / Catatan Penyimpanan"
			placeholder="Petunjuk penggunaan atau perlakuan khusus..."
			bind:value={description}
			rows={3}
		/>
	</form>

	{#snippet footer()}
		<div class="flex items-center justify-end gap-3 w-full">
			<Button variant="secondary" onclick={onclose} disabled={isSubmitting}>
				Batal
			</Button>
			<Button
				variant="primary"
				type="submit"
				form="stock-item-form"
				loading={isSubmitting}
			>
				<Icon name="check" size={16} />
				<span>{item ? 'Simpan Perubahan' : 'Tambahkan Bahan'}</span>
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.checklist-panel {
		margin-top: 18px;
		margin-bottom: 20px;
		padding: 20px 22px;
		background: var(--bg-panel-sub, #0f172a);
		border: 1px solid var(--border-panel, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-lg, 12px);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.checklist-divider {
		height: 1px;
		width: 100%;
		background: var(--border-subtle, rgba(255, 255, 255, 0.06));
	}
</style>
