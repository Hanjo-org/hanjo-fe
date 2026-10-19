/**
 * Daftar Akun Demo Resmi Hanjo ERP
 * Referensi: MILESTONE.md §7, T-00.8
 *
 * 5 akun demo untuk pengujian 4 peran dan pembatasan cakupan outlet.
 */

import type { User } from '../api/contract/types.js';

export const DEMO_USERS: Record<string, User> = {
	'usr-rina': {
		id: 'usr-rina',
		name: 'Rina Kartika',
		email: 'rina.owner@hanjo.coffee',
		role: 'owner',
		avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-jkt-01', 'out-bdg-01', 'out-sub-01'],
		created_at: '2026-01-01T00:00:00Z'
	},
	'usr-dimas': {
		id: 'usr-dimas',
		name: 'Dimas Wicaksono',
		email: 'dimas.admin@hanjo.coffee',
		role: 'hq_admin',
		avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-jkt-01', 'out-bdg-01', 'out-sub-01'],
		created_at: '2026-01-01T00:00:00Z'
	},
	'usr-maya': {
		id: 'usr-maya',
		name: 'Maya Anggraini',
		email: 'maya.finance@hanjo.coffee',
		role: 'finance',
		avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-jkt-01', 'out-bdg-01', 'out-sub-01'],
		created_at: '2026-01-01T00:00:00Z'
	},
	'usr-budi': {
		id: 'usr-budi',
		name: 'Budi Santoso',
		email: 'budi.sm@hanjo.coffee',
		role: 'store_manager',
		avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-jkt-01'], // Terkunci di Outlet Senopati (Outlet A)
		created_at: '2026-01-01T00:00:00Z'
	},
	'usr-sari': {
		id: 'usr-sari',
		name: 'Sari Dewi',
		email: 'sari.sm@hanjo.coffee',
		role: 'store_manager',
		avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-bdg-01', 'out-sub-01'], // Outlet Dago & Outlet Gubeng (Outlet B & C)
		created_at: '2026-01-01T00:00:00Z'
	},
	'usr-fajar': {
		id: 'usr-fajar',
		name: 'Fajar Ramadhan',
		email: 'fajar.kasir@hanjo.coffee',
		role: 'cashier',
		avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80',
		outlet_ids: ['out-jkt-01'], // Outlet Senopati
		created_at: '2026-01-01T00:00:00Z'
	}
};

export const DEMO_USER_LIST: User[] = Object.values(DEMO_USERS);
