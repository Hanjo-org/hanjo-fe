<script lang="ts">
	/**
	 * ComingSoon.svelte
	 * Komponen Placeholder Informatif "Segera Hadir" (T-01.11, MILESTONE.md §MS-01)
	 *
	 * Menampilkan status modul yang sedang dalam tahap konstruksi milestone berikutnya,
	 * mempertahankan filter konteks yang terbawa (Organisasi, Outlet, Periode),
	 * dan menyediakan tindakan navigasi kembali yang jelas.
	 */
	import Icon from '../data/Icon.svelte';
	import Badge from '../data/Badge.svelte';
	import { session } from '../../auth/session.svelte.js';

	interface Props {
		title?: string;
		milestone?: string;
		description?: string;
		targetModule?: string;
		backUrl?: string;
		class?: string;
	}

	let {
		title = 'Fitur Segera Hadir',
		milestone = 'Milestone Berikutnya',
		description = 'Modul ini sedang dalam tahap konstruksi arsitektur DDD sesuai roadmap pengembangan Hanjo ERP.',
		targetModule = 'Modul ERP',
		backUrl = '/',
		class: className = ''
	}: Props = $props();

	const activeOrg = $derived(session.activeOrganizationId || 'Semua Organisasi');
	const activeOutlet = $derived(session.activeOutletId || 'Semua Outlet');
	const businessDate = $derived(session.businessDate || '2026-10-13');
</script>

<div class="coming-soon-wrapper {className}">
	<div class="coming-soon-card">
		<!-- Milestone Tag -->
		<div class="flex items-center justify-center gap-2 mb-2">
			<Badge variant="info" text={milestone} size="sm" />
			<span class="text-xs font-mono font-bold" style="color: var(--brand-primary);">&bull; {targetModule}</span>
		</div>

		<!-- Animated Construction Icon -->
		<div class="icon-circle">
			<Icon name="bolt" size={32} />
		</div>

		<!-- Title & Description -->
		<h2 class="coming-soon-title">{title}</h2>
		<p class="coming-soon-desc">{description}</p>

		<!-- Carried Context Box (Filter Terbawa - T-01.11) -->
		<div class="context-box">
			<div class="context-header">
				<Icon name="funnel" size={13} />
				<span>Konteks Filter Terbawa:</span>
			</div>
			<div class="context-grid">
				<div class="context-item">
					<span class="context-label">Organisasi:</span>
					<strong class="context-val">{activeOrg}</strong>
				</div>
				<div class="context-item">
					<span class="context-label">Outlet Terpilih:</span>
					<strong class="context-val">{activeOutlet}</strong>
				</div>
				<div class="context-item">
					<span class="context-label">Hari Bisnis:</span>
					<strong class="context-val font-mono">{businessDate} WIB</strong>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="actions-row">
			<a href={backUrl} class="btn-primary-action">
				<Icon name="arrow-left" size={14} />
				<span>Kembali ke Dashboard</span>
			</a>
			<a
				href="https://github.com/hanjo-erp"
				target="_blank"
				rel="noreferrer"
				class="btn-secondary-action"
			>
				<Icon name="document-text" size={14} />
				<span>Lihat Roadmap Milestone</span>
			</a>
		</div>
	</div>
</div>

<style>
	.coming-soon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 16px;
		width: 100%;
		box-sizing: border-box;
	}

	.coming-soon-card {
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-xl, 12px);
		box-shadow: var(--shadow-card);
		max-width: 560px;
		width: 100%;
		padding: 36px 28px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
	}

	.icon-circle {
		width: 64px;
		height: 64px;
		border-radius: var(--radius-full, 9999px);
		background: var(--pill-info-bg);
		color: var(--brand-primary);
		border: 1px solid var(--pill-info-border);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 18px;
	}

	.coming-soon-title {
		font-size: 20px;
		font-weight: 800;
		color: var(--text-main);
		margin: 0 0 8px 0;
		letter-spacing: -0.01em;
	}

	.coming-soon-desc {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0 0 20px 0;
		max-width: 440px;
	}

	.context-box {
		width: 100%;
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-lg, 10px);
		padding: 12px 16px;
		margin-bottom: 24px;
		text-align: left;
		box-sizing: border-box;
	}

	.context-header {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.context-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: 8px 12px;
	}

	.context-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.context-label {
		font-size: 10.5px;
		color: var(--text-subtle);
	}

	.context-val {
		font-size: 12px;
		color: var(--text-main);
	}

	.actions-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		flex-wrap: wrap;
		width: 100%;
	}

	.btn-primary-action {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 18px;
		border-radius: var(--radius-md, 8px);
		font-size: 12.5px;
		font-weight: 600;
		color: #ffffff;
		background: var(--brand-primary);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-primary-action:hover {
		opacity: 0.92;
		transform: translateY(-1px);
	}

	.btn-secondary-action {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 16px;
		border-radius: var(--radius-md, 8px);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-main);
		background: var(--bg-panel-sub);
		border: 1px solid var(--border-panel);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-secondary-action:hover {
		background: var(--bg-panel-hover);
		border-color: var(--border-focus);
	}
</style>
