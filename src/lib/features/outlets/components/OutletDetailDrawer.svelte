<script lang="ts">
	/**
	 * OutletDetailDrawer.svelte (T-02.4, T-02.5, T-02.7)
	 * Detail Gerai Luas & Terstruktur Tanpa Tab:
	 * Identitas, Parameter Operasional, Finansial, Tim Pengguna, dan Investor Mitra
	 */
	import Modal from '../../../components/feedback/Modal.svelte';
	import type { Organization, Outlet, OutletOwnership } from '../../../api/contract/types.js';
	import { formatRupiah } from '../../../utils/format.js';
	import Icon from '../../../components/data/Icon.svelte';
	import StatusBadge from '../../../components/data/StatusBadge.svelte';
	import Badge from '../../../components/data/Badge.svelte';
	import { validateOwnershipRules } from '../../../domain/organization.js';
	import DatePicker from '../../../components/forms/DatePicker.svelte';

	interface Props {
		open: boolean;
		outlet: Outlet | null;
		organizations: Organization[];
		ownerships: OutletOwnership[];
		isPartnerEnabled?: boolean;
		onClose: () => void;
		onSaveOwnerships: (ownerships: OutletOwnership[]) => Promise<void>;
	}

	let {
		open,
		outlet,
		organizations,
		ownerships,
		isPartnerEnabled = true,
		onClose,
		onSaveOwnerships
	}: Props = $props();

	let localOwnerships = $state<OutletOwnership[]>([]);
	let ownershipError = $state<string | null>(null);
	let isSavingOwners = $state(false);

	const parentOrg = $derived(
		organizations.find((o) => o.id === outlet?.organization_id)
	);

	// Sinkronisasi data kepemilikan saat modal dibuka
	$effect(() => {
		if (open) {
			localOwnerships = ownerships.map((o) => ({ ...o }));
			ownershipError = null;
		}
	});

	// Evaluasi aturan kepemilikan lokal
	const ownershipEvaluation = $derived(validateOwnershipRules(localOwnerships));

	function handleAddOwnerRow() {
		localOwnerships = [
			...localOwnerships,
			{
				id: `temp-${Date.now()}`,
				outlet_id: outlet?.id || '',
				owner_name: '',
				owner_email: '',
				owner_phone: '',
				share_pct: null,
				effective_from: '2026-01-01',
				effective_to: null,
				notes: ''
			}
		];
	}

	function handleRemoveOwnerRow(index: number) {
		localOwnerships = localOwnerships.filter((_, i) => i !== index);
	}

	async function handleSaveOwners() {
		ownershipError = null;
		if (!ownershipEvaluation.valid) {
			ownershipError = ownershipEvaluation.error || 'Pembagian persentase kepemilikan tidak valid.';
			return;
		}

		isSavingOwners = true;
		try {
			await onSaveOwnerships(localOwnerships);
		} catch (err: any) {
			ownershipError = err.message || 'Gagal menyimpan data kepemilikan.';
		} finally {
			isSavingOwners = false;
		}
	}
</script>

<Modal
	{open}
	title={outlet ? `Detail Gerai: ${outlet.name} (${outlet.code})` : 'Detail Gerai'}
	maxWidth="1140px"
	onclose={onClose}
