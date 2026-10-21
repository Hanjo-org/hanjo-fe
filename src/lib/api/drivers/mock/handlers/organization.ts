/**
 * Mock Handler: Master Organisasi, Outlet, Grup & Mitra (MS-02)
 * Referensi: PRD 8.1, MILESTONE.md §MS-02, AC-02.0 s/d AC-02.7
 */

import { router } from '../engine/router.js';
import { clock } from '../engine/clock.js';
import { ApiErrors, AppError } from '../../../contract/errors.js';
import {
	validateOrgCode,
	validateOutletCode,
	validateOwnershipRules,
	evaluateOrgDeactivation,
	evaluateOutletDeactivation
} from '../../../../domain/organization.js';
import { getCurrentMockUser, getCurrentFeatureFlags } from './auth.js';
import type {
	Organization,
	Outlet,
	OutletGroup,
	OutletOwnership,
	BlockingDocument,
	DeactivationConflictData
} from '../../../contract/types.js';

// In-Memory State untuk Organisasi Induk
export let mockOrganizations: Organization[] = [
	{
		id: 'org-jodi',
		code: 'SKJ',
		name: 'Seduhan Kopi Jodi',
		description: 'Jaringan gerai kopi artisanal multi-outlet (Jakarta, Bandung, Surabaya)',
		tax_id: '01.234.567.8-012.000',
		address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
		status: 'active',
		active: true,
		created_at: '2026-01-10T08:00:00.000Z'
	},
	{
		id: 'org-kaveloka',
		code: 'KVL',
		name: 'Kaveloka',
		description: 'Specialty roastery & coffee bar (Ubud, Bali)',
		tax_id: '02.345.678.9-023.000',
		address: 'Jl. Raya Hanoman No. 18, Ubud, Gianyar, Bali',
		status: 'active',
		active: true,
		created_at: '2026-02-15T09:00:00.000Z'
	},
	{
		id: 'org-plaga',
		code: 'PLG',
		name: 'Plaga',
		description: 'Farm-to-table bistro & winery cafe (Badung, Bali)',
		tax_id: '03.456.789.0-034.000',
		address: 'Jl. Raya Petitenget No. 88, Badung, Bali',
		status: 'active',
		active: true,
		created_at: '2026-03-20T10:00:00.000Z'
	}
];

// In-Memory State untuk Outlet
export let mockOutlets: Outlet[] = [
	{
		id: 'out-jkt-01',
		organization_id: 'org-jodi',
		code: 'JKT-01',
		name: 'Jodi Senopati',
		city: 'Jakarta Selatan',
		address: 'Jl. Senopati No. 42, Kebayoran Baru',
		phone: '021-5721890',
		tax_rate: 0.10,
		service_charge: 0.05,
		petty_cash_limit: '300000.00',
		owner_type: 'own_company',
		group_id: 'grp-jabodetabek',
		status: 'active',
		active: true,
		created_at: '2026-01-12T08:30:00.000Z'
	},
	{
		id: 'out-bdg-01',
		organization_id: 'org-jodi',
		code: 'BDG-01',
		name: 'Jodi Dago',
		city: 'Bandung',
		address: 'Jl. Ir. H. Juanda No. 128, Dago',
		phone: '022-4235890',
		tax_rate: 0.10,
		service_charge: 0.05,
		petty_cash_limit: '250000.00',
		owner_type: 'own_company',
		group_id: 'grp-jawa-barat',
		status: 'active',
		active: true,
		created_at: '2026-02-01T09:00:00.000Z'
	},
	{
		id: 'out-sub-01',
		organization_id: 'org-jodi',
		code: 'SUB-01',
		name: 'Jodi Gubeng',
		city: 'Surabaya',
		address: 'Jl. Raya Gubeng No. 54, Gubeng',
		phone: '031-5021234',
		tax_rate: 0.10,
		service_charge: 0.05,
		petty_cash_limit: '250000.00',
		owner_type: 'partner',
		group_id: 'grp-jawa-timur',
		status: 'active',
		active: true,
		created_at: '2026-03-01T10:00:00.000Z'
	},
	{
		id: 'out-kvl-01',
		organization_id: 'org-kaveloka',
		code: 'KVL-01',
		name: 'Kaveloka Ubud',
		city: 'Gianyar, Bali',
		address: 'Jl. Raya Hanoman No. 18, Ubud',
		phone: '0361-975432',
		tax_rate: 0.10,
		service_charge: 0.06,
		petty_cash_limit: '350000.00',
		owner_type: 'own_company',
		group_id: 'grp-bali',
		status: 'active',
		active: true,
		created_at: '2026-02-18T11:00:00.000Z'
	},
	{
		id: 'out-plg-01',
		organization_id: 'org-plaga',
		code: 'PLG-01',
		name: 'Plaga Farm Bistro',
		city: 'Badung, Bali',
		address: 'Jl. Raya Petitenget No. 88, Badung',
		phone: '0361-847231',
		tax_rate: 0.10,
		service_charge: 0.07,
		petty_cash_limit: '400000.00',
		owner_type: 'own_company',
		group_id: 'grp-bali',
		status: 'active',
		active: true,
		created_at: '2026-03-25T11:30:00.000Z'
	}
];

