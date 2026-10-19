<script lang="ts">
	import { getStatusMeta } from '../../config/status_dictionary.js';
	import Badge from './Badge.svelte';

	interface Props {
		status?: string | null;
		size?: 'sm' | 'md';
		showDot?: boolean;
		class?: string;
	}

	let {
		status = '',
		size = 'md',
		showDot = true,
		class: className = ''
	}: Props = $props();

	let meta = $derived(getStatusMeta(status));
</script>

<Badge
	variant={meta.variant}
	text={meta.label}
	dot={showDot}
	{size}
	class={className}
/>
