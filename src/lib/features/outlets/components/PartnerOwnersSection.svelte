<script lang="ts">
	/**
	 * PartnerOwnersSection.svelte (T-02.6, PG-org-owners, Flag: partner_ownership)
	 * Daftar profil investor mitra pemilik gerai
	 */
	import Icon from '../../../components/data/Icon.svelte';

	interface Props {
		owners: { name: string; email?: string; phone?: string; outlet_count: number }[];
	}

	let { owners }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-bold text-base text-main">Daftar Mitra &amp; Investor Pemilik Gerai</h3>
			<p class="text-xs text-muted m-0">Ringkasan investor dan pemegang saham kemitraan di seluruh cabang terdaftar.</p>
		</div>
	</div>

	<div class="outlets-grid">
		{#each owners as own}
			<div class="outlet-item-card">
				<div class="outlet-card-top">
					<div class="outlet-name-block">
						<span class="outlet-code-badge">MITRA INVESTOR</span>
						<h4 class="outlet-title">{own.name}</h4>
					</div>
					<span class="badge badge-success">{own.outlet_count} Portofolio Gerai</span>
				</div>

				<div class="outlet-info-grid">
					<div class="info-item">
						<span class="info-label">Email Kontak</span>
						<span class="info-val truncate">{own.email || '-'}</span>
					</div>
					<div class="info-item">
						<span class="info-label">Telepon / WhatsApp</span>
						<span class="info-val">{own.phone || '-'}</span>
					</div>
				</div>

				<div class="rounded-lg text-xs text-muted flex items-center gap-2.5" style="padding: 12px 16px; background: var(--bg-panel-sub); border: 1px solid var(--border-panel); border-radius: 10px;">
					<Icon name="check-circle" size={16} class="text-emerald-500 shrink-0" />
					<span>Kemitraan tervalidasi dengan hak bagi hasil laba bersih gerai.</span>
				</div>
			</div>
		{/each}

		{#if owners.length === 0}
			<div class="col-span-full p-8 text-center rounded-xl" style="background: var(--bg-panel); border: 1px solid var(--border-panel);">
				<p class="text-muted font-medium text-xs">Belum ada investor mitra terdaftar.</p>
			</div>
		{/if}
	</div>
</div>
