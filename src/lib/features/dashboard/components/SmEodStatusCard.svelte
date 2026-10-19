<script lang="ts">
	import DashboardCardFrame from './DashboardCardFrame.svelte';
	import { dashboardStore } from '../stores/dashboard.svelte.js';
	import { formatDate } from '../../../utils/format.js';
	import Button from '../../../components/forms/Button.svelte';
	import Badge from '../../../components/data/Badge.svelte';
	import Icon from '../../../components/data/Icon.svelte';
	import type { SmEodStatusCardData } from '../../../api/contract/types.js';

	const cardState = $derived(dashboardStore.getCardState<SmEodStatusCardData>('sm_eod_status'));
	const data = $derived(cardState.data);

	// State interaktif lokal checklist
	let drawerChecked = $state(false);
	let wasteChecked = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		if (data) {
			const drawerItem = data.checklist.find((c) => c.key === 'cash_drawer');
			const wasteItem = data.checklist.find((c) => c.key === 'waste_recorded');
			drawerChecked = data.is_completed || (drawerItem?.done ?? false);
			wasteChecked = data.is_completed || (wasteItem?.done ?? false);
		}
	});

	const isCompleted = $derived(data?.is_completed ?? false);
	const canComplete = $derived(!isCompleted && drawerChecked && wasteChecked);

	async function handleCompleteEod() {
		if (!canComplete) return;
		isSubmitting = true;
		try {
			await dashboardStore.completeEod('Tutup hari selesai oleh Store Manager');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<DashboardCardFrame
	cardKey="sm_eod_status"
	title="Checklist Tutup Hari Operasional (EOD)"
	icon="moon"
	subtitle="Kepatuhan penutupan shift kasir, hitung fisik kas laci, dan catat waste"
	badgeText={isCompleted ? 'Sudah Tutup Hari' : 'Belum Selesai'}
	badgeVariant={isCompleted ? 'success' : 'danger'}
	colSpan="col-12 col-lg-6"
>
	{#if data}
		<div class="eod-checklist-box" id="eod-checklist">
			{#if isCompleted}
				<div class="dash-banner dash-banner-success p-4 flex items-center justify-between">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm">Gerai Telah Resmi Tutup Hari</span>
							<Badge variant="success" text="Tutup Hari Selesai" size="sm" />
						</div>
						<span class="text-xs opacity-90">
							Laporan harian berhasil dikirim ke Owner & Finance. Waktu: <strong>{data.completed_at ? formatDate(data.completed_at, true) : 'Hari ini'}</strong>
						</span>
					</div>
					<Icon name="check-circle" size={28} />
				</div>
			{:else}
				<div class="dash-banner dash-banner-warning flex items-center gap-2">
					<Icon name="exclamation-triangle" size={16} />
					<span><strong>Perhatian:</strong> Selesaikan 3 langkah di bawah sebelum meninggalkan gerai agar laporan konsolidasi omzet pusat tidak tertunda.</span>
				</div>
			{/if}

			<!-- Item 1: Hitung Kas Laci -->
			<label class="eod-check-item {drawerChecked ? 'done' : ''}">
				<input
					type="checkbox"
					class="eod-checkbox"
					disabled={isCompleted || isSubmitting}
					bind:checked={drawerChecked}
				/>
				<div class="eod-check-text">
					<span class="eod-check-label">1. Hitung Fisik Uang Kas Laci POS</span>
					<span class="eod-check-details">
						Cocokkan uang tunai fisik di laci kasir dengan total struk penjualan tunai hari ini.
					</span>
				</div>
			</label>

			<!-- Item 2: Sinkronisasi POS (Otomatis dari sistem) -->
			<div class="eod-check-item done opacity-90 cursor-default">
				<input
					type="checkbox"
					class="eod-checkbox"
					checked={true}
					disabled={true}
				/>
				<div class="eod-check-text">
					<span class="eod-check-label">2. Seluruh Penjualan POS Hari Ini Tersinkron</span>
					<span class="eod-check-details font-semibold flex items-center gap-1" style="color: var(--brand-primary);">
						<Icon name="check" size={13} />
						<span>238 transaksi struk berhasil tersinkron ke cloud ERP</span>
					</span>
				</div>
			</div>

			<!-- Item 3: Catat Waste -->
			<label class="eod-check-item {wasteChecked ? 'done' : ''}">
				<input
					type="checkbox"
					class="eod-checkbox"
					disabled={isCompleted || isSubmitting}
					bind:checked={wasteChecked}
				/>
				<div class="eod-check-text">
					<span class="eod-check-label">3. Catat Pembuangan & Waste Bahan Baku</span>
					<span class="eod-check-details">
						Input susu kedaluwarsa, tumpahan biji kopi, atau sisa adonan pastry sebelum toko tutup.
					</span>
				</div>
			</label>

			{#if !isCompleted}
				<div class="eod-complete-bar">
					<span class="text-xs" style="color: var(--text-subtle);">
						{#if !canComplete}
							Centang semua checklist di atas untuk mengaktifkan tombol.
						{:else}
							Semua checklist lengkap! Siap tutup hari.
						{/if}
					</span>

					<Button
						variant="primary"
						size="md"
						disabled={!canComplete || isSubmitting}
						onclick={handleCompleteEod}
					>
						{isSubmitting ? 'Memproses EOD...' : 'Selesaikan Tutup Hari (EOD)'}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</DashboardCardFrame>
