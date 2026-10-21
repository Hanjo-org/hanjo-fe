<script lang="ts">
	import { page } from '$app/state';
	import ComingSoon from '#lib/components/feedback/ComingSoon.svelte';

	let featureParam = $derived(page.url.searchParams.get('feature') || 'Fitur Segera Hadir');
	let milestoneParam = $derived(page.url.searchParams.get('milestone') || 'Milestone Staged');
	let moduleParam = $derived(page.url.searchParams.get('module') || 'Modul ERP');
	let descParam = $derived(page.url.searchParams.get('desc') || undefined);
</script>

<svelte:head>
	<title>{featureParam} | HANJO ERP</title>
</svelte:head>

<div class="coming-soon-page">
	<ComingSoon
		title={featureParam}
		milestone={milestoneParam}
		targetModule={moduleParam}
		description={descParam}
		backUrl="/"
	/>
</div>

<style>
	.coming-soon-page {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 120px);
	}
</style>
