<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FeatureFlagKey } from '../../config/feature_flags.js';
	import { session } from '../../auth/session.svelte.js';

	interface Props {
		flag: FeatureFlagKey;
		fallback?: Snippet;
		children?: Snippet;
	}

	let { flag, fallback, children }: Props = $props();

	let isEnabled = $derived(session.hasFeature(flag));
</script>

{#if isEnabled}
	{#if children}
		{@render children()}
	{/if}
{:else if fallback}
	{@render fallback()}
{/if}