// In-Memory State untuk Grup Outlet (T-02.8)
export let mockOutletGroups: OutletGroup[] = [
	{
		id: 'grp-jabodetabek',
		organization_id: 'org-jodi',
		code: 'GRP-JABO',
		name: 'Wilayah Jabodetabek',
		description: 'Seluruh gerai area Jakarta, Bogor, Depok, Tangerang, Bekasi',
		outlet_ids: ['out-jkt-01'],
		created_at: '2026-01-15T08:00:00.000Z'
	},
	{
		id: 'grp-jawa-barat',
		organization_id: 'org-jodi',
		code: 'GRP-JABAR',
		name: 'Wilayah Jawa Barat',
		description: 'Gerai area Bandung Raya dan Priangan',
		outlet_ids: ['out-bdg-01'],
		created_at: '2026-02-05T08:00:00.000Z'
	},
	{
		id: 'grp-jawa-timur',
		organization_id: 'org-jodi',
		code: 'GRP-JATIM',
		name: 'Wilayah Jawa Timur',
		description: 'Gerai area Surabaya dan Malang',
		outlet_ids: ['out-sub-01'],
		created_at: '2026-03-05T08:00:00.000Z'
	},
	{
		id: 'grp-bali',
		code: 'GRP-BALI',
		name: 'Wilayah Bali & Nusa Tenggara',
		description: 'Konsolidasi gerai di Pulau Bali',
		outlet_ids: ['out-kvl-01', 'out-plg-01'],
		created_at: '2026-02-20T08:00:00.000Z'
	}
];

// In-Memory State untuk Kepemilikan Mitra / Investor (T-02.5, Flag: partner_ownership)
export let mockOutletOwnerships: Record<string, OutletOwnership[]> = {
	'out-sub-01': [
		{
			id: 'own-sub-1',
			outlet_id: 'out-sub-01',
			owner_name: 'PT Mitra Sukses F&B',
			owner_email: 'investor@mitrasukses.co.id',
			owner_phone: '0811-2233-4455',
			share_pct: 60.0,
			effective_from: '2026-01-01',
			effective_to: null,
			notes: 'Investor utama pendanaan fitout gerai Surabaya'
		},
		{
			id: 'own-sub-2',
			outlet_id: 'out-sub-01',
			owner_name: 'Hendrawan Kusuma',
			owner_email: 'hendrawan@gmail.com',
			owner_phone: '0812-9988-7766',
			share_pct: 40.0,
			effective_from: '2026-01-01',
			effective_to: null,
			notes: 'Mitra pengelola properti ruko Gubeng'
		}
	],
	'out-jkt-01': [
		{
			id: 'own-jkt-1',
			outlet_id: 'out-jkt-01',
			owner_name: 'Seduhan Kopi Jodi HQ',
			owner_email: 'corporate@seduhanjodi.id',
			owner_phone: '021-5721890',
			share_pct: 100.0,
			effective_from: '2026-01-01',
			effective_to: null,
			notes: 'Outlet Mandiri (100% Owned)'
		}
	]
};

