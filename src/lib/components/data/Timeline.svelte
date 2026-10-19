<script lang="ts">
	export interface TimelineItem {
		id: string;
		title: string;
		subtitle?: string;
		time?: string;
		actor?: string;
		status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
	}

	interface Props {
		items: TimelineItem[];
		class?: string;
	}

	let {
		items = [],
		class: className = ''
	}: Props = $props();
</script>

<div class="timeline-container {className}">
	{#each items as item, index}
		{@const isLast = index === items.length - 1}
		<div class="timeline-entry">
			<div class="timeline-rail">
				<div class="timeline-dot dot-{item.status || 'info'}"></div>
				{#if !isLast}
					<div class="timeline-line"></div>
				{/if}
			</div>

			<div class="timeline-body">
				<div class="timeline-header">
					<span class="timeline-title">{item.title}</span>
					{#if item.time}
						<span class="timeline-time">{item.time}</span>
					{/if}
				</div>

				{#if item.subtitle}
					<p class="timeline-subtitle">{item.subtitle}</p>
				{/if}

				{#if item.actor}
					<span class="timeline-actor">Oleh: <strong>{item.actor}</strong></span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.timeline-container {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.timeline-entry {
		display: flex;
		gap: 12px;
	}

	.timeline-rail {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 16px;
		flex-shrink: 0;
	}

	.timeline-dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		margin-top: 4px;
		z-index: 2;
	}

	.dot-success { background-color: var(--brand-primary); box-shadow: 0 0 0 3px var(--brand-primary-dim); }
	.dot-warning { background-color: var(--pill-warning-text); box-shadow: 0 0 0 3px var(--pill-warning-bg); }
	.dot-danger { background-color: var(--pill-danger-text); box-shadow: 0 0 0 3px var(--pill-danger-bg); }
	.dot-info { background-color: var(--pill-info-text); box-shadow: 0 0 0 3px var(--pill-info-bg); }
	.dot-neutral { background-color: var(--text-subtle); box-shadow: 0 0 0 3px var(--bg-panel-sub); }

	.timeline-line {
		width: 2px;
		flex: 1;
		background-color: var(--border-panel);
		margin: 4px 0;
	}

	.timeline-body {
		padding-bottom: 20px;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}

	.timeline-title {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-main);
	}

	.timeline-time {
		font-size: 11px;
		color: var(--text-subtle);
		font-family: var(--font-mono, monospace);
	}

	.timeline-subtitle {
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	.timeline-actor {
		font-size: 11.5px;
		color: var(--text-subtle);
		margin-top: 2px;
	}
</style>
