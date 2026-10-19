<script lang="ts">
	import { apiClient, type DataSourceType } from '../../api/client.js';
	import { Endpoints } from '../../api/contract/endpoints.js';
	import { session } from '../../auth/session.svelte.js';
	import { toast } from '../feedback/toast.svelte.js';

	let isOpen = $state(false);
	let currentSource = $state<DataSourceType>(apiClient.getDataSource());
	let latencyMs = $state(50);
	let isClockFrozen = $state(false);
	let currentBusinessDate = $state(session.businessDate);
	let isResetting = $state(false);

	async function switchDataSource(source: DataSourceType) {
		apiClient.setDataSource(source);
		currentSource = source;
		toast.info(`Sumber data diubah ke: ${source.toUpperCase()}`);
	}

	async function updateLatency(ms: number) {
		latencyMs = ms;
		await apiClient.post(Endpoints.DEV.LATENCY, {
			min_ms: ms,
			max_ms: ms + 50,
			enabled: ms > 0
		});
		toast.info(`Latensi jaringan disetel ke ~${ms}ms`);
	}

	async function handleClockAction(action: 'freeze' | 'unfreeze' | 'advance_hours' | 'advance_days' | 'reset') {
		const res = await apiClient.post<any>(Endpoints.DEV.CLOCK, {
			action,
			hours: action === 'advance_hours' ? 1 : undefined,
			days: action === 'advance_days' ? 1 : undefined
		});

		if (res.data) {
			isClockFrozen = res.data.is_frozen;
			currentBusinessDate = res.data.business_date;
			session.init(); // Refresh date in session
		}

		if (action === 'freeze') toast.warning('Waktu dibekukan');
		else if (action === 'unfreeze') toast.success('Waktu dicairkan (berjalan)');
		else if (action === 'advance_days') toast.info(`Waktu dimajukan 1 hari: ${currentBusinessDate}`);
		else if (action === 'reset') toast.info('Waktu di-reset ke waktu sistem');
	}

	async function handleResetDemo() {
		isResetting = true;
		try {
			await apiClient.post(Endpoints.DEV.RESET, {});
			session.init();
			toast.success('Database demo & clock berhasil di-reset ke kondisi awal!');
		} finally {
			isResetting = false;
		}
	}
</script>

