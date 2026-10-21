<script lang="ts">
	/**
	 * OrganizationListCard.svelte (T-02.0, PG-org-list)
	 * Menampilkan daftar entitas bisnis induk dengan ringkasan jumlah outlet aktif di bawahnya
	 */
	import type { Organization } from '../../../api/contract/types.js';
	import Icon from '../../../components/data/Icon.svelte';
	import StatusBadge from '../../../components/data/StatusBadge.svelte';
	import ActionMenu from '../../../components/feedback/ActionMenu.svelte';

	interface Props {
		organizations: Organization[];
		onEdit: (org: Organization) => void;
		onToggleStatus: (org: Organization) => void;
		onSelectOrgFilter: (orgId: string) => void;
		onAdd?: () => void;
	}

	let { organizations, onEdit, onToggleStatus, onSelectOrgFilter, onAdd }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h3 class="font-bold text-base text-main m-0">Daftar Organisasi Induk</h3>
			<p class="text-xs text-muted m-0">Entitas bisnis induk pengelola jaringan multi-gerai dan perizinan.</p>
		</div>
		{#if onAdd}
			<button
				type="button"
				class="btn btn-primary"
				onclick={onAdd}
				id="btn-tambah-org"
			>
				<Icon name="plus" size={16} />
				<span>Tambah Organisasi Induk</span>
			</button>
		{/if}
	</div>

	<div class="outlets-grid" id="org-list-grid">
	{#each organizations as org}
		<div class="outlet-item-card" id="org-card-{org.id}">
			<div class="outlet-card-top">
				<div class="outlet-name-block">
					<span class="outlet-code-badge">{org.code}</span>
					<h3 class="outlet-title">{org.name}</h3>
					<span class="outlet-org-subtitle">
						<Icon name="building-office" size={14} />
						<span>Entitas Bisnis Induk</span>
					</span>
				</div>
				<div class="outlet-card-top-right">
					<StatusBadge
						status={org.active !== false ? 'active' : 'inactive'}
					/>
					<ActionMenu
						items={[
							{
								label: `Lihat ${org.outlet_count || 0} Gerai`,
								icon: 'funnel',
								onclick: () => onSelectOrgFilter(org.id)
							},
							{
								label: 'Ubah Data Organisasi',
								icon: 'pencil-square',
								onclick: () => onEdit(org)
							},
							{
								divider: true,
								label: org.active !== false ? 'Nonaktifkan Organisasi' : 'Aktifkan Organisasi',
								icon: org.active !== false ? 'lock-closed' : 'check-circle',
								variant: org.active !== false ? 'danger' : 'success',
								onclick: () => onToggleStatus(org)
							}
						]}
					/>
				</div>
			</div>

			<p class="text-xs text-muted" style="color: var(--text-muted); line-height: 1.5; margin: 0;">
				{org.description || 'Tidak ada deskripsi entitas bisnis.'}
			</p>

			<div class="outlet-info-grid">
				<div class="info-item">
					<span class="info-label">NPWP Entitas</span>
					<span class="info-val" style="font-family: monospace;">{org.tax_id || '-'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Gerai Aktif</span>
					<button
						type="button"
						class="info-val font-bold text-left cursor-pointer bg-transparent border-0 p-0 hover:underline"
						style="color: var(--brand-primary, #10b981);"
						onclick={() => onSelectOrgFilter(org.id)}
						title="Filter outlet di bawah organisasi ini"
					>
						{org.outlet_count || 0} Gerai &rarr;
					</button>
				</div>
				<div class="info-item" style="grid-column: span 2;">
					<span class="info-label">Alamat Kantor Pusat</span>
					<span class="info-val truncate">{org.address || '-'}</span>
				</div>
			</div>
		</div>
	{/each}
	</div>
</div>