// Dokumen Operasional Aktif per Outlet untuk Simulasi Deaktivasi (AC-02.2)
export const mockBlockingDocsPerOutlet: Record<string, BlockingDocument[]> = {
	'out-jkt-01': [
		{
			id: 'po-ext-001',
			doc_type: 'purchase_order',
			ref_number: 'PO-EXT-202610-001',
			title: 'PO Pembelian Es Batu Kristal Higienis',
			reason: 'PO berstatus PENDING persetujuan belanja luar.'
		},
		{
			id: 'inv-sup-003',
			doc_type: 'supplier_invoice',
			ref_number: 'INV-SUP-202610-003',
			title: 'Faktur CV Sumber Pangan (Fresh Milk)',
			reason: 'Penerimaan barang menunggu verifikasi nota & True-Up HPP.'
		}
	]
};

export function registerOrganizationHandlers(): void {
	// =========================================================================
	// 1. ENDPOINT ORGANISASI INDUK (T-02.0)
	// =========================================================================

	// GET /api/v1/organizations
	router.register('GET', '/api/v1/organizations', async (ctx) => {
		const search = (ctx.query?.get('search') || ctx.req.query?.search as string)?.toLowerCase();
		const status = ctx.query?.get('status') || ctx.req.query?.status as string;

		let list = mockOrganizations.map((org) => {
			const activeOutlets = mockOutlets.filter(
				(o) => o.organization_id === org.id && (o.status === 'active' || o.active !== false)
			);
			return {
				...org,
				outlet_count: activeOutlets.length
			};
		});

		if (status && status !== 'all') {
			list = list.filter((o) => (status === 'active' ? o.active !== false : o.active === false));
		}

		if (search) {
			list = list.filter(
				(o) =>
					o.name.toLowerCase().includes(search) ||
					o.code.toLowerCase().includes(search) ||
					(o.tax_id && o.tax_id.toLowerCase().includes(search))
			);
		}

		return { data: list };
	});

	// POST /api/v1/organizations (AC-02.0)
	router.register('POST', '/api/v1/organizations', async (ctx) => {
		const body = (ctx.req.body || {}) as Partial<Organization>;
		if (!body.name || !body.name.trim()) {
			throw ApiErrors.validationError(
				[{ field: 'name', code: 'required', message: 'Nama organisasi wajib diisi' }],
				'Nama organisasi wajib diisi'
			);
		}

		const codeVal = validateOrgCode(body.code || '');
		if (!codeVal.valid) {
			throw ApiErrors.validationError(
				[{ field: 'code', code: 'invalid_format', message: codeVal.error! }],
				codeVal.error!
			);
		}

		const upperCode = body.code!.trim().toUpperCase();
		const isDuplicate = mockOrganizations.some((o) => o.code.toUpperCase() === upperCode);
		if (isDuplicate) {
			throw ApiErrors.conflict(`Kode organisasi "${upperCode}" sudah digunakan.`);
		}

		const newOrg: Organization = {
			id: `org-${upperCode.toLowerCase()}`,
			code: upperCode,
			name: body.name.trim(),
			description: body.description?.trim(),
			tax_id: body.tax_id?.trim(),
			address: body.address?.trim(),
			status: 'active',
			active: true,
			outlet_count: 0,
			created_at: clock.nowIso()
		};

		mockOrganizations.push(newOrg);
		return { data: newOrg };
	});

	// GET /api/v1/organizations/:id
	router.register('GET', '/api/v1/organizations/:id', async (ctx) => {
		const org = mockOrganizations.find((o) => o.id === ctx.params.id);
		if (!org) {
			throw ApiErrors.notFound(`Organisasi dengan ID "${ctx.params.id}" tidak ditemukan.`);
		}
		const activeOutlets = mockOutlets.filter(
			(o) => o.organization_id === org.id && (o.status === 'active' || o.active !== false)
		);
		return { data: { ...org, outlet_count: activeOutlets.length } };
	});

	// PUT /api/v1/organizations/:id
	router.register('PUT', '/api/v1/organizations/:id', async (ctx) => {
		const index = mockOrganizations.findIndex((o) => o.id === ctx.params.id);
		if (index === -1) {
			throw ApiErrors.notFound(`Organisasi dengan ID "${ctx.params.id}" tidak ditemukan.`);
		}

		const body = (ctx.req.body || {}) as Partial<Organization>;
		const existing = mockOrganizations[index];

		if (body.code && body.code.toUpperCase() !== existing.code) {
			const codeVal = validateOrgCode(body.code);
			if (!codeVal.valid) {
				throw ApiErrors.validationError([{ field: 'code', code: 'invalid_format', message: codeVal.error! }], codeVal.error!);
			}
			const dup = mockOrganizations.some((o) => o.id !== existing.id && o.code.toUpperCase() === body.code!.toUpperCase());
			if (dup) {
				throw ApiErrors.conflict(`Kode organisasi "${body.code.toUpperCase()}" sudah digunakan.`);
			}
			existing.code = body.code.toUpperCase();
		}

		if (body.name) existing.name = body.name.trim();
		if (body.description !== undefined) existing.description = body.description.trim();
		if (body.tax_id !== undefined) existing.tax_id = body.tax_id.trim();
		if (body.address !== undefined) existing.address = body.address.trim();

		return { data: existing };
	});

	// POST /api/v1/organizations/:id/actions/activate
	router.register('POST', '/api/v1/organizations/:id/actions/activate', async (ctx) => {
		const org = mockOrganizations.find((o) => o.id === ctx.params.id);
		if (!org) {
			throw ApiErrors.notFound(`Organisasi tidak ditemukan.`);
		}
		org.status = 'active';
		org.active = true;
		return { data: org };
	});

	// POST /api/v1/organizations/:id/actions/deactivate (AC-02.2)
	router.register('POST', '/api/v1/organizations/:id/actions/deactivate', async (ctx) => {
		const org = mockOrganizations.find((o) => o.id === ctx.params.id);
		if (!org) {
			throw ApiErrors.notFound(`Organisasi tidak ditemukan.`);
		}

		const evalResult = evaluateOrgDeactivation(org.id, mockOutlets);
		if (!evalResult.canDeactivate) {
			const details = evalResult.blockingDocuments.map((doc) => ({
				field: 'status',
				code: 'blocking_document',
				message: `${doc.ref_number}: ${doc.reason}`
			}));
			const err = ApiErrors.conflict(evalResult.message!, details);
			(err as any).blocking_documents = evalResult.blockingDocuments;
			(err.envelope.error as any).blocking_documents = evalResult.blockingDocuments;
			throw err;
		}

		org.status = 'inactive';
		org.active = false;
		return { data: org };
	});

	// =========================================================================
	// 2. ENDPOINT OUTLET / GERAI (T-02.1)
	// =========================================================================

	// GET /api/v1/outlets
	router.register('GET', '/api/v1/outlets', async (ctx) => {
		const currentUser = getCurrentMockUser();
		const role = (ctx.query?.get('role') || ctx.req.query?.role as string) || currentUser?.role || 'owner';
		const orgFilter = ctx.query?.get('organization_id') || ctx.req.query?.organization_id as string;
		const ownerFilter = ctx.query?.get('owner_type') || ctx.req.query?.owner_type as string;
		const statusFilter = ctx.query?.get('status') || ctx.req.query?.status as string;
		const groupFilter = ctx.query?.get('group_id') || ctx.req.query?.group_id as string;
		const search = (ctx.query?.get('search') || ctx.req.query?.search as string)?.toLowerCase();

		let list = [...mockOutlets];

		// Scope locking untuk Store Manager (AC-02.6)
		if (role === 'store_manager') {
			const assignedOutlets = currentUser?.outlet_ids || ['out-jkt-01'];
			list = list.filter((o) => assignedOutlets.includes(o.id));
		}

		if (orgFilter && orgFilter !== '*') {
			list = list.filter((o) => o.organization_id === orgFilter);
		}

		if (ownerFilter && ownerFilter !== 'all') {
			list = list.filter((o) => o.owner_type === ownerFilter);
		}

		if (statusFilter && statusFilter !== 'all') {
			list = list.filter((o) => (statusFilter === 'active' ? o.active !== false : o.active === false));
		}

		if (groupFilter && groupFilter !== 'all') {
			list = list.filter((o) => o.group_id === groupFilter);
		}

		if (search) {
			list = list.filter(
				(o) =>
					o.name.toLowerCase().includes(search) ||
					o.code.toLowerCase().includes(search) ||
					o.city.toLowerCase().includes(search)
			);
		}

		return { data: list };
	});

	// POST /api/v1/outlets (AC-02.0, AC-02.1)
	router.register('POST', '/api/v1/outlets', async (ctx) => {
		const body = (ctx.req.body || {}) as Partial<Outlet>;

		// 1. Validasi relasi wajib ke Organisasi Induk (AC-02.0)
		if (!body.organization_id) {
			throw ApiErrors.validationError(
				[{ field: 'organization_id', code: 'required', message: 'Organisasi induk wajib dipilih' }],
				'Organisasi induk wajib dipilih'
			);
		}
		const orgExists = mockOrganizations.some((o) => o.id === body.organization_id);
		if (!orgExists) {
			throw ApiErrors.validationError(
				[{ field: 'organization_id', code: 'invalid_ref', message: 'Organisasi induk tidak terdaftar' }],
				`Organisasi induk "${body.organization_id}" tidak valid.`
			);
		}

		if (!body.name || !body.name.trim()) {
			throw ApiErrors.validationError(
				[{ field: 'name', code: 'required', message: 'Nama outlet wajib diisi' }],
				'Nama outlet wajib diisi'
			);
		}

		// 2. Validasi format & keunikan kode outlet (AC-02.1)
		const codeVal = validateOutletCode(body.code || '');
		if (!codeVal.valid) {
			throw ApiErrors.validationError(
				[{ field: 'code', code: 'invalid_format', message: codeVal.error! }],
				codeVal.error!
			);
		}

		const upperCode = body.code!.trim().toUpperCase();
		const isDuplicate = mockOutlets.some((o) => o.code.toUpperCase() === upperCode);
		if (isDuplicate) {
			throw ApiErrors.conflict(`Kode outlet "${upperCode}" sudah digunakan.`);
		}

		const newOutlet: Outlet = {
			id: `out-${upperCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
			organization_id: body.organization_id,
			code: upperCode,
			name: body.name.trim(),
			city: body.city?.trim() || 'Jakarta',
			address: body.address?.trim() || '',
			phone: body.phone?.trim() || '',
			tax_rate: body.tax_rate ?? 0.10,
			service_charge: body.service_charge ?? 0.05,
			petty_cash_limit: body.petty_cash_limit || '300000.00',
			owner_type: body.owner_type || 'own_company',
			group_id: body.group_id,
			status: 'active',
			active: true,
			created_at: clock.nowIso()
		};

		mockOutlets.push(newOutlet);
		return { data: newOutlet };
	});

	// GET /api/v1/outlets/:id (AC-02.6 Scope Lock)
	router.register('GET', '/api/v1/outlets/:id', async (ctx) => {
		const currentUser = getCurrentMockUser();
		const role = (ctx.query?.get('role') || ctx.req.query?.role as string) || currentUser?.role || 'owner';
		const outlet = mockOutlets.find((o) => o.id === ctx.params.id);

		if (!outlet) {
			throw ApiErrors.notFound(`Outlet "${ctx.params.id}" tidak ditemukan.`);
		}

		// Scope lock Store Manager: lempar 404 jika di luar tugasnya
		if (role === 'store_manager') {
			const assigned = currentUser?.outlet_ids || ['out-jkt-01'];
			if (!assigned.includes(outlet.id)) {
				throw ApiErrors.notFound(`Outlet "${ctx.params.id}" tidak ditemukan dalam cakupan penugasan Anda.`);
			}
		}

		return { data: outlet };
	});

	// PUT /api/v1/outlets/:id
	router.register('PUT', '/api/v1/outlets/:id', async (ctx) => {
		const currentUser = getCurrentMockUser();
		const role = (ctx.query?.get('role') || ctx.req.query?.role as string) || currentUser?.role || 'owner';
		if (role === 'finance') {
			throw ApiErrors.forbidden('Peran Finance hanya memiliki hak baca (read-only) pada data master outlet.');
		}

		const index = mockOutlets.findIndex((o) => o.id === ctx.params.id);
		if (index === -1) {
			throw ApiErrors.notFound(`Outlet "${ctx.params.id}" tidak ditemukan.`);
		}

		const body = (ctx.req.body || {}) as Partial<Outlet>;
		const existing = mockOutlets[index];

		if (body.code && body.code.toUpperCase() !== existing.code) {
			const codeVal = validateOutletCode(body.code);
			if (!codeVal.valid) {
				throw ApiErrors.validationError(
					[{ field: 'code', code: 'invalid_format', message: codeVal.error! }],
					codeVal.error!
				);
			}
			const dup = mockOutlets.some((o) => o.id !== existing.id && o.code.toUpperCase() === body.code!.toUpperCase());
			if (dup) {
				throw ApiErrors.conflict(`Kode outlet "${body.code.toUpperCase()}" sudah digunakan.`);
			}
			existing.code = body.code.toUpperCase();
		}

		if (body.organization_id) {
			const orgExists = mockOrganizations.some((o) => o.id === body.organization_id);
			if (!orgExists) {
				throw ApiErrors.validationError(
					[{ field: 'organization_id', code: 'invalid_ref', message: 'Organisasi tidak ditemukan' }],
					'Organisasi induk tidak terdaftar.'
				);
			}
			existing.organization_id = body.organization_id;
		}

		if (body.name) existing.name = body.name.trim();
		if (body.city) existing.city = body.city.trim();
		if (body.address !== undefined) existing.address = body.address.trim();
		if (body.phone !== undefined) existing.phone = body.phone.trim();
		if (body.tax_rate !== undefined) existing.tax_rate = Number(body.tax_rate);
		if (body.service_charge !== undefined) existing.service_charge = Number(body.service_charge);
		if (body.petty_cash_limit !== undefined) existing.petty_cash_limit = body.petty_cash_limit;
		if (body.owner_type) existing.owner_type = body.owner_type;
		if (body.group_id !== undefined) existing.group_id = body.group_id;

		return { data: existing };
	});

	// POST /api/v1/outlets/:id/actions/activate
	router.register('POST', '/api/v1/outlets/:id/actions/activate', async (ctx) => {
		const outlet = mockOutlets.find((o) => o.id === ctx.params.id);
		if (!outlet) throw ApiErrors.notFound('Outlet tidak ditemukan.');
		outlet.status = 'active';
		outlet.active = true;
		return { data: outlet };
	});

	// POST /api/v1/outlets/:id/actions/deactivate (AC-02.2)
	router.register('POST', '/api/v1/outlets/:id/actions/deactivate', async (ctx) => {
		const outlet = mockOutlets.find((o) => o.id === ctx.params.id);
		if (!outlet) throw ApiErrors.notFound('Outlet tidak ditemukan.');

		const blocking = mockBlockingDocsPerOutlet[outlet.id] || [];
		const evalResult = evaluateOutletDeactivation(outlet.id, blocking);

		if (!evalResult.canDeactivate) {
			const details = evalResult.blockingDocuments.map((doc) => ({
				field: 'status',
				code: 'blocking_document',
				message: `${doc.ref_number}: ${doc.reason}`
			}));
			const err = ApiErrors.conflict(evalResult.message!, details);
			(err as any).blocking_documents = evalResult.blockingDocuments;
			(err.envelope.error as any).blocking_documents = evalResult.blockingDocuments;
			throw err;
		}

		outlet.status = 'inactive';
		outlet.active = false;
		return { data: outlet };
	});

	// =========================================================================
	// 3. ENDPOINT GRUP OUTLET (T-02.8)
	// =========================================================================

	// GET /api/v1/outlet-groups
	router.register('GET', '/api/v1/outlet-groups', async () => {
		return { data: mockOutletGroups };
	});

	// POST /api/v1/outlet-groups
	router.register('POST', '/api/v1/outlet-groups', async (ctx) => {
		const body = (ctx.req.body || {}) as Partial<OutletGroup>;
		if (!body.name || !body.name.trim()) {
			throw ApiErrors.validationError(
				[{ field: 'name', code: 'required', message: 'Nama grup wajib diisi' }],
				'Nama grup outlet wajib diisi'
			);
		}

		const newGroup: OutletGroup = {
			id: `grp-${Date.now()}`,
			organization_id: body.organization_id,
			code: body.code?.trim().toUpperCase() || `GRP-${Date.now().toString().slice(-4)}`,
			name: body.name.trim(),
			description: body.description?.trim(),
			outlet_ids: body.outlet_ids || [],
			created_at: clock.nowIso()
		};

		mockOutletGroups.push(newGroup);
		return { data: newGroup };
	});

	// =========================================================================
	// 4. ENDPOINT KEPEMILIKAN & MITRA INVESTOR (T-02.5, T-02.6, T-02.9, AC-02.7)
	// =========================================================================

	// GET /api/v1/outlet-owners
	router.register('GET', '/api/v1/outlet-owners', async () => {
		// Evaluasi feature flag partner_ownership (AC-02.7)
		const flags = getCurrentFeatureFlags();
		if (flags && flags.partner_ownership === false) {
			throw ApiErrors.forbidden('Fitur kepemilikan mitra dinonaktifkan (partner_ownership: false).');
		}

		// Kumpulkan seluruh pemilik unik dari daftar ownership
		const uniqueOwnersMap = new Map<string, { name: string; email?: string; phone?: string; outlet_count: number }>();

		for (const [outletId, list] of Object.entries(mockOutletOwnerships)) {
			for (const own of list) {
				const existing = uniqueOwnersMap.get(own.owner_name) || {
					name: own.owner_name,
					email: own.owner_email,
					phone: own.owner_phone,
					outlet_count: 0
				};
				existing.outlet_count++;
				uniqueOwnersMap.set(own.owner_name, existing);
			}
		}

		return { data: Array.from(uniqueOwnersMap.values()) };
	});

	// GET /api/v1/outlets/:id/ownerships
	router.register('GET', '/api/v1/outlets/:id/ownerships', async (ctx) => {
		const flags = getCurrentFeatureFlags();
		if (flags && flags.partner_ownership === false) {
			throw ApiErrors.forbidden('Fitur kepemilikan mitra dinonaktifkan (partner_ownership: false).');
		}

		const outletId = ctx.params.id;
		const ownerships = mockOutletOwnerships[outletId] || [];
		return { data: ownerships };
	});

	// POST /api/v1/outlets/:id/ownerships (AC-02.3, AC-02.4)
	router.register('POST', '/api/v1/outlets/:id/ownerships', async (ctx) => {
		const flags = getCurrentFeatureFlags();
		if (flags && flags.partner_ownership === false) {
			throw ApiErrors.forbidden('Fitur kepemilikan mitra dinonaktifkan (partner_ownership: false).');
		}

		const outletId = ctx.params.id;
		const body = ctx.req.body as { ownerships: OutletOwnership[] };
		const ownerships = body?.ownerships || [];

		// Validasi aturan kepemilikan: 100% total & tanggal non-overlapping
		const val = validateOwnershipRules(ownerships);
		if (!val.valid) {
			throw ApiErrors.validationError(
				[{ field: 'share_pct', code: 'invalid_distribution', message: val.error! }],
				val.error!
			);
		}

		mockOutletOwnerships[outletId] = ownerships.map((o, idx) => ({
			...o,
			id: o.id || `own-${outletId}-${idx + 1}`,
			outlet_id: outletId
		}));

		return {
			data: mockOutletOwnerships[outletId],
			meta: {
				has_empty_shares: val.hasEmptyShares,
				total_share_pct: val.totalSharePct
			}
		};
	});
}
