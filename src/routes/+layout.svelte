<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import './layout.css';
	import { page } from '$app/state';
	import { session } from '#lib/auth/session.svelte.js';
	import { themeStore } from '#lib/theme.svelte.js';
	import Sidebar from '#lib/components/layout/Sidebar.svelte';
	import Header from '#lib/components/layout/Header.svelte';
	import CommandPalette from '#lib/components/layout/CommandPalette.svelte';
	import DevSourcePanel from '#lib/components/layout/DevSourcePanel.svelte';
	import Toast from '#lib/components/feedback/Toast.svelte';

	let { children } = $props();

	let isCollapsed = $state(false);
	let showCommandPalette = $state(false);

	let currentPath = $derived(page.url.pathname);
	let isLoginPage = $derived(currentPath === '/login');

	onMount(() => {
		themeStore.init();
		session.init();

		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('hanjo_sidebar_collapsed');
			if (saved !== null) {
				isCollapsed = saved === 'true';
			} else if (window.innerWidth <= 1024) {
				// Auto-collapse pada viewport tablet (≤ 1024px) sesuai PRD 8.4 & T-01.5
				isCollapsed = true;
			}

			const handleResize = () => {
				const isSaved = localStorage.getItem('hanjo_sidebar_collapsed') !== null;
				if (!isSaved && window.innerWidth <= 1024 && !isCollapsed) {
					isCollapsed = true;
				}
			};

			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	});

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
		if (typeof window !== 'undefined') {
			localStorage.setItem('hanjo_sidebar_collapsed', String(isCollapsed));
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			showCommandPalette = !showCommandPalette;
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if isLoginPage}
	<!-- Halaman Login Tidak Memakai Shell Navigasi -->
	{@render children()}
{:else}
	<!-- Shell Aplikasi Standar ERP -->
	<div class="app-layout">
		<!-- Sidebar Navigasi Deklaratif (§T-00.10) -->
		<Sidebar {isCollapsed} onToggleCollapse={toggleCollapse} />

		<!-- Area Konten Utama -->
		<div class="main-content">
			<!-- Header Terstandarisasi (§T-00.10) -->
			<Header onOpenSearch={() => (showCommandPalette = true)} />

			<!-- Halaman Aktif -->
			<main class="page-body">
				{@render children()}
			</main>
		</div>

		<!-- Dialog Pencarian Global Quick Search (Ctrl+K) -->
		<CommandPalette
			isOpen={showCommandPalette}
			onClose={() => (showCommandPalette = false)}
		/>

		<!-- Panel Sumber Data & Dev Control (§T-00.13) -->
		<DevSourcePanel />

		<!-- Kontainer Notifikasi Toast Sistem -->
		<Toast position="top-right" />
	</div>
{/if}

<style>
	.app-layout {
		display: flex;
		min-height: 100vh;
		background-color: var(--bg-body, #f8fafc);
	}

	.main-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.page-body {
		flex: 1;
		padding: 24px;
		max-width: 1600px;
		width: 100%;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.page-body {
			padding: 16px 12px;
		}
	}
</style>
