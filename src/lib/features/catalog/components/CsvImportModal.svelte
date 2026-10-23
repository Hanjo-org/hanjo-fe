<script lang="ts">
	/**
	 * Wizard Modal: Impor CSV Master Bahan Baku (T-03.7 & AC-03.4)
	 * Mengikuti alur: Upload -> Mapping -> Validasi/Pratinjau -> Unduh Galat -> Komit Atomik
	 */
	import Modal from '#lib/components/feedback/Modal.svelte';
	import Icon from '#lib/components/data/Icon.svelte';
	import type { CsvImportPreview, CsvImportCommitResult } from '#lib/api/contract/types.js';

	interface Props {
		open: boolean;
		step: 'upload' | 'mapping' | 'preview' | 'success';
		preview: CsvImportPreview | null;
		commitResult: CsvImportCommitResult | null;
		isLoading: boolean;
		onclose: () => void;
		onrunpreview: () => Promise<void>;
		onruncommit: () => Promise<void>;
		ondownloaderrors: () => void;
	}

	let {
		open,
		step = 'upload',
		preview,
		commitResult,
		isLoading,
		onclose,
		onrunpreview,
		onruncommit,
		ondownloaderrors
	}: Props = $props();

	let fileName = $state('katalog_bahan_baku_2026.csv');
</script>

<Modal
	{open}
	title="Wizard Impor CSV Master Bahan Baku"
	subtitle="Impor massal bahan baku dengan pemetaan kolom dan validasi ketat (AC-03.4)"
	maxWidth="740px"
	{onclose}