<div class="dev-panel-container">
	{#if !isOpen}
		<button
			type="button"
			class="dev-badge-trigger"
			onclick={() => (isOpen = true)}
			title="Buka Panel Sumber Data & Dev Control"
		>
			<span class="pulse-dot" aria-hidden="true"></span>
			<span class="source-tag">{currentSource.toUpperCase()}</span>
			{#if isClockFrozen}
				<span class="frozen-tag">❄</span>
			{/if}
		</button>
	{:else}
		<div class="dev-panel-card" role="region" aria-label="Dev Panel Sumber Data">
			<div class="panel-header">
				<div class="header-title">
					<span class="dev-icon">⚡</span>
					<strong>Dev Data Panel (§T-00.13)</strong>
				</div>
				<button
					type="button"
					class="close-btn"
					aria-label="Tutup Panel Dev"
					onclick={() => (isOpen = false)}
				>
					&times;
				</button>
			</div>

			<div class="panel-body">
				<!-- Sumber Data (Driver) -->
				<div class="control-group">
					<span class="control-label">SUMBER DATA:</span>
					<div class="source-buttons">
						<button
							type="button"
							class="source-btn"
							class:active={currentSource === 'mock'}
							onclick={() => switchDataSource('mock')}
						>
							Mock Engine
						</button>
						<button
							type="button"
							class="source-btn"
							class:active={currentSource === 'api'}
							onclick={() => switchDataSource('api')}
						>
							Real API (Go)
						</button>
					</div>
				</div>

				<!-- Latensi Jaringan -->
				<div class="control-group">
					<span class="control-label">LATENSI SIMULASI:</span>
					<div class="latency-presets">
						<button
							type="button"
							class="preset-btn"
							class:active={latencyMs === 0}
							onclick={() => updateLatency(0)}
						>
							0ms
						</button>
						<button
							type="button"
							class="preset-btn"
							class:active={latencyMs === 50}
							onclick={() => updateLatency(50)}
						>
							50ms
						</button>
						<button
							type="button"
							class="preset-btn"
							class:active={latencyMs === 200}
							onclick={() => updateLatency(200)}
						>
							200ms
						</button>
						<button
							type="button"
							class="preset-btn"
							class:active={latencyMs === 600}
							onclick={() => updateLatency(600)}
						>
							600ms
						</button>
					</div>
				</div>

				<!-- Kontrol Waktu & Clock Deterministik -->
				<div class="control-group">
					<div class="clock-label-row">
						<span class="control-label">CLOCK DETERMINISTIK:</span>
						<span class="date-text">{currentBusinessDate} (WIB)</span>
					</div>
					<div class="clock-actions">
						<button
							type="button"
							class="clock-btn"
							class:highlight={isClockFrozen}
							onclick={() => handleClockAction(isClockFrozen ? 'unfreeze' : 'freeze')}
						>
							{isClockFrozen ? '▶ Cairkan' : '❄ Bekukan'}
						</button>
						<button
							type="button"
							class="clock-btn"
							onclick={() => handleClockAction('advance_hours')}
						>
							+1 Jam
						</button>
						<button
							type="button"
							class="clock-btn"
							onclick={() => handleClockAction('advance_days')}
						>
							+1 Hari
						</button>
					</div>
				</div>

				<!-- Reset Demo PRNG -->
				<div class="reset-section">
					<button
						type="button"
						class="btn-reset-demo"
						disabled={isResetting}
						onclick={handleResetDemo}
					>
						{isResetting ? 'Mereset Database...' : '↺ Reset Demo ke Seed Awal'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.dev-panel-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9990;
		font-family: var(--font-body, sans-serif);
	}

	.dev-badge-trigger {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #0f172a;
		color: #ffffff;
		padding: 6px 12px;
		border-radius: 9999px;
		border: 1px solid #334155;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
		transition: all 0.2s;
	}

	.dev-badge-trigger:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #10b981;
		box-shadow: 0 0 6px #10b981;
	}

	.source-tag {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.frozen-tag {
		font-size: 11px;
	}

	.dev-panel-card {
		width: 290px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		animation: popUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes popUp {
		from { opacity: 0; transform: translateY(8px) scale(0.96); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: #0f172a;
		color: #ffffff;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
	}

	.close-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 18px;
		cursor: pointer;
		line-height: 1;
	}

	.close-btn:hover {
		color: #ffffff;
	}

	.panel-body {
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.control-label {
		font-size: 9.5px;
		font-weight: 700;
		color: #64748b;
		letter-spacing: 0.5px;
	}

	.source-buttons,
	.latency-presets,
	.clock-actions {
		display: flex;
		gap: 6px;
	}

	.source-btn,
	.preset-btn,
	.clock-btn {
		flex: 1;
		font-size: 11px;
		font-weight: 600;
		padding: 5px 8px;
		border: 1px solid #e2e8f0;
		background: #f8fafc;
		color: #334155;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.source-btn:hover,
	.preset-btn:hover,
	.clock-btn:hover {
		background: #e2e8f0;
	}

	.source-btn.active,
	.preset-btn.active,
	.clock-btn.highlight {
		background: #059669;
		color: #ffffff;
		border-color: #059669;
	}

	.clock-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.date-text {
		font-size: 10.5px;
		font-weight: 700;
		color: #059669;
	}

	.btn-reset-demo {
		width: 100%;
		padding: 7px 10px;
		font-size: 11.5px;
		font-weight: 600;
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-reset-demo:hover:not(:disabled) {
		background: #fee2e2;
	}

	.btn-reset-demo:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
