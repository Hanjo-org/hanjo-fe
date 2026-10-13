export type ThemeMode = 'dark' | 'light';

class ThemeState {
	current = $state<ThemeMode>('dark');

	init() {
		if (typeof window !== 'undefined') {
			const saved = (localStorage.getItem('hanjo_theme') as ThemeMode) || 'dark';
			this.current = saved;
			document.documentElement.setAttribute('data-theme', saved);
		}
	}

	set(theme: ThemeMode) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			localStorage.setItem('hanjo_theme', theme);
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}
}

export const themeStore = new ThemeState();
