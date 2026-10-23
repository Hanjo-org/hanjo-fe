<script lang="ts">
	/**
	 * Custom DatePicker Component Hanjo ERP
	 *
	 * Komponen Kalender Kustom Penuh (No Native White Popups).
	 * Fitur Portal & Floating Positioning: Dropdown di-teleport ke document.body
	 * dengan position: fixed agar tidak pernah terpotong (clipped) oleh panel,
	 * modal dialog, drawer, atau container yang memiliki overflow: hidden / auto.
	 *
	 * Mengikuti Golden Rule 10 (Light & Dark Mode Parity), Golden Rule 7 (Generous Padding & Anti-Sesak),
	 * dan Standar Desain Hanjo (Emerald Forest Theme, border-radius 12px / rounded-xl).
	 */

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		value?: string; // Format ISO YYYY-MM-DD
		placeholder?: string;
		min?: string; // YYYY-MM-DD
		max?: string; // YYYY-MM-DD
		required?: boolean;
		disabled?: boolean;
		error?: string;
		helperText?: string;
		class?: string;
		showClear?: boolean;
		onchange?: (val: string) => void;
	}

	let {
		id,
		name,
		label = '',
		value = $bindable(''),
		placeholder = 'Pilih tanggal...',
		min,
		max,
		required = false,
		disabled = false,
		error = '',
		helperText = '',
		class: className = '',
		showClear = true,
		onchange
	}: Props = $props();

	const defaultId = `datepicker-${Math.random().toString(36).substring(2, 9)}`;
	const dateId = $derived(id || defaultId);

	let triggerEl = $state<HTMLElement | null>(null);
	let popoverEl = $state<HTMLElement | null>(null);
	let popoverTop = $state(0);
	let popoverLeft = $state(0);

	let isOpen = $state(false);
	let viewMode = $state<'days' | 'months' | 'years'>('days');
	let viewDate = $state(new Date());

	const monthNames = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	const shortMonthNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
		'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
	];

	const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

	function toIsoDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	const todayStr = $derived.by(() => {
		const now = new Date();
		return toIsoDate(now);
	});

	function parseDate(str: string): Date | null {
		if (!str) return null;
		const parts = str.split('-').map(Number);
		if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
			return new Date(parts[0], parts[1] - 1, parts[2]);
		}
		return null;
	}

	// Format tanggal ramah pengguna untuk field tampilan (contoh: "13 Okt 2026")
	const displayValue = $derived.by(() => {
		const parsed = parseDate(value);
		if (!parsed) return '';
		const d = parsed.getDate();
		const m = shortMonthNames[parsed.getMonth()];
		const y = parsed.getFullYear();
		return `${d} ${m} ${y}`;
	});

	// Hitung koordinat floating popover agar menempel di trigger & otomatis flip jika ruang bawah sempit
	function updatePosition() {
		if (!triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		const popoverWidth = 310;
		const popoverHeight = popoverEl ? popoverEl.offsetHeight : 345;

		let top = rect.bottom + 6;
		let left = rect.left;

		// 1. Cek horizontal overflow di sisi kanan layar
		if (left + popoverWidth > window.innerWidth - 14) {
			left = Math.max(14, window.innerWidth - popoverWidth - 14);
		}

		// 2. Cek vertical overflow: jika ruang di bawah sempit (< popoverHeight), buka ke atas
		const spaceBelow = window.innerHeight - rect.bottom;
		if (spaceBelow < popoverHeight && rect.top > popoverHeight + 14) {
			top = rect.top - popoverHeight - 6;
		}

		// 3. Jika trigger ter-scroll keluar dari viewport sepenuhnya, tutup popover
		if (rect.bottom < 0 || rect.top > window.innerHeight) {
			isOpen = false;
			return;
		}

		popoverTop = top;
		popoverLeft = left;
	}

	// Sinkronisasi viewDate & floating coordinates saat popover dibuka
	$effect(() => {
		if (isOpen) {
			const parsed = parseDate(value);
			if (parsed) {
				viewDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
			} else {
				const now = new Date();
				viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
			}
			viewMode = 'days';

			updatePosition();

			// Dengarkan event scroll & resize pada window dengan capture: true
			// sehingga scroll di container mana pun (modal, panel, list) langsung memperbarui posisi
			const handleScrollCapture = () => {
				if (isOpen) updatePosition();
			};
			window.addEventListener('scroll', handleScrollCapture, true);
			window.addEventListener('resize', handleScrollCapture);

			return () => {
				window.removeEventListener('scroll', handleScrollCapture, true);
				window.removeEventListener('resize', handleScrollCapture);
			};
		}
	});

	// Action Svelte: Pindahkan (teleport) elemen langsung ke document.body
	function portal(node: HTMLElement) {
		if (typeof document !== 'undefined') {
			document.body.appendChild(node);
		}
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	function isDateDisabled(dateStr: string): boolean {
		if (min && dateStr < min) return true;
		if (max && dateStr > max) return true;
		return false;
	}

	// Menghitung grid hari (42 cell: previous month, current month, next month)
	const calendarDays = $derived.by(() => {
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();

		const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Min) - 6 (Sab)
		const daysInPrevMonth = new Date(year, month, 0).getDate();
		const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

		const days = [];

		// Hari dari bulan sebelumnya
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const dayNum = daysInPrevMonth - i;
			const d = new Date(year, month - 1, dayNum);
			const dateStr = toIsoDate(d);
			days.push({
				date: d,
				dayNum,
				dateStr,
				isCurrentMonth: false,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value,
				isDisabled: isDateDisabled(dateStr)
			});
		}

		// Hari dari bulan ini
		for (let i = 1; i <= daysInCurrentMonth; i++) {
			const d = new Date(year, month, i);
			const dateStr = toIsoDate(d);
			days.push({
				date: d,
				dayNum: i,
				dateStr,
				isCurrentMonth: true,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value,
				isDisabled: isDateDisabled(dateStr)
			});
		}

		// Hari dari bulan berikutnya untuk melengkapi baris 35 atau 42 sel
		const remaining = (7 - (days.length % 7)) % 7;
		const totalCells = days.length + remaining < 35 ? 35 : days.length + remaining;
		const nextDaysNeeded = totalCells - days.length;

		for (let i = 1; i <= nextDaysNeeded; i++) {
			const d = new Date(year, month + 1, i);
			const dateStr = toIsoDate(d);
			days.push({
				date: d,
				dayNum: i,
				dateStr,
				isCurrentMonth: false,
				isToday: dateStr === todayStr,
				isSelected: dateStr === value,
				isDisabled: isDateDisabled(dateStr)
			});
		}

		return days;
	});

	// Tahun untuk mode 'years' (12 tahun per halaman)
	const yearRangeStart = $derived(Math.floor(viewDate.getFullYear() / 12) * 12);
	const calendarYears = $derived(Array.from({ length: 12 }, (_, i) => yearRangeStart + i));

	function toggleOpen() {
		if (disabled) return;
		isOpen = !isOpen;
	}

	function handlePrev() {
		if (viewMode === 'days') {
			viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
		} else if (viewMode === 'months') {
			viewDate = new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1);
		} else if (viewMode === 'years') {
			viewDate = new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1);
		}
	}

	function handleNext() {
		if (viewMode === 'days') {
			viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
		} else if (viewMode === 'months') {
			viewDate = new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1);
		} else if (viewMode === 'years') {
			viewDate = new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1);
		}
	}

	function selectDate(dateStr: string) {
		if (isDateDisabled(dateStr)) return;
		value = dateStr;
		isOpen = false;
		onchange?.(dateStr);
	}

	function selectMonth(mIndex: number) {
		viewDate = new Date(viewDate.getFullYear(), mIndex, 1);
		viewMode = 'days';
	}

	function selectYear(yNum: number) {
		viewDate = new Date(yNum, viewDate.getMonth(), 1);
		viewMode = 'months';
	}

	function handleClear(e?: MouseEvent) {
		e?.stopPropagation();
		value = '';
		isOpen = false;
		onchange?.('');
	}

	function handleToday() {
		if (isDateDisabled(todayStr)) return;
		value = todayStr;
		isOpen = false;
		onchange?.(todayStr);
	}

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const isInsideTrigger = triggerEl && triggerEl.contains(target);
		const isInsidePopover = popoverEl && popoverEl.contains(target);
		if (!isInsideTrigger && !isInsidePopover) {
			isOpen = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeyDown} />

