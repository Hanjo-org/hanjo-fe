/**
 * Suite Pengujian Milestone MS-02: Master Organisasi, Multi-Outlet & Mitra
 * Referensi: PRD 8.1, MILESTONE.md §MS-02, MS-02.md
 * Kriteria Penerimaan: AC-02.0 s/d AC-02.7
 */

import {
	validateOrgCode,
	validateOutletCode,
	evaluateOutletDeactivation,
	evaluateOrgDeactivation,
	validateOwnershipRules
} from '../../domain/organization.js';
import { organizationService } from '../../services/organization.service.js';
import {
	setCurrentMockUser,
	setMockFeatureFlag,
	DEMO_USERS
} from '../../api/drivers/mock/handlers/auth.js';
import type { OutletOwnership, BlockingDocument, Outlet } from '../../api/contract/types.js';

async function runTests() {
	console.log('🧪 Memulai pengujian MS-02: Master Organisasi, Multi-Outlet & Mitra...\n');
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

	// Pastikan sesi awal login sebagai Owner (Rina)
	setCurrentMockUser(DEMO_USERS['usr-rina']);
	setMockFeatureFlag('partner_ownership', true);

	// -------------------------------------------------------------------------
	// 1. Uji Logika Domain Murni (Golden Rule 2)
	// -------------------------------------------------------------------------
	console.log('▶ Uji 1: Logika Domain Murni Validasi Kode & Evaluasi Deaktivasi');
	const orgCodeValid = validateOrgCode('SKJ');
	assert(orgCodeValid.valid, 'Kode organisasi "SKJ" valid');

	const orgCodeInvalid = validateOrgCode('skj_123*');
	assert(!orgCodeInvalid.valid, 'Kode organisasi "skj_123*" tidak valid');

	const outletCodeValid = validateOutletCode('SKJ-SEN');
	assert(outletCodeValid.valid, 'Kode outlet "SKJ-SEN" valid');

	const outletCodeInvalid = validateOutletCode('x');
	assert(!outletCodeInvalid.valid, 'Kode outlet "x" terlalu pendek (< 2 karakter)');

	// Evaluasi deaktivasi outlet
	const testBlockingDocs: BlockingDocument[] = [
		{ id: '1', doc_type: 'purchase_order', ref_number: 'PO-001', title: 'PO Kopi', reason: 'Status open' }
	];
	const deactBlocked = evaluateOutletDeactivation('out-1', testBlockingDocs);
	assert(!deactBlocked.canDeactivate, 'Deaktivasi outlet dicegah saat ada blocking documents');
	assert(deactBlocked.blockingDocuments.length === 1, 'Daftar dokumen penghalang disertakan');

	const deactAllowed = evaluateOutletDeactivation('out-1', []);
	assert(deactAllowed.canDeactivate, 'Deaktivasi outlet diizinkan saat dokumen penghalang kosong');

	// Evaluasi deaktivasi organisasi
	const mockOutletsList: Outlet[] = [
		{
			id: 'o-1',
			organization_id: 'org-test',
			code: 'T-1',
			name: 'Test 1',
			city: 'Jakarta',
			address: '',
			phone: '',
			tax_rate: 0.1,
			service_charge: 0.05,
			petty_cash_limit: '100000',
			owner_type: 'own_company',
			status: 'active',
			active: true,
			created_at: '2026-10-13T00:00:00.000Z'
		}
	];
	const orgDeactBlocked = evaluateOrgDeactivation('org-test', mockOutletsList);
	assert(!orgDeactBlocked.canDeactivate, 'Deaktivasi organisasi dicegah saat masih memiliki outlet aktif');

	const orgDeactAllowed = evaluateOrgDeactivation('org-empty', mockOutletsList);
	assert(orgDeactAllowed.canDeactivate, 'Deaktivasi organisasi diizinkan saat tidak ada outlet aktif di bawahnya');

	// -------------------------------------------------------------------------
	// 2. AC-02.3 & AC-02.4: Logika Kepemilikan & Persentase Saham
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 2: Aturan Kepemilikan Mitra (AC-02.3, AC-02.4)');
	// Persentase kosong diizinkan (AC-02.3)
	const emptyShares: OutletOwnership[] = [
		{ id: '1', outlet_id: 'out-1', owner_name: 'Mitra A', effective_from: '2026-01-01' },
		{ id: '2', outlet_id: 'out-1', owner_name: 'Mitra B', effective_from: '2026-01-01' }
	];
	const evalEmpty = validateOwnershipRules(emptyShares);
	assert(evalEmpty.valid && evalEmpty.hasEmptyShares, 'Dua investor dengan persentase kosong valid (AC-02.3)');

	// Persentase tidak genap 100% (60% + 30% = 90%)
	const invalidShares: OutletOwnership[] = [
		{ id: '1', outlet_id: 'out-1', owner_name: 'Mitra A', share_pct: '60.00', effective_from: '2026-01-01' },
		{ id: '2', outlet_id: 'out-1', owner_name: 'Mitra B', share_pct: '30.00', effective_from: '2026-01-01' }
	];
	const evalInvalidShares = validateOwnershipRules(invalidShares);
	assert(!evalInvalidShares.valid, 'Total persentase 90% (≠ 100%) ditolak (AC-02.3)');

	// Persentase genap 100% (60% + 40%)
	const validShares: OutletOwnership[] = [
		{ id: '1', outlet_id: 'out-1', owner_name: 'Mitra A', share_pct: '60.00', effective_from: '2026-01-01' },
		{ id: '2', outlet_id: 'out-1', owner_name: 'Mitra B', share_pct: '40.00', effective_from: '2026-01-01' }
	];
	const evalValidShares = validateOwnershipRules(validShares);
	assert(evalValidShares.valid && !evalValidShares.hasEmptyShares, 'Total persentase genap 100% valid (AC-02.3)');

	// Tanggal tumpang tindih untuk pemilik sama (AC-02.4)
	const overlappingDates: OutletOwnership[] = [
		{ id: '1', outlet_id: 'out-1', owner_name: 'Mitra A', effective_from: '2026-01-01', effective_to: '2026-06-30' },
		{ id: '2', outlet_id: 'out-1', owner_name: 'Mitra A', effective_from: '2026-05-01', effective_to: '2026-12-31' }
	];
	const evalOverlap = validateOwnershipRules(overlappingDates);
	assert(!evalOverlap.valid, 'Periode tanggal tumpang tindih untuk pemilik sama ditolak (AC-02.4)');

	// -------------------------------------------------------------------------
	// 3. AC-02.0: Organisasi & Relasi Outlet Wajib
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 3: Pembuatan Organisasi & Validasi Relasi Outlet Induk (AC-02.0)');
	const orgs = await organizationService.getOrganizations();
	assert(orgs.length >= 3, `Daftar organisasi memuat ${orgs.length} entitas (Seduhan Kopi Jodi, Kaveloka, Plaga)`);

	// Buat organisasi baru
	const newOrg = await organizationService.createOrganization({
		code: 'TEST-ORG',
		name: 'PT Sinergi Kopi Nusantara',
		address: 'Jl. Merdeka No. 10, Jakarta'
	});
	assert(newOrg.id.startsWith('org-'), 'Organisasi baru berhasil dibuat dengan ID prefix org-');

	// Coba buat outlet baru tanpa organization_id
	let outletWithoutOrgFailed = false;
	try {
		await organizationService.createOutlet({
			code: 'TST-NO-ORG',
			name: 'Gerai Tanpa Induk',
			organization_id: ''
		});
	} catch (e: any) {
		outletWithoutOrgFailed = true;
	}
	assert(outletWithoutOrgFailed, 'Outlet baru tanpa organization_id wajib ditolak (AC-02.0)');

	// Buat outlet baru dengan organization_id sah
	const newOutlet = await organizationService.createOutlet({
		code: 'TST-OUT-01',
		name: 'Gerai Tes Valid',
		organization_id: newOrg.id,
		city: 'Jakarta'
	});
	assert(newOutlet.id.startsWith('out-') && newOutlet.organization_id === newOrg.id, 'Outlet dengan organisasi induk sah berhasil dibuat (AC-02.0)');

	// -------------------------------------------------------------------------
	// 4. AC-02.1: Kode Outlet Duplikat Ditolak
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 4: Keunikan Kode Outlet (AC-02.1)');
	let duplicateFailed = false;
	try {
		await organizationService.createOutlet({
			code: 'TST-OUT-01', // Kode sama
			name: 'Gerai Duplikat',
			organization_id: newOrg.id
		});
	} catch (e: any) {
		duplicateFailed = true;
	}
	assert(duplicateFailed, 'Pembuatan outlet dengan kode duplikat "TST-OUT-01" ditolak 409 conflict (AC-02.1)');

	// -------------------------------------------------------------------------
	// 5. AC-02.2: Pencegahan Deaktivasi Saat Ada Dokumen Terbuka
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 5: Pencegahan Deaktivasi Operasional (AC-02.2)');
	let outletDeactConflict = false;
	let blockingCount = 0;
	try {
		// out-jkt-01 memiliki PO terbuka dan invoice unverified
		await organizationService.deactivateOutlet('out-jkt-01');
	} catch (e: any) {
		outletDeactConflict = true;
		blockingCount = e.envelope?.error?.blocking_documents?.length || e.blocking_documents?.length || 0;
	}
	assert(outletDeactConflict, 'Deaktivasi outlet dengan dokumen operasional terbuka ditolak (AC-02.2)');
	assert(blockingCount >= 2, `Menerima daftar ${blockingCount} dokumen penghalang (PO terbuka & nota unverified)`);

	// Deaktivasi organisasi dengan outlet aktif
	let orgDeactConflict = false;
	try {
		// org-jodi memiliki outlet aktif (Senopati, Dago, Gubeng)
		await organizationService.deactivateOrganization('org-jodi');
	} catch (e: any) {
		orgDeactConflict = true;
	}
	assert(orgDeactConflict, 'Deaktivasi organisasi yang masih memiliki outlet aktif ditolak 409 conflict (AC-02.2)');

	// -------------------------------------------------------------------------
	// 6. AC-02.5 & AC-02.6: Penugasan Store Manager Multi-Outlet & Scope Locking
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 6: Store Manager Multi-Outlet & Scope Locking (AC-02.5, AC-02.6)');
	// Set sesi sebagai Store Manager Budi (ditugaskan hanya ke out-jkt-01)
	setCurrentMockUser(DEMO_USERS['usr-budi']);

	// Budi membaca outlet tugasnya: berhasil
	const budiOutlet = await organizationService.getOutletById('out-jkt-01');
	assert(budiOutlet.id === 'out-jkt-01', 'Store Manager Budi dapat mengakses outlet tugasnya out-jkt-01');

	// Budi membaca outlet di luar tugasnya: 404 not_found (AC-02.6)
	let budiAccessBlocked = false;
	try {
		await organizationService.getOutletById('out-bdg-01');
	} catch (e: any) {
		budiAccessBlocked = true;
	}
	assert(budiAccessBlocked, 'Store Manager Budi mengakses outlet di luar scope ditolak 404 not_found (AC-02.6)');

	// Set sesi sebagai Store Manager Sari (ditugaskan ke Jodi Dago out-bdg-01 & Jodi Gubeng out-sub-01)
	const smSariUser = {
		...DEMO_USERS['usr-sari'],
		role: 'store_manager' as const,
		outlet_ids: ['out-bdg-01', 'out-sub-01']
	};
	setCurrentMockUser(smSariUser);
	const sariOutlets = await organizationService.getOutlets({ role: 'store_manager' });
	const sariIds = sariOutlets.map((o) => o.id);
	assert(
		sariIds.includes('out-bdg-01') && sariIds.includes('out-sub-01') && !sariIds.includes('out-jkt-01'),
		'Store Manager Sari memiliki akses multi-outlet ke Dago & Gubeng sesuai penugasan (AC-02.5)'
	);

	// Hak baca Finance (AC-02.6): Finance hanya read-only
	setCurrentMockUser(DEMO_USERS['usr-maya']); // Maya = finance
	let financeEditBlocked = false;
	try {
		await organizationService.updateOutlet('out-jkt-01', { name: 'Nama Baru Oleh Finance' });
	} catch (e: any) {
		financeEditBlocked = true;
	}
	assert(financeEditBlocked, 'Peran Finance ditolak 403 forbidden saat mencoba mengubah data master outlet (AC-02.6)');

	// -------------------------------------------------------------------------
	// 7. AC-02.7: Feature Flag partner_ownership Gating
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 7: Feature Flag partner_ownership Gating (AC-02.7)');
	setCurrentMockUser(DEMO_USERS['usr-rina']); // Kembali ke Owner

	// Matikan feature flag
	setMockFeatureFlag('partner_ownership', false);

	let flagBlockOwners = false;
	try {
		await organizationService.getOutletOwners();
	} catch (e: any) {
		flagBlockOwners = true;
	}
	assert(flagBlockOwners, 'Endpoint /outlet-owners mengembalikan 403 saat flag partner_ownership dinonaktifkan (AC-02.7)');

	let flagBlockOwnerships = false;
	try {
		await organizationService.getOutletOwnerships('out-jkt-01');
	} catch (e: any) {
		flagBlockOwnerships = true;
	}
	assert(flagBlockOwnerships, 'Endpoint /outlets/:id/ownerships mengembalikan 403 saat flag partner_ownership dinonaktifkan (AC-02.7)');

	// Nyalakan kembali feature flag
	setMockFeatureFlag('partner_ownership', true);
	const restoredOwners = await organizationService.getOutletOwners();
	assert(Array.isArray(restoredOwners), 'Endpoint /outlet-owners kembali aktif setelah flag dinyalakan (AC-02.7)');

	// -------------------------------------------------------------------------
	// 8. T-02.8: Grup Outlet
	// -------------------------------------------------------------------------
	console.log('\n▶ Uji 8: Endpoint & Layanan Grup Outlet (T-02.8)');
	const groups = await organizationService.getOutletGroups();
	assert(groups.length >= 2, `Daftar grup outlet memuat ${groups.length} grup`);

	const newGroup = await organizationService.createOutletGroup({
		name: 'Region Bali & Nusa Tenggara',
		code: 'GRP-BALI',
		description: 'Grup gerai wilayah Bali dan sekitarnya'
	});
	assert(newGroup.id.startsWith('grp-') && newGroup.code === 'GRP-BALI', 'Grup outlet baru berhasil dibuat (T-02.8)');

	// -------------------------------------------------------------------------
	// Ringkasan Pengujian
	// -------------------------------------------------------------------------
	console.log(`\n========================================`);
	console.log(`  HASIL PENGUJIAN MS-02: ${passed} LULUS, ${failed} GAGAL`);
	console.log(`========================================\n`);

	if (failed > 0) {
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error('Terjadi kesalahan fatal selama pengujian:', err);
	process.exit(1);
});
