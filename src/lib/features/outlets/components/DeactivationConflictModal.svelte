<script lang="ts">
	/**
	 * DeactivationConflictModal.svelte (AC-02.2)
	 * Menampilkan daftar dokumen operasional penghalang (blocking documents) saat deactivation ditolak (409 conflict)
	 */
	import Modal from '../../../components/feedback/Modal.svelte';
	import type { DeactivationConflictData } from '../../../api/contract/types.js';
	import Icon from '../../../components/data/Icon.svelte';

	interface Props {
		open: boolean;
		conflict: DeactivationConflictData | null;
		targetName?: string;
		onClose: () => void;
	}

	let { open, conflict, targetName = 'Outlet', onClose }: Props = $props();
</script>

<Modal
	{open}
	title="Pencegahan Deaktivasi Operasional"
	onclose={onClose}
>
	{#snippet footer()}
		<button type="button" class="btn btn-secondary" onclick={onClose}>
			Mengerti &amp; Tutup
		</button>
	{/snippet}

	<div class="flex flex-col gap-4">
		<div class="conflict-box">
			<div class="conflict-title">
				<Icon name="exclamation-triangle" size={18} />
				<span>{targetName} Tidak Dapat Dinonaktifkan</span>
			</div>
			<p class="text-xs text-red-700" style="color: #b91c1c; margin: 0; line-height: 1.5;">
				{conflict?.message || 'Sistem mendeteksi transaksi atau entitas turunan aktif yang mencegah penonaktifan.'}
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<span class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-muted);">
				Daftar Dokumen / Gerai Penghalang ({conflict?.blocking_documents?.length || 0}):
			</span>

			<div class="conflict-list max-h-60 overflow-y-auto">
				{#each conflict?.blocking_documents || [] as doc}
					<div class="conflict-item">
						<div class="flex items-start gap-2.5">
							<div class="p-1 rounded bg-red-100 text-red-600 mt-0.5">
								<Icon
									name={doc.doc_type === 'purchase_order' ? 'document-text' : doc.doc_type === 'active_outlet' ? 'building-storefront' : 'receipt-percent'}
									size={16}
								/>
							</div>
							<div class="flex flex-col gap-0.5">
								<span class="text-xs font-bold font-mono" style="color: var(--text-main);">
									{doc.ref_number} — {doc.title}
								</span>
								<span class="text-[11px]" style="color: var(--text-muted);">
									{doc.reason}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
			<strong>Panduan Tindakan:</strong> Selesaikan atau batalkan seluruh PO terbuka, verifikasi faktur nota supplier, atau nonaktifkan outlet turunan terlebih dahulu sebelum mematikan entitas ini.
		</div>
	</div>
</Modal>
