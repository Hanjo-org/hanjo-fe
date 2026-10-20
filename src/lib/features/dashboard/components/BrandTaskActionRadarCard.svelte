<script lang="ts">
	/**
	 * BrandTaskActionRadarCard.svelte
	 * Tugas Brand Manager (Diurutkan berdasarkan urgensi & dikelompokkan per outlet)
	 *
	 * 1. Rekomendasi transfer stok antar outlet
	 * 2. Usulan menu / resep lokal dari outlet (kurasi sebelum ke pusat)
	 * 3. Otorisasi belanja kas kecil di atas batas
	 * 4. Laporan EOD outlet yang belum masuk
	 * 5. Stock opname terjadwal
	 */
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { formatRupiah } from '../../../utils/format.js';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';

	interface BrandTask {
		id: string;
		type: 'transfer' | 'proposal' | 'expense' | 'eod' | 'opname';
		title: string;
		outlet: string;
		desc: string;
		badge: string;
		badgeVariant: 'warning' | 'info' | 'danger' | 'success';
		amount?: string;
		requester?: string;
		actionLabel: string;
	}

	const initialTasks: BrandTask[] = [
		{
			id: 'tsk-1',
			type: 'transfer',
			title: 'Transfer Stok: Fresh Milk (+15 L)',
			outlet: 'Jodi Dago ➔ Jodi Gubeng',
			desc: 'Dago mengalami surplus Fresh Milk, sedangkan Gubeng diprediksi habis pukul 15:00 WIB.',
			badge: 'Transfer Stok',
			badgeVariant: 'warning',
			requester: 'Sistem Prediksi ERP',
			actionLabel: 'Setujui Transfer'
		},
		{
			id: 'tsk-2',
			type: 'proposal',
			title: 'Usulan Menu: Avocado Cold Brew',
			outlet: 'Jodi Senopati',
			desc: 'Varian seasonal summer. Butuh kurasi rasa & HPP oleh Brand Manager sebelum diajukan ke HQ Admin.',
			badge: 'Kurasi Resep',
			badgeVariant: 'info',
			requester: 'Budi Santoso (SM Senopati)',
			actionLabel: 'Kurasi Resep'
		},
		{
			id: 'tsk-3',
			type: 'expense',
			title: 'Belanja Luar Kas Kecil (Es Batu Darurat)',
			outlet: 'Jodi Senopati',
			desc: 'Beli 5 kantong es kristal karena mesin es sedang maintenance siang tadi.',
			badge: 'Otorisasi Kas',
			badgeVariant: 'warning',
			amount: '85000.00',
			requester: 'Budi Santoso',
			actionLabel: 'Setujui'
		},
		{
			id: 'tsk-4',
			type: 'eod',
			title: 'Laporan Tutup Hari (EOD) Belum Masuk',
			outlet: 'Jodi Gubeng',
			desc: 'Checklist tutup kas laci fisik dan sinkronisasi POS shift malam belum dimulai.',
			badge: 'Tutup Hari',
			badgeVariant: 'danger',
			actionLabel: 'Ingatkan Kasir'
		},
		{
			id: 'tsk-5',
			type: 'opname',
			title: 'Jadwal Stock Opname Malam Ini',
			outlet: 'Jodi Dago',
			desc: 'Audit fisik harian untuk Biji Kopi House Blend & Sirup Caramel sebelum tutup gerai.',
			badge: 'Opname Audit',
			badgeVariant: 'info',
			actionLabel: 'Buka Form'
		}
	];

	let tasks = $state<BrandTask[]>(initialTasks);
	let completedTaskIds = $state<Set<string>>(new Set());
	let toastMessage = $state<string | null>(null);

	const activeTasks = $derived(tasks.filter((t) => !completedTaskIds.has(t.id)));

	function completeTask(task: BrandTask, actionType: string) {
		completedTaskIds.add(task.id);
		toastMessage = `Tindakan berhasil: ${task.title} (${actionType})`;
		setTimeout(() => {
			if (toastMessage) toastMessage = null;
		}, 3500);
	}
</script>

