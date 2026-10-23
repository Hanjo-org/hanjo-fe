<script lang="ts">
	export interface ChartDataPoint {
		label: string;
		value: number;
		formattedValue?: string;
	}

	interface Props {
		title?: string;
		subtitle?: string;
		type?: 'line' | 'bar';
		data?: ChartDataPoint[];
		height?: number;
		color?: string;
		class?: string;
	}

	let {
		title = '',
		subtitle = '',
		type = 'bar',
		data = [],
		height = 200,
		color = '#059669',
		class: className = ''
	}: Props = $props();

	let hoveredIndex = $state<number | null>(null);

	const maxValue = $derived(
		data.length > 0 ? Math.max(...data.map((d) => d.value), 1) : 1
	);

	// Perhitungan koordinat garis jika type === 'line'
	const svgWidth = 600;
	const svgHeight = 220;
	const padding = { top: 20, right: 30, bottom: 40, left: 40 };
	const chartInnerWidth = svgWidth - padding.left - padding.right;
	const chartInnerHeight = svgHeight - padding.top - padding.bottom;

	const linePoints = $derived(
		data.map((d, i) => {
			const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartInnerWidth;
			const y = padding.top + chartInnerHeight - (d.value / maxValue) * chartInnerHeight;
			return { x, y, data: d };
		})
	);

	const polylinePoints = $derived(
		linePoints.map((p) => `${p.x},${p.y}`).join(' ')
	);

	const areaPath = $derived(
		linePoints.length > 0
			? `M ${linePoints[0].x},${padding.top + chartInnerHeight} ` +
			  linePoints.map((p) => `L ${p.x},${p.y}`).join(' ') +
			  ` L ${linePoints[linePoints.length - 1].x},${padding.top + chartInnerHeight} Z`
			: ''
	);
</script>

<div class="panel-card chart-container {className}">
	{#if title || subtitle}
		<div class="chart-header">
			<div>
				{#if title}
					<h3 class="chart-title">{title}</h3>
				{/if}
				{#if subtitle}
					<p class="chart-subtitle">{subtitle}</p>
				{/if}
			</div>

			{#if hoveredIndex !== null && data[hoveredIndex]}
				<div class="hovered-pill">
					<span class="hovered-label">{data[hoveredIndex].label}:</span>
					<span class="hovered-value">
						{data[hoveredIndex].formattedValue || data[hoveredIndex].value.toLocaleString('id-ID')}
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<div class="svg-wrap" style="height: {height}px;">
		<svg
			viewBox="0 0 {svgWidth} {svgHeight}"
			preserveAspectRatio="none"
			class="chart-svg"
		>
			<!-- Grid lines horizontal -->
			{#each [0, 0.25, 0.5, 0.75, 1] as ratio}
				{@const y = padding.top + chartInnerHeight * (1 - ratio)}
				<line
					x1={padding.left}
					y1={y}
					x2={svgWidth - padding.right}
					y2={y}
					stroke="var(--border-subtle, #f1f5f9)"
					stroke-width="1"
				/>
			{/each}

			{#if type === 'line'}
				<!-- Area di bawah garis -->
				<path d={areaPath} fill="{color}" fill-opacity="0.12" />

				<!-- Garis grafik -->
				<polyline
					fill="none"
					stroke="{color}"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					points={polylinePoints}
				/>

				<!-- Titik-titik interaktif -->
				{#each linePoints as pt, i}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<circle
						cx={pt.x}
						cy={pt.y}
						r={hoveredIndex === i ? 6 : 4}
						fill="var(--bg-panel, #ffffff)"
						stroke="{color}"
						stroke-width="2.5"
						class="data-point"
						onmouseenter={() => (hoveredIndex = i)}
						onmouseleave={() => (hoveredIndex = null)}
					/>
				{/each}
			{:else}
				<!-- Bar Chart -->
				{@const barSlotWidth = chartInnerWidth / Math.max(data.length, 1)}
				{@const barWidth = Math.max(barSlotWidth * 0.6, 6)}
				{#each data as item, i}
					{@const barH = (item.value / maxValue) * chartInnerHeight}
					{@const x = padding.left + i * barSlotWidth + (barSlotWidth - barWidth) / 2}
					{@const y = padding.top + chartInnerHeight - barH}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<rect
						{x}
						{y}
						width={barWidth}
						height={Math.max(barH, 2)}
						rx="4"
						fill={hoveredIndex === i ? 'var(--brand-primary-light, #10b981)' : color}
						class="chart-bar"
						onmouseenter={() => (hoveredIndex = i)}
						onmouseleave={() => (hoveredIndex = null)}
					/>
				{/each}
			{/if}

			<!-- Label sumbu X -->
			{#each data as item, i}
				{@const x =
					type === 'line'
						? padding.left + (i / Math.max(data.length - 1, 1)) * chartInnerWidth
						: padding.left + (i + 0.5) * (chartInnerWidth / Math.max(data.length, 1))}
				<text
					{x}
					y={svgHeight - 12}
					text-anchor="middle"
					font-size="11"
					fill="var(--text-muted, #64748b)"
					font-family="var(--font-body, 'Plus Jakarta Sans', sans-serif)"
				>
					{item.label}
				</text>
			{/each}
		</svg>
	</div>
</div>

<style>
	.chart-container {
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		background: var(--bg-panel, #ffffff);
		border: 1px solid var(--border-panel, #e2e8f0);
		border-radius: var(--radius-lg, 12px);
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 32px;
	}

	.chart-title {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-main, #0f172a);
		margin: 0;
	}

	.chart-subtitle {
		font-size: 12px;
		color: var(--text-muted, #64748b);
		margin: 2px 0 0 0;
	}

	.hovered-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--pill-success-bg, #ecfdf5);
		border: 1px solid var(--pill-success-border, #a7f3d0);
		padding: 4px 10px;
		border-radius: 9999px;
		font-size: 12px;
	}

	.hovered-label {
		color: var(--pill-success-text, #047857);
		font-weight: 500;
	}

	.hovered-value {
		color: var(--pill-success-text, #065f46);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum' on, 'lnum' on;
	}

	.svg-wrap {
		width: 100%;
		position: relative;
	}

	.chart-svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.chart-bar {
		cursor: pointer;
		transition: fill 0.15s;
	}

	.data-point {
		cursor: pointer;
		transition: r 0.15s;
	}
</style>