>
	{#snippet footer()}
		<button type="button" class="btn btn-secondary btn-sm" onclick={onClose}>
			Tutup
		</button>
	{/snippet}

	<div class="outlet-detail-layout">
		<!-- 1. Hero Card: Identitas Gerai & Organisasi Induk -->
		<div class="outlet-hero-card" style="padding: 14px 18px;">
			<div class="flex items-start gap-3.5">
				<div class="outlet-hero-code-badge">
					{outlet?.code}
				</div>
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2.5 flex-wrap">
						<h3 class="font-bold text-base text-main m-0">{outlet?.name}</h3>
						<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium" style="background: var(--bg-panel); border: 1px solid var(--border-panel); color: var(--text-muted);">
							<Icon name="building-office" size={13} />
							<span>Induk: <strong class="text-main">{parentOrg?.name || 'Organisasi Terdaftar'}</strong></span>
						</span>
					</div>
					<div class="flex items-center gap-1.5 text-xs text-muted">
						<Icon name="map-pin" size={13} />
						<span>{outlet?.address || `Area ${outlet?.city || 'Indonesia'}`}</span>
					</div>
				</div>
			</div>

			<StatusBadge
				status={outlet?.active !== false ? 'active' : 'inactive'}
				size="md"
			/>
		</div>

		<!-- 2. Master 2-Kolom: Kiri (Operasional & Tim) | Kanan (Investor Mitra) -->
		<div class="outlet-master-grid">
			<!-- Kolom Kiri: Parameter Operasional & Tim Penugasan -->
			<div class="master-column">
				<!-- Parameter Operasional & Finansial -->
				<div class="detail-section">
					<div class="detail-section-header">
						<div class="detail-section-title">
							<Icon name="banknotes" size={16} class="text-emerald-500" />
							<span>Parameter Operasional &amp; Finansial</span>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="dash-subbox">
							<span class="text-muted font-medium text-[11px]">Kota / Lokasi</span>
							<p class="font-bold text-xs text-main mt-0.5">{outlet?.city || '-'}</p>
						</div>

						<div class="dash-subbox">
							<span class="text-muted font-medium text-[11px]">Model Kepemilikan</span>
							<p class="font-bold text-xs text-main mt-0.5">
								{outlet?.owner_type === 'partner' ? 'Kemitraan Investor' : 'Milik Sendiri (Internal)'}
							</p>
						</div>

						<div class="dash-subbox">
							<span class="text-muted font-medium text-[11px]">Pajak PBJT Restoran</span>
							<p class="font-bold text-xs text-main mt-0.5">
								{Math.round((outlet?.tax_rate || 0.1) * 100)}%
							</p>
						</div>

						<div class="dash-subbox">
							<span class="text-muted font-medium text-[11px]">Service Charge</span>
							<p class="font-bold text-xs text-main mt-0.5">
								{Math.round((outlet?.service_charge || 0.05) * 100)}%
							</p>
						</div>
					</div>

					<!-- Kas Kecil & POS Info Strip -->
					<div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t" style="border-color: var(--border-panel);">
						<div class="dash-subbox flex items-center justify-between py-2 px-3 text-xs">
							<div>
								<span class="text-muted text-[11px] font-medium">Batas Kas Kecil:</span>
								<p class="font-bold text-main font-mono m-0 text-xs">
									{formatRupiah(outlet?.petty_cash_limit || '300000.00')}
								</p>
							</div>
							<Badge variant="success" size="sm">HQ Policy</Badge>
						</div>

						<div class="dash-subbox flex items-center justify-between py-2 px-3 text-xs">
							<div class="flex items-center gap-2">
								<Icon name="device-tablet" size={15} class="text-emerald-500" />
								<div>
									<span class="text-muted text-[11px] font-medium">Kasir POS:</span>
									<p class="font-bold text-xs text-emerald-600 m-0">Sinkron Real-Time</p>
								</div>
							</div>
							<StatusBadge status="active" size="sm" />
						</div>
					</div>
				</div>

				<!-- Tim & Penugasan Pengguna Gerai -->
				<div class="detail-section">
					<div class="detail-section-header">
						<div class="detail-section-title">
							<Icon name="users" size={16} class="text-emerald-500" />
							<span>Tim &amp; Penugasan Gerai</span>
						</div>
					</div>

					<!-- Multi-Outlet SM Notice Callout -->
					<div class="detail-notice-callout" style="padding: 10px 14px;">
						<Icon name="shield-check" size={16} class="shrink-0 mt-0.5 text-emerald-500" />
						<span class="text-xs">
							<strong>Penugasan Store Manager:</strong> SM dapat mengelola beberapa outlet dalam 1 organisasi (contoh: Sari mengelola Jodi Dago &amp; Gubeng).
						</span>
					</div>

					<!-- Staff List -->
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="dash-subbox flex items-center justify-between py-2 px-3">
							<div class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style="background: var(--bg-panel-hover); color: var(--text-main); border: 1px solid var(--border-subtle);">
									{outlet?.id === 'out-jkt-01' ? 'BP' : 'SR'}
								</div>
								<div>
									<span class="font-bold text-main block text-xs">
										{outlet?.id === 'out-jkt-01' ? 'Budi Santoso' : 'Sari Rahmawati'}
									</span>
									<p class="text-[10.5px] text-muted m-0">Store Manager</p>
								</div>
							</div>
							<Badge variant="info" size="sm">Aktif</Badge>
						</div>

						<div class="dash-subbox flex items-center justify-between py-2 px-3">
							<div class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style="background: var(--bg-panel-hover); color: var(--text-main); border: 1px solid var(--border-subtle);">
									AF
								</div>
								<div>
									<span class="font-bold text-main block text-xs">Ahmad Faisal</span>
									<p class="text-[10.5px] text-muted m-0">Kasir Shift Siang</p>
								</div>
							</div>
							<Badge variant="neutral" size="sm">Kasir</Badge>
						</div>
					</div>
				</div>
			</div>

			<!-- Kolom Kanan: Kepemilikan Gerai & Investor Mitra -->
			<div class="master-column">
				{#if isPartnerEnabled}
					<div class="detail-section h-full flex flex-col justify-between">
						<div>
							<div class="detail-section-header mb-3">
								<div class="detail-section-title">
									<Icon name="clipboard-document-check" size={16} class="text-emerald-500" />
									<span>Kepemilikan Gerai &amp; Investor Mitra</span>
								</div>

								{#if localOwnerships.length > 0}
									<div class="flex items-center gap-2">
										<Badge variant={ownershipEvaluation.totalSharePct === 100 ? 'success' : 'warning'} size="sm">
											Total: {ownershipEvaluation.totalSharePct}%
										</Badge>
										<button
											type="button"
											class="btn btn-secondary btn-xs"
											onclick={handleAddOwnerRow}
										>
											<Icon name="plus" size={12} />
											<span>Tambah Investor</span>
										</button>
									</div>
								{/if}
							</div>

							{#if ownershipError}
								<div class="p-2.5 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg border border-red-500/20 mb-3">
									{ownershipError}
								</div>
							{/if}

							{#if ownershipEvaluation.hasEmptyShares && localOwnerships.length > 0}
								<div class="warning-empty-share mb-3" id="warning-empty-share-banner">
									<Icon name="exclamation-triangle" size={15} />
									<span class="text-xs">Perhatian: Terdapat persentase kepemilikan yang belum diisi lengkap. Data tetap dapat disimpan sementara.</span>
								</div>
							{/if}

							{#if localOwnerships.length > 0}
								<div class="flex flex-col gap-2.5">
									{#each localOwnerships as own, idx}
										<div class="timeline-card">
											<div class="timeline-header">
												<span class="text-xs font-bold text-main">Investor #{idx + 1}</span>
												<button
													type="button"
													class="text-xs text-red-400 hover:text-red-500 font-semibold cursor-pointer"
													onclick={() => handleRemoveOwnerRow(idx)}
												>
													Hapus
												</button>
											</div>

											<div class="grid grid-cols-2 gap-2.5 text-xs">
												<div class="field-group col-span-2">
													<label class="field-label" for="owner-name-{idx}">Nama Pemilik / Investor</label>
													<input
														id="owner-name-{idx}"
														type="text"
														class="field-input"
														bind:value={own.owner_name}
														placeholder="Nama Investor..."
													/>
												</div>

												<div class="field-group">
													<label class="field-label" for="owner-pct-{idx}">Saham (%)</label>
													<input
														id="owner-pct-{idx}"
														type="number"
														step="0.1"
														min="0"
														max="100"
														class="field-input font-bold"
														value={own.share_pct ?? ''}
														oninput={(e) => {
															const val = (e.target as HTMLInputElement).value;
															own.share_pct = val === '' ? null : parseFloat(val);
														}}
														placeholder="Boleh kosong"
													/>
												</div>

												<div class="field-group">
													<DatePicker
														id="owner-from-{idx}"
														label="Berlaku Mulai"
														bind:value={own.effective_from}
													/>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<!-- Kondisi Gerai Mandiri (Tanpa Investor Luar) -->
								<div class="dash-subbox p-4 my-2 flex flex-col gap-2.5">
									<div class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-2.5">
											<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-panel-hover); color: var(--text-muted); border: 1px solid var(--border-subtle);">
												<Icon name="building-storefront" size={16} />
											</div>
											<span class="font-bold text-main text-xs block">Gerai Milik Sendiri (Internal 100%)</span>
										</div>
										<button
											type="button"
											class="btn btn-secondary btn-xs shrink-0"
											onclick={handleAddOwnerRow}
										>
											<Icon name="plus" size={12} />
											<span>Tambah Investor Luar</span>
										</button>
									</div>
									<p class="text-[12px] text-muted m-0 leading-relaxed">
										Seluruh modal dan keuntungan gerai dikelola penuh oleh entitas bisnis induk tanpa pembagian saham mitra investor luar.
									</p>
								</div>
							{/if}
						</div>

						{#if localOwnerships.length > 0}
							<div class="section-footer-action mt-3 pt-3 border-t" style="border-color: var(--border-panel);">
								<button
									type="button"
									class="btn btn-primary btn-sm w-full"
									onclick={handleSaveOwners}
									disabled={isSavingOwners}
								>
									{isSavingOwners ? 'Menyimpan...' : 'Simpan Pembagian Saham'}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</Modal>