>
	<div class="flex flex-col gap-4">
		<!-- Step Wizard Bar -->
		<div class="flex items-center justify-between border-b border-[var(--border-panel)] pb-3 text-xs font-semibold">
			<div class="flex items-center gap-2 {step === 'upload' ? 'text-emerald-400' : 'text-[var(--text-subtle)]'}">
				<span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] {step === 'upload' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]'}">1</span>
				<span>Unggah CSV</span>
			</div>
			<Icon name="chevron-right" size={14} class="text-[var(--text-subtle)]" />
			<div class="flex items-center gap-2 {step === 'preview' ? 'text-emerald-400' : 'text-[var(--text-subtle)]'}">
				<span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] {step === 'preview' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]'}">2</span>
				<span>Validasi &amp; Pratinjau</span>
			</div>
			<Icon name="chevron-right" size={14} class="text-[var(--text-subtle)]" />
			<div class="flex items-center gap-2 {step === 'success' ? 'text-emerald-400' : 'text-[var(--text-subtle)]'}">
				<span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] {step === 'success' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]'}">3</span>
				<span>Selesai</span>
			</div>
		</div>

		<!-- STEP 1: UNGGAH FILE & PEMETAAN -->
		{#if step === 'upload'}
			<div class="flex flex-col gap-4 py-2">
				<div class="border-2 border-dashed border-[var(--border-panel)] hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[var(--bg-panel-sub)] text-center transition">
					<div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
						<Icon name="document-arrow-up" size={24} />
					</div>
					<div>
						<h4 class="text-sm font-bold text-[var(--text-main)]">Pilih atau Tarik Berkas CSV ke Sini</h4>
						<p class="text-xs text-[var(--text-muted)] mt-1">
							Format kolom yang didukung: <code>Nama, SKU/Kode, Kategori, Satuan, Harga_Referensi</code>
						</p>
					</div>
					<div class="flex items-center gap-2 mt-2">
						<span class="px-3 py-1.5 text-xs rounded-md bg-[var(--bg-panel)] border border-[var(--border-panel)] text-[var(--text-main)] font-mono">
							{fileName} (200 baris)
						</span>
					</div>
				</div>

				<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
					<span class="text-[var(--text-muted)]">Ingin mencoba berkas contoh dengan 200 baris &amp; 5 galat uji?</span>
					<button
						type="button"
						class="text-emerald-400 hover:text-emerald-300 font-semibold underline"
						onclick={onrunpreview}
					>
						Muat Demo Data 200 Baris
					</button>
				</div>
			</div>

		<!-- STEP 2: PRATINJAU & VALIDASI (AC-03.4) -->
		{:else if step === 'preview' && preview}
			<div class="flex flex-col gap-4 py-1">
				<!-- KPI Ringkasan Validasi -->
				<div class="grid grid-cols-3 gap-3">
					<div class="p-3.5 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)]">
						<span class="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider block">Total Baris CSV</span>
						<strong class="text-xl text-[var(--text-main)] font-mono">{preview.total_rows}</strong>
						<span class="text-[11px] text-[var(--text-subtle)] block mt-0.5">Baris terbaca</span>
					</div>
					<div class="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
						<span class="text-[11px] text-emerald-300 uppercase tracking-wider block font-semibold">Baris Valid</span>
						<strong class="text-xl text-emerald-400 font-mono">{preview.valid_rows}</strong>
						<span class="text-[11px] text-emerald-300/80 block mt-0.5">Siap diimpor</span>
					</div>
					<div class="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
						<span class="text-[11px] text-rose-300 uppercase tracking-wider block font-semibold">Baris Galat</span>
						<strong class="text-xl text-rose-400 font-mono">{preview.error_rows}</strong>
						<span class="text-[11px] text-rose-300/80 block mt-0.5">Wajib diperbaiki</span>
					</div>
				</div>

				<!-- Daftar Galat & Tombol Unduh Galat (AC-03.4) -->
				{#if preview.errors.length > 0}
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<h4 class="text-xs font-bold text-rose-400 flex items-center gap-1.5">
								<Icon name="exclamation-circle" size={15} />
								<span>Daftar {preview.errors.length} Baris Galat Terdeteksi:</span>
							</h4>
							<button
								type="button"
								class="btn btn-secondary text-xs"
								style="min-height: 32px; padding: 4px 12px;"
								onclick={ondownloaderrors}
							>
								<Icon name="arrow-down-tray" size={14} />
								<span>Unduh Baris Galat (.csv)</span>
							</button>
						</div>

						<div class="data-table-container max-h-48 overflow-y-auto">
							<table class="data-table">
								<thead>
									<tr>
										<th>Baris</th>
										<th>Kolom</th>
										<th>Pesan Galat</th>
										<th>Data Input Mentah</th>
									</tr>
								</thead>
								<tbody>
									{#each preview.errors as err}
										<tr>
											<td class="font-mono font-bold text-rose-400">#{err.row_number}</td>
											<td class="font-mono text-xs">{err.field}</td>
											<td class="text-xs text-rose-300">{err.message}</td>
											<td class="font-mono text-[11px] text-[var(--text-subtle)]">
												{JSON.stringify(err.raw_data)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Callout Komit Atomik -->
				<div class="detail-notice-callout info">
					<Icon name="information-circle" size={18} />
					<span>
						Sistem menerapkan komit atomik: hanya <strong>{preview.valid_rows} baris valid</strong> yang akan disimpan ke katalog master. {preview.error_rows} baris galat akan diabaikan dan dapat Anda unduh untuk diperbaiki (AC-03.4).
					</span>
				</div>
			</div>

		<!-- STEP 3: SUKSES KOMIT -->
		{:else if step === 'success' && commitResult}
			<div class="flex flex-col items-center justify-center text-center py-6 gap-3">
				<div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
					<Icon name="check-circle" size={32} />
				</div>
				<h3 class="text-base font-bold text-[var(--text-main)]">Impor Bahan Berhasil Dikomit!</h3>
				<p class="text-xs text-[var(--text-muted)] max-w-md">
					{commitResult.message}
				</p>
				<div class="flex items-center gap-3 mt-3">
					<div class="px-4 py-2 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-xs">
						<span class="text-[var(--text-subtle)] block">Dibuat Baru:</span>
						<strong class="text-emerald-400 text-sm font-mono">{commitResult.created_count}</strong>
					</div>
					<div class="px-4 py-2 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-xs">
						<span class="text-[var(--text-subtle)] block">Diperbarui:</span>
						<strong class="text-blue-400 text-sm font-mono">{commitResult.updated_count}</strong>
					</div>
					<div class="px-4 py-2 rounded-lg bg-[var(--bg-panel-sub)] border border-[var(--border-subtle)] text-xs">
						<span class="text-[var(--text-subtle)] block">Dilewati / Galat:</span>
						<strong class="text-amber-400 text-sm font-mono">{commitResult.skipped_count}</strong>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between w-full">
			<div>
				{#if step === 'preview'}
					<button
						type="button"
						class="btn btn-secondary text-xs"
						onclick={ondownloaderrors}
					>
						<Icon name="arrow-down-tray" size={14} />
						<span>Unduh Baris Galat</span>
					</button>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<button type="button" class="btn btn-secondary" onclick={onclose} disabled={isLoading}>
					{step === 'success' ? 'Tutup' : 'Batal'}
				</button>

				{#if step === 'upload'}
					<button
						type="button"
						class="btn btn-primary"
						onclick={onrunpreview}
						disabled={isLoading}
					>
						{#if isLoading}
							<Icon name="arrow-path" size={16} class="animate-spin" />
							<span>Memproses...</span>
						{:else}
							<Icon name="arrow-right" size={16} />
							<span>Validasi &amp; Pratinjau</span>
						{/if}
					</button>
				{:else if step === 'preview'}
					<button
						type="button"
						class="btn btn-primary"
						onclick={onruncommit}
						disabled={isLoading}
					>
						{#if isLoading}
							<Icon name="arrow-path" size={16} class="animate-spin" />
							<span>Menyimpan...</span>
						{:else}
							<Icon name="check" size={16} />
							<span>Komit {preview?.valid_rows || 0} Baris Valid</span>
						{/if}
					</button>
				{:else if step === 'success'}
					<button type="button" class="btn btn-primary" onclick={onclose}>
						Selesai
					</button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>
