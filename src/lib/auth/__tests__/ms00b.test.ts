/**
 * Suite Pengujian Sub-Fase MS-00B: Auth, RBAC, Scope Outlet & Feature Flag
 * Referensi: AC-00.3, AC-00.4, T-00.8, T-00.9
 */

import { apiClient } from '../../api/client.js';
import { Endpoints } from '../../api/contract/endpoints.js';
import { can } from '../can.js';
import { isInScope, assertInScope } from '../scope.js';
import {
	validateFlagDependencies,
	getDefaultFeatureFlags,
	isFeatureEnabled
} from '../../config/feature_flags.js';
import { DEMO_USERS } from '../../api/drivers/mock/handlers/auth.js';

async function runTests() {
	console.log('🧪 Memulai pengujian MS-00B: Identity, Auth, RBAC & Feature Flag...\n');
	let passed = 0;
	let failed = 0;

	function assert(condition: boolean, msg: string) {
		if (condition) {
			console.log(`  ✅ PASS: ${msg}`);
			passed++;
		} else {
			console.error(`  ❌ FAIL: ${msg}`);
			failed++;
		}
	}

	// -------------------------------------------------------------------------
	// 1. Uji GET /api/v1/me
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Endpoint GET /api/v1/me');
	const meRes = await apiClient.get<any>(Endpoints.AUTH.ME);
	assert(meRes.user.id === 'usr-rina', 'User default adalah Rina (Owner)');
	assert(meRes.user.role === 'owner', 'Role user default adalah owner');
	assert(typeof meRes.feature_flags === 'object', 'Memuat daftar feature flags');

	// -------------------------------------------------------------------------
	// 2. Uji Dev Switch Role (5 Akun Demo)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Pengalih Peran Demo (Switch Role)');
	const switchAdmin = await apiClient.post<any>(Endpoints.AUTH.DEV_SWITCH_ROLE, { role: 'hq_admin' });
	assert(switchAdmin.user.role === 'hq_admin' && switchAdmin.user.name === 'Dimas Wicaksono', 'Berhasil beralih ke Dimas (HQ Admin)');

	const switchFinance = await apiClient.post<any>(Endpoints.AUTH.DEV_SWITCH_ROLE, { role: 'finance' });
	assert(switchFinance.user.role === 'finance' && switchFinance.user.name === 'Maya Anggraini', 'Berhasil beralih ke Maya (Finance)');

	const switchBudi = await apiClient.post<any>(Endpoints.AUTH.DEV_SWITCH_ROLE, { userId: 'usr-budi' });
	assert(switchBudi.user.role === 'store_manager' && switchBudi.user.name === 'Budi Santoso', 'Berhasil beralih ke Budi (SM Outlet A)');

	const switchSari = await apiClient.post<any>(Endpoints.AUTH.DEV_SWITCH_ROLE, { userId: 'usr-sari' });
	assert(switchSari.user.role === 'store_manager' && switchSari.user.outlet_ids?.length === 2, 'Berhasil beralih ke Sari (SM Outlet B & C)');

	// -------------------------------------------------------------------------
	// 3. Uji Otorisasi RBAC can() untuk 4 Peran (AC-00.3)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Otorisasi can() 4 Peran');
	const rina = DEMO_USERS['usr-rina'];
	const dimas = DEMO_USERS['usr-dimas'];
	const maya = DEMO_USERS['usr-maya'];
	const budi = DEMO_USERS['usr-budi'];

	// Owner
	assert(can(rina, 'dashboard:view:gross_profit'), 'Owner boleh melihat laba kotor');
	assert(can(rina, 'procurement:approve_external_po'), 'Owner boleh menyetujui PO belanja luar');
	assert(can(rina, 'finance:reopen_period'), 'Owner boleh membuka kembali periode tertutup');

	// HQ Admin
	assert(can(dimas, 'catalog:manage_recipes'), 'Admin boleh mengelola resep');
	assert(can(dimas, 'catalog:approve_proposal'), 'Admin boleh menyetujui usulan menu');
	assert(!can(dimas, 'dashboard:view:gross_profit'), 'Admin TIDAK boleh melihat laba kotor');
	assert(!can(dimas, 'finance:close_period'), 'Admin TIDAK boleh menutup periode fiskal');
	assert(!can(dimas, 'procurement:approve_external_po'), 'Admin TIDAK boleh menyetujui belanja luar');

	// Finance
	assert(can(maya, 'procurement:verify_invoice'), 'Finance boleh verifikasi nota');
	assert(can(maya, 'payables:pay'), 'Finance boleh mengeksekusi pembayaran hutang');
	assert(can(maya, 'finance:close_period'), 'Finance boleh menutup periode fiskal');
	assert(can(maya, 'dashboard:view:gross_profit'), 'Finance boleh melihat laba kotor');
	assert(!can(maya, 'catalog:manage_recipes'), 'Finance TIDAK boleh mengedit resep');

	// Store Manager
	assert(can(budi, 'procurement:create_po'), 'SM boleh membuat PO');
	assert(can(budi, 'petty_cash:spend'), 'SM boleh mengeluarkan kas kecil');
	assert(can(budi, 'catalog:propose_menu'), 'SM boleh mengajukan usulan menu');
	assert(can(budi, 'eod:close'), 'SM boleh menutup hari operasional (EOD)');
	assert(!can(budi, 'dashboard:view:gross_profit'), 'SM TIDAK boleh melihat laba kotor');
	assert(!can(budi, 'costs:read_hq'), 'SM TIDAK boleh melihat biaya pusat');
	assert(!can(budi, 'finance:close_period'), 'SM TIDAK boleh menutup periode fiskal');

	// -------------------------------------------------------------------------
	// 4. Uji Scope Outlet (Invarian Monorepo §2.4)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Scope Akses Outlet');
	assert(isInScope(budi, 'out-jkt-01'), 'Budi berada dalam scope Outlet Senopati (A)');
	assert(!isInScope(budi, 'out-bdg-01'), 'Budi DILARANG mengakses Outlet Dago (B)');
	assert(!isInScope(budi, '*'), 'Budi DILARANG memilih "Semua Outlet"');

	const sari = DEMO_USERS['usr-sari'];
	assert(isInScope(sari, 'out-bdg-01') && isInScope(sari, 'out-sub-01'), 'Sari berhak mengakses Outlet B & C');
	assert(!isInScope(sari, 'out-jkt-01'), 'Sari DILARANG mengakses Outlet A');

	assert(isInScope(rina, 'out-jkt-01') && isInScope(rina, '*'), 'Owner berhak mengakses semua outlet individual dan konsolidasi');

	let thrown404 = false;
	try {
		assertInScope(budi, 'out-bdg-01');
	} catch (err: any) {
		if (err.status === 404 || err.code === 'not_found') {
			thrown404 = true;
		}
	}
	assert(thrown404, 'Mencoba mengakses outlet luar melempar galat 404 not_found');

	// -------------------------------------------------------------------------
	// 5. Uji Step-Up Authentication
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Step-Up Authentication');
	const stepUpSuccess = await apiClient.post<any>(Endpoints.AUTH.STEP_UP, { password: '123456' });
	assert(!!stepUpSuccess.step_up_token, 'Step-Up berhasil dengan password demo 123456');

	let stepUpFailed = false;
	try {
		await apiClient.post<any>(Endpoints.AUTH.STEP_UP, { password: 'wrong' });
	} catch (err: any) {
		stepUpFailed = true;
	}
	assert(stepUpFailed, 'Step-Up gagal dengan password salah');

	// -------------------------------------------------------------------------
	// 6. Uji Feature Flag Dependency Graph (T-00.9)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 6: Evaluasi Dependensi Feature Flags');
	const allFlags = getDefaultFeatureFlags();
	const validCheck = validateFlagDependencies(allFlags);
	assert(validCheck.valid, 'Seluruh flag bawaan memiliki dependensi valid');

	// Simulasi: recipes aktif tapi inventory mati
	const invalidFlags = { ...allFlags, inventory: false, recipes: true };
	const invalidCheck = validateFlagDependencies(invalidFlags);
	assert(!invalidCheck.valid, 'Terdeteksi dependensi tidak valid saat inventory mati tapi recipes aktif');
	assert(invalidCheck.errors.length > 0, 'Menghasilkan pesan galat dependensi informatif');

	// -------------------------------------------------------------------------
	// 7. Uji Logout & Sesi Kosong (AC-00.4)
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 7: Logout & Penanganan Sesi Kosong (AC-00.4)');
	await apiClient.post(Endpoints.AUTH.LOGOUT);

	let unauthCaught = false;
	try {
		await apiClient.get(Endpoints.AUTH.ME);
	} catch (err: any) {
		if (err.status === 401 || err.code === 'unauthenticated') {
			unauthCaught = true;
		}
	}
	assert(unauthCaught, 'Request GET /me setelah logout mengembalikan 401 unauthenticated');

	// Kembalikan sesi demo ke Rina
	await apiClient.post(Endpoints.AUTH.LOGIN, { role: 'owner' });

	console.log(`\n========================================`);
	console.log(`Hasil Pengujian: ${passed} Lulus, ${failed} Gagal`);
	console.log(`========================================\n`);

	if (failed > 0) {
		throw new Error(`${failed} pengujian gagal`);
	}
}

runTests().catch((err) => {
	console.error('Fatal test error:', err);
	throw err;
});

