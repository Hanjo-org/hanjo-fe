<script lang="ts">
	import type { Snippet } from 'svelte';
	import { session } from '../../auth/session.svelte.js';
	import type { CanContext } from '../../auth/can.js';

	interface Props {
		action: string;
		resource?: string;
		context?: CanContext;
		fallback?: Snippet;
		children?: Snippet;
	}

	let { action, resource, context, fallback, children }: Props = $props();

	let allowed = $derived(session.can(action, resource, context));
</script>

{#if allowed}
	{#if children}
		{@render children()}
	{/if}
{:else if fallback}
	{@render fallback()}
{/if}
