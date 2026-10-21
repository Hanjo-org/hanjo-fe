<script lang="ts">
	/**
	 * OutletGroupsSection.svelte (T-02.8, PG-org-groups)
	 * Pengelompokan outlet untuk pelaporan dan aturan persetujuan
	 */
	import type { OutletGroup, Outlet } from '../../../api/contract/types.js';
	import Icon from '../../../components/data/Icon.svelte';

	interface Props {
		groups: OutletGroup[];
		outlets: Outlet[];
		onCreateGroup: (data: Partial<OutletGroup>) => Promise<void>;
	}

	let { groups, outlets, onCreateGroup }: Props = $props();

	let showAddModal = $state(false);
	let groupName = $state('');
	let groupCode = $state('');
	let groupDesc = $state('');
	let selectedOutletIds = $state<string[]>([]);
	let isSubmitting = $state(false);

	function toggleOutlet(id: string) {
		if (selectedOutletIds.includes(id)) {
			selectedOutletIds = selectedOutletIds.filter((o) => o !== id);
		} else {
			selectedOutletIds = [...selectedOutletIds, id];
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!groupName.trim()) return;

		isSubmitting = true;
		try {
			await onCreateGroup({
				name: groupName.trim(),
				code: groupCode.trim().toUpperCase(),
				description: groupDesc.trim(),
				outlet_ids: selectedOutletIds
			});
			showAddModal = false;
			groupName = '';
			groupCode = '';
			groupDesc = '';
			selectedOutletIds = [];
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-bold text-base text-main">Grup Wilayah &amp; Area Operasional</h3>
			<p class="text-xs text-muted m-0">Pengelompokan gerai untuk konsolidasi laporan wilayah dan hierarki approval belanja.</p>
		</div>
		<button
			type="button"
			class="btn btn-primary btn-sm"
			onclick={() => (showAddModal = true)}
		>
			<Icon name="plus" size={14} />
			<span>Tambah Grup Baru</span>
		</button>
	</div>

	<div class="outlets-grid">
		{#each groups as grp}
			<div class="outlet-item-card">
				<div class="outlet-card-top">
					<div class="outlet-name-block">
						<span class="outlet-code-badge">{grp.code}</span>
						<h4 class="outlet-title">{grp.name}</h4>
					</div>
					<span class="badge badge-info">{grp.outlet_ids.length} Gerai Terdaftar</span>
				</div>

				<p class="text-xs text-muted m-0 line-clamp-2">
					{grp.description || 'Grup operasional regional.'}
				</p>

				<div class="rounded-lg flex flex-wrap gap-2" style="padding: 12px 14px; background: var(--bg-panel-sub); border: 1px solid var(--border-panel); border-radius: 10px;">
					{#each grp.outlet_ids as outId}
						{@const out = outlets.find((o) => o.id === outId)}
						<span class="inline-flex items-center gap-1.5 rounded-md text-[11.5px] font-medium" style="padding: 3.5px 9px; background: var(--bg-panel-hover); border: 1px solid var(--border-subtle); color: var(--text-main);">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
							<span>{out?.name || outId}</span>
						</span>
					{/each}
					{#if grp.outlet_ids.length === 0}
						<span class="text-xs italic" style="color: var(--text-muted);">Belum ada gerai terdaftar dalam grup ini</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Modal Tambah Grup Baru -->
{#if showAddModal}
	<div class="modal-backdrop">
		<div class="modal-box max-w-md" style="background: var(--bg-panel); border: 1px solid var(--border-panel); border-radius: var(--radius-xl);">
			<h3 class="font-bold text-base mb-3 text-main">Buat Grup Wilayah Baru</h3>
			<form onsubmit={handleSubmit} class="flex flex-col gap-3 text-xs">
				<div class="field-group">
					<label for="grp-name" class="field-label">Nama Grup *</label>
					<input id="grp-name" type="text" class="field-input text-xs" bind:value={groupName} placeholder="Contoh: Wilayah Jawa Timur" required />
				</div>
				<div class="field-group">
					<label for="grp-code" class="field-label">Kode Singkat Grup</label>
					<input id="grp-code" type="text" class="field-input text-xs uppercase" bind:value={groupCode} placeholder="Contoh: GRP-JATIM" />
				</div>
				<div class="field-group">
					<label for="grp-desc" class="field-label">Deskripsi</label>
					<input id="grp-desc" type="text" class="field-input text-xs" bind:value={groupDesc} placeholder="Area gerai regional..." />
				</div>
				<div class="field-group">
					<span class="field-label">Pilih Gerai Anggota:</span>
					<div class="max-h-36 overflow-y-auto flex flex-col gap-1.5 p-2 rounded" style="background: var(--bg-input); border: 1px solid var(--border-input);">
						{#each outlets as o}
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={selectedOutletIds.includes(o.id)}
									onchange={() => toggleOutlet(o.id)}
								/>
								<span class="text-xs">{o.name} ({o.city})</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="section-footer-action">
					<button type="button" class="btn btn-secondary btn-sm" onclick={() => (showAddModal = false)}>
						Batal
					</button>
					<button type="submit" class="btn btn-primary btn-sm" disabled={isSubmitting}>
						{isSubmitting ? 'Membuat...' : 'Buat Grup'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