<DashboardCardFrame
	cardKey="action_center"
	customContent={true}
	title="Tugas & Otorisasi Brand Manager"
	icon="bolt"
	subtitle="Tindakan urgen dikelompokkan per gerai: kurasi resep, transfer stok, belanja kas & EOD"
	badgeText="{activeTasks.length} Tindakan Menunggu"
	badgeVariant={activeTasks.length > 0 ? 'warning' : 'success'}
	colSpan="col-12 col-lg-5"
>
	<!-- Toast Notifikasi Hasil Aksi -->
	{#if toastMessage}
		<div class="dash-banner dash-banner-success flex items-center justify-between py-2 px-3 mb-2 animate-fadeIn">
			<div class="flex items-center gap-2">
				<Icon name="check-circle" size={15} />
				<span class="text-xs font-semibold">{toastMessage}</span>
			</div>
			<button type="button" class="text-xs text-muted hover:text-main" onclick={() => (toastMessage = null)}>✕</button>
		</div>
	{/if}

	<!-- Scrollable Task List -->
	<div class="alert-items-scroll">
		{#if activeTasks.length === 0}
			<div class="p-6 text-center text-muted">
				<Icon name="check-circle" size={24} class="mb-2 text-primary mx-auto" />
				<p class="text-xs m-0 font-semibold" style="color: var(--text-main);">Seluruh tugas brand selesai!</p>
				<p class="text-[11px] text-muted m-0 mt-1">Tidak ada otorisasi atau rekomendasi stok yang tertunda.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2.5">
				{#each activeTasks as task}
					<div
						class="dash-subbox p-3 flex flex-col gap-2"
						style="border-left: 3px solid {task.type === 'transfer' ? '#3b82f6' : task.type === 'expense' ? '#f59e0b' : task.type === 'eod' ? '#ef4444' : '#10b981'};"
					>
						<!-- Baris Header Tugas -->
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-center gap-2 flex-wrap">
								<Badge variant={task.badgeVariant} text={task.badge} size="sm" />
								<span class="text-xs font-bold" style="color: var(--text-main);">{task.title}</span>
							</div>
							<span
								class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex-shrink-0"
								style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted);"
							>
								{task.outlet}
							</span>
						</div>

						<!-- Keterangan & Pemohon -->
						<p class="text-xs m-0 leading-relaxed" style="color: var(--text-muted);">
							{task.desc}
						</p>

						{#if task.amount || task.requester}
							<div class="flex items-center justify-between text-[11px] pt-1 border-t" style="border-color: var(--border-panel);">
								{#if task.amount}
									<span class="font-mono font-bold" style="color: #34d399;">
										Nominal: {formatRupiah(task.amount)}
									</span>
								{:else if task.requester}
									<span style="color: var(--text-subtle);">
										Pemohon: <strong style="color: var(--text-main);">{task.requester}</strong>
									</span>
								{/if}

								<!-- Tombol Aksi Mandiri -->
								<div class="flex items-center gap-1.5 ml-auto">
									{#if task.type === 'expense'}
										<button
											type="button"
											class="btn-reject-direct"
											onclick={() => completeTask(task, 'Ditolak')}
										>
											Tolak
										</button>
										<button
											type="button"
											class="btn-approve-direct"
											onclick={() => completeTask(task, 'Disetujui')}
										>
											<Icon name="check" size={13} />
											<span>Setujui</span>
										</button>
									{:else if task.type === 'transfer'}
										<button
											type="button"
											class="btn-approve-direct"
											style="background: #2563eb; border-color: #3b82f6;"
											onclick={() => completeTask(task, 'Transfer Disetujui')}
										>
											<Icon name="arrow-right-arrow-left" size={13} />
											<span>{task.actionLabel}</span>
										</button>
									{:else if task.type === 'proposal'}
										<a
											href="/catalog#proposals"
											class="btn-approve-direct"
											style="background: #0284c7; border-color: #38bdf8;"
										>
											<Icon name="pencil-square" size={13} />
											<span>{task.actionLabel}</span>
										</a>
									{:else}
										<button
											type="button"
											class="btn-approve-direct"
											onclick={() => completeTask(task, 'Diingatkan')}
										>
											<Icon name="bell" size={13} />
											<span>{task.actionLabel}</span>
										</button>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</DashboardCardFrame>