<div class="form-control {className}" id="{dateId}-container">
	{#if label}
		<label for={dateId} class="form-label">
			{label}
			{#if required}
				<span class="required-star" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<!-- Hidden input for standard form submission -->
	<input type="hidden" {name} {value} {required} />

	<!-- Trigger Button Input -->
	<div
		bind:this={triggerEl}
		class="input-container"
		class:has-error={!!error}
		class:is-disabled={disabled}
		class:is-active={isOpen}
		role="button"
		tabindex={disabled ? -1 : 0}
		onclick={toggleOpen}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggleOpen();
			}
		}}
		aria-haspopup="dialog"
		aria-expanded={isOpen}
		aria-label={label || 'Pilih tanggal'}
	>
		<div class="date-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
				<line x1="16" y1="2" x2="16" y2="6"></line>
				<line x1="8" y1="2" x2="8" y2="6"></line>
				<line x1="3" y1="10" x2="21" y2="10"></line>
			</svg>
		</div>

		<span class="date-display-text" class:is-placeholder={!value}>
			{displayValue || placeholder}
		</span>

		<div class="trigger-actions">
			{#if value && showClear && !disabled}
				<button
					type="button"
					class="clear-btn"
					onclick={handleClear}
					title="Hapus tanggal"
					aria-label="Hapus tanggal"
				>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			{/if}

			<span class="chevron-indicator" class:is-expanded={isOpen} aria-hidden="true">
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			</span>
		</div>
	</div>

	<!-- Custom Popover Calendar Dropdown (Teleported to document.body with fixed positioning) -->
	{#if isOpen}
		<div
			use:portal
			bind:this={popoverEl}
			class="calendar-popover"
			style="top: {popoverTop}px; left: {popoverLeft}px;"
			role="dialog"
			aria-modal="true"
			aria-label="Kalender"
		>
			<!-- Header: Navigasi Bulan & Tahun -->
			<div class="calendar-header">
				<button
					type="button"
					class="nav-btn"
					onclick={handlePrev}
					title="Sebelumnya"
					aria-label="Sebelumnya"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>

				<div class="view-switch-btns">
					{#if viewMode === 'days'}
						<button
							type="button"
							class="view-switch-btn"
							onclick={() => (viewMode = 'months')}
						>
							<span>{monthNames[viewDate.getMonth()]}</span>
							<span class="year-accent">{viewDate.getFullYear()}</span>
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</button>
					{:else if viewMode === 'months'}
						<button
							type="button"
							class="view-switch-btn"
							onclick={() => (viewMode = 'years')}
						>
							<span>{viewDate.getFullYear()}</span>
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</button>
					{:else}
						<span class="view-range-label">
							{yearRangeStart} - {yearRangeStart + 11}
						</span>
					{/if}
				</div>

				<button
					type="button"
					class="nav-btn"
					onclick={handleNext}
					title="Berikutnya"
					aria-label="Berikutnya"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			</div>

			<!-- Tampilan 1: Grid Hari (Days Matrix) -->
			{#if viewMode === 'days'}
				<div class="weekdays-grid">
					{#each dayNames as day}
						<span class="weekday-cell">{day}</span>
					{/each}
				</div>

				<div class="days-grid">
					{#each calendarDays as d}
						<button
							type="button"
							class="day-cell"
							class:is-current-month={d.isCurrentMonth}
							class:is-other-month={!d.isCurrentMonth}
							class:is-today={d.isToday}
							class:is-selected={d.isSelected}
							class:is-disabled={d.isDisabled}
							disabled={d.isDisabled}
							onclick={() => selectDate(d.dateStr)}
						>
							{d.dayNum}
						</button>
					{/each}
				</div>

			<!-- Tampilan 2: Grid Bulan (Months Selector) -->
			{:else if viewMode === 'months'}
				<div class="months-grid">
					{#each shortMonthNames as mName, mIdx}
						<button
							type="button"
							class="month-cell"
							class:is-selected={viewDate.getMonth() === mIdx}
							onclick={() => selectMonth(mIdx)}
						>
							{mName}
						</button>
					{/each}
				</div>

			<!-- Tampilan 3: Grid Tahun (Years Selector) -->
			{:else if viewMode === 'years'}
				<div class="years-grid">
					{#each calendarYears as yNum}
						<button
							type="button"
							class="year-cell"
							class:is-selected={viewDate.getFullYear() === yNum}
							onclick={() => selectYear(yNum)}
						>
							{yNum}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Footer: Hapus & Hari Ini -->
			<div class="calendar-footer">
				<button
					type="button"
					class="footer-btn text-muted hover-text-main"
					onclick={handleClear}
					disabled={!value}
				>
					Hapus
				</button>

				<button
					type="button"
					class="footer-btn text-primary font-bold"
					onclick={handleToday}
				>
					Hari Ini
				</button>
			</div>
		</div>
	{/if}

	{#if error}
		<p class="form-feedback error" role="alert">{error}</p>
	{:else if helperText}
		<p class="form-feedback helper">{helperText}</p>
	{/if}
</div>

<style>
	.form-control {
		display: flex;
		flex-direction: column;
		gap: 5px;
		width: 100%;
		position: relative;
		box-sizing: border-box;
	}

	.form-label {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-muted, #94a3b8);
		display: flex;
		align-items: center;
		gap: 3px;
		letter-spacing: 0.015em;
		user-select: none;
	}

	.required-star {
		color: var(--pill-danger-text, #ef4444);
		font-size: 11px;
		font-weight: 500;
	}

	.input-container {
		display: flex;
		align-items: center;
		background: var(--bg-input);
		border: 1px solid var(--border-input, rgba(255, 255, 255, 0.12));
		border-radius: var(--radius-md, 8px);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		min-height: 42px;
		padding: 0 14px;
		cursor: pointer;
		user-select: none;
		box-sizing: border-box;
		gap: 10px;
	}

	.input-container:hover:not(.is-disabled) {
		border-color: var(--border-input-hover, rgba(255, 255, 255, 0.22));
	}

	.input-container:focus,
	.input-container.is-active {
		border-color: var(--brand-primary);
		box-shadow: 0 0 0 3px var(--brand-primary-dim, rgba(16, 185, 129, 0.12));
		outline: none;
	}

	.input-container.has-error {
		border-color: var(--pill-danger-text, #ef4444);
		background-color: var(--pill-danger-bg);
	}

	.input-container.is-disabled {
		background-color: var(--bg-panel-sub);
		opacity: 0.65;
		cursor: not-allowed;
	}

	.date-icon {
		color: var(--text-muted);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.date-display-text {
		flex: 1;
		font-size: 13.5px;
		color: var(--text-main);
		font-family: var(--font-body);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.date-display-text.is-placeholder {
		color: var(--text-subtle);
		font-weight: 400;
	}

	.trigger-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: none;
		background: var(--bg-panel-hover);
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.clear-btn:hover {
		background: var(--pill-danger-bg);
		color: var(--pill-danger-text);
	}

	.chevron-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: transform 0.2s ease;
	}

	.chevron-indicator.is-expanded {
		transform: rotate(180deg);
		color: var(--brand-primary);
	}

	/* -------------------------------------------------------------------------
	   Custom Popover Calendar (Portal Body & Fixed Floating Positioning)
	   ------------------------------------------------------------------------- */
	.calendar-popover {
		position: fixed;
		z-index: 99999;
		width: 310px;
		background: var(--bg-panel);
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-xl, 12px);
		box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		animation: scaleUp 0.15s ease-out;
		box-sizing: border-box;
	}

	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--border-subtle);
		background: var(--bg-panel-sub);
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-btn:hover {
		background: var(--bg-panel-hover);
		color: var(--text-main);
		border-color: var(--border-panel);
	}

	.view-switch-btns {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.view-switch-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid transparent;
		padding: 4px 10px;
		border-radius: var(--radius-md, 8px);
		font-size: 13.5px;
		font-weight: 700;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.view-switch-btn:hover {
		background: var(--bg-panel-sub);
		border-color: var(--border-panel);
	}

	.year-accent {
		color: var(--brand-primary);
	}

	.view-range-label {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--text-main);
	}

	.weekdays-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 3px;
		text-align: center;
	}

	.weekday-cell {
		font-size: 11px;
		font-weight: 700;
		color: var(--text-subtle);
		padding: 4px 0;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.day-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 34px;
		border-radius: var(--radius-md, 8px);
		border: 1px solid transparent;
		background: transparent;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s ease;
		outline: none;
		padding: 0;
	}

	.day-cell.is-other-month {
		color: var(--text-subtle);
		opacity: 0.45;
	}

	.day-cell:hover:not(.is-disabled):not(.is-selected) {
		background: var(--bg-panel-hover);
		color: var(--text-main);
		border-color: var(--border-subtle);
	}

	.day-cell.is-today:not(.is-selected) {
		border-color: var(--brand-primary);
		color: var(--brand-primary);
		font-weight: 700;
	}

	.day-cell.is-selected {
		background: var(--brand-primary) !important;
		color: #ffffff !important;
		font-weight: 700;
		box-shadow: 0 2px 8px var(--brand-primary-glow, rgba(16, 185, 129, 0.25));
	}

	.day-cell.is-disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	/* Months & Years Selector Grids */
	.months-grid,
	.years-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		padding: 6px 0;
	}

	.month-cell,
	.year-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 42px;
		border-radius: var(--radius-md, 8px);
		border: 1px solid var(--border-subtle);
		background: var(--bg-panel-sub);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.month-cell:hover,
	.year-cell:hover {
		background: var(--bg-panel-hover);
		border-color: var(--border-panel);
	}

	.month-cell.is-selected,
	.year-cell.is-selected {
		background: var(--brand-primary);
		color: #ffffff;
		border-color: var(--brand-primary);
		box-shadow: 0 2px 8px var(--brand-primary-glow);
	}

	/* Footer Bar */
	.calendar-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 10px;
		border-top: 1px solid var(--border-subtle);
	}

	.footer-btn {
		background: transparent;
		border: none;
		font-size: 12px;
		padding: 4px 8px;
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.footer-btn.text-muted {
		color: var(--text-muted);
	}

	.footer-btn.text-muted:hover:not(:disabled) {
		color: var(--text-main);
		background: var(--bg-panel-hover);
	}

	.footer-btn.text-primary {
		color: var(--brand-primary);
		font-weight: 700;
	}

	.footer-btn.text-primary:hover {
		background: var(--pill-success-bg, rgba(16, 185, 129, 0.12));
	}

	.footer-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.form-feedback {
		font-size: 11.5px;
		line-height: 1.3;
		margin: 0;
	}

	.form-feedback.error {
		color: var(--pill-danger-text, #ef4444);
		font-weight: 500;
	}

	.form-feedback.helper {
		color: var(--text-muted);
	}
</style>
