// Domain-Driven Design (DDD) Types & Mock State for ERP Backoffice & Finance
// Designed for seamless 1:1 mapping with MySQL database tables

export interface BillItem {
	id: string;
	itemId: string;
	itemName: string;
	unit: string;
	receivedQty: number;
	estimatedUnitPrice: number; // Harga LPP sementara saat barang diterima
	actualUnitPrice: number;    // Harga riil di nota supplier
	variancePerUnit: number;    // actual - estimated
	totalVariance: number;      // variancePerUnit * receivedQty
}

export interface SupplierBill {
	id: string;
	billNumber: string;         // e.g. INV-SUP-202610-008
	receiptId: string;          // e.g. RCV-JKT-01-20261011
	outletId: string;
	outletName: string;
	supplierName: string;
	billDate: string;
	dueDate: string;
	totalAmount: number;
	totalEstimatedAmount: number;
	totalVariance: number;
	status: 'DRAFT' | 'WAITING_INVOICE' | 'INVOICED' | 'PAID' | 'RECONCILED';
	items: BillItem[];
	createdAt: string;
}

export interface JournalLine {
	accountCode: string;
	accountName: string;
	debit: number;
	credit: number;
}

export interface JournalEntry {
	id: string;
	entryNumber: string;        // JRN-202610-0042
	date: string;
	sourceType: 'POS_SALE' | 'SUPPLIER_BILL' | 'TRUE_UP' | 'PETTY_CASH' | 'INTERNAL_TRANSFER';
	sourceId: string;
	outletName: string;
	description: string;
	lines: JournalLine[];
	totalDebit: number;
	totalCredit: number;
}

export interface PettyCashTransaction {
	id: string;
	trxNumber: string;
	outletId: string;
	outletName: string;
	requester: string;
	category: 'Operasional' | 'Bahan Darurat' | 'Kebersihan' | 'Maintenance' | 'Lainnya';
	amount: number;
	reason: string;
	receiptProofUrl?: string;
	requiresLeaderApproval: boolean;
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
	approvedBy?: string;
	createdAt: string;
}

export interface StockRequisition {
	id: string;
	reqNumber: string;          // REQ-JKT-202610-015
	outletId: string;
	outletName: string;
	requesterName: string;
	notes: string;
	status: 'SUBMITTED' | 'APPROVED' | 'DISPATCHED' | 'RECEIVED';
	createdAt: string;
	items: {
		itemId: string;
		itemName: string;
		unit: string;
		requestedQty: number;
		dispatchedQty?: number;
		// Store Manager TIDAK melihat harga (Blind Request)
	}[];
}

export interface AgingPayable {
	supplierName: string;
	outletName: string;
	totalDebt: number;
	current0_30: number;
	bracket31_60: number;
	bracketOver60: number;
	nextDueDate: string;
}

// ---------------------------------------------------------------------------
// INITIAL MOCK DATA (DDD Aggregate States)
// ---------------------------------------------------------------------------

export const INITIAL_SUPPLIER_BILLS: SupplierBill[] = [
	{
		id: 'bill-1',
		billNumber: 'INV-GRN-202610-044',
		receiptId: 'RCV-JKT-01-20261012-01',
		outletId: 'out-1',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		supplierName: 'PT Greenfields Fresh Dairy',
		billDate: '12 Okt 2026',
		dueDate: '26 Okt 2026',
		totalAmount: 1850000,
		totalEstimatedAmount: 1760000,
		totalVariance: 90000,
		status: 'WAITING_INVOICE',
		createdAt: '2026-10-12 11:30',
		items: [
			{
				id: 'bi-1',
				itemId: 'ing-1',
				itemName: 'Fresh Milk Greenfield 1L',
				unit: 'Liter',
				receivedQty: 80,
				estimatedUnitPrice: 22000,
				actualUnitPrice: 23125, // Naik dari harga perkiraan
				variancePerUnit: 1125,
				totalVariance: 90000
			}
		]
	},
	{
		id: 'bill-2',
		billNumber: 'INV-UJI-202610-012',
		receiptId: 'RCV-JKT-01-20261011-02',
		outletId: 'out-1',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		supplierName: 'Uji Tea Kyoto Direct Import',
		billDate: '11 Okt 2026',
		dueDate: '25 Okt 2026',
		totalAmount: 3200000,
		totalEstimatedAmount: 3200000,
		totalVariance: 0,
		status: 'RECONCILED',
		createdAt: '2026-10-11 09:15',
		items: [
			{
				id: 'bi-2',
				itemId: 'ing-2',
				itemName: 'Pure Uji Matcha Powder (Ceremonial Grade)',
				unit: 'Gram',
				receivedQty: 2000,
				estimatedUnitPrice: 1600,
				actualUnitPrice: 1600,
				variancePerUnit: 0,
				totalVariance: 0
			}
		]
	},
	{
		id: 'bill-3',
		billNumber: 'INV-GYO-202610-088',
		receiptId: 'RCV-BSD-02-20261010-01',
		outletId: 'out-2',
		outletName: 'Cabang BSD (GOP 9)',
		supplierName: 'Koperasi Tani Gayo Highland',
		billDate: '10 Okt 2026',
		dueDate: '24 Okt 2026',
		totalAmount: 4800000,
		totalEstimatedAmount: 4950000,
		totalVariance: -150000, // Lebih murah -> HPP Terkoreksi turun (Hemat Modal)
		status: 'INVOICED',
		createdAt: '2026-10-10 14:20',
		items: [
			{
				id: 'bi-3',
				itemId: 'ing-3',
				itemName: 'Green Beans Arabica Gayo Natural',
				unit: 'Kg',
				receivedQty: 30,
				estimatedUnitPrice: 165000,
				actualUnitPrice: 160000,
				variancePerUnit: -5000,
				totalVariance: -150000
			}
		]
	}
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
	{
		id: 'jrn-1',
		entryNumber: 'JRN-20261012-0042',
		date: '12 Okt 2026 14:28',
		sourceType: 'POS_SALE',
		sourceId: 'TRX-JKT-01-20261012-0042',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		description: 'Penjualan POS Kasir: 2x Hanjo Aren Latte, 1x Croissant',
		totalDebit: 73500,
		totalCredit: 73500,
		lines: [
			{ accountCode: '1101-01', accountName: 'Kas Kasir Senopati (Tunai & QRIS)', debit: 73500, credit: 0 },
			{ accountCode: '4101-01', accountName: 'Pendapatan Penjualan Minuman', debit: 0, credit: 55500 },
			{ accountCode: '4101-02', accountName: 'Pendapatan Penjualan Bakery Pastry', debit: 0, credit: 18000 }
		]
	},
	{
		id: 'jrn-2',
		entryNumber: 'JRN-20261012-0043',
		date: '12 Okt 2026 14:28',
		sourceType: 'POS_SALE',
		sourceId: 'TRX-JKT-01-20261012-0042',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		description: 'Pengakuan HPP Barang Terjual (COGS) TRX-0042',
		totalDebit: 23200,
		totalCredit: 23200,
		lines: [
			{ accountCode: '5101-01', accountName: 'HPP - Bahan Baku Kopi & Susu', debit: 15200, credit: 0 },
			{ accountCode: '5101-02', accountName: 'HPP - Pastry & Bakery', debit: 8000, credit: 0 },
			{ accountCode: '1301-01', accountName: 'Persediaan Bahan Baku Outlet', debit: 0, credit: 15200 },
			{ accountCode: '1301-02', accountName: 'Persediaan Pastry Jadi', debit: 0, credit: 8000 }
		]
	},
	{
		id: 'jrn-3',
		entryNumber: 'JRN-20261012-0038',
		date: '12 Okt 2026 11:30',
		sourceType: 'TRUE_UP',
		sourceId: 'INV-GRN-202610-044',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		description: 'Koreksi HPP Otomatis (True-Up): Selisih Nota Supplier Fresh Milk',
		totalDebit: 90000,
		totalCredit: 90000,
		lines: [
			{ accountCode: '5101-99', accountName: 'Penyesuaian HPP True-Up (Selisih Harga)', debit: 90000, credit: 0 },
			{ accountCode: '2101-01', accountName: 'Hutang Dagang Supplier (PT Greenfields)', debit: 0, credit: 90000 }
		]
	}
];

export const INITIAL_PETTY_CASH: PettyCashTransaction[] = [
	{
		id: 'pc-1',
		trxNumber: 'PC-SEN-202610-011',
		outletId: 'out-1',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		requester: 'Budi Pratama (Manager)',
		category: 'Bahan Darurat',
		amount: 85000,
		reason: 'Beli 3 pack es batu kristal higienis (Supplier es terlambat antar)',
		requiresLeaderApproval: false,
		status: 'DISBURSED',
		createdAt: '12 Okt 2026 10:15'
	},
	{
		id: 'pc-2',
		trxNumber: 'PC-SEN-202610-012',
		outletId: 'out-1',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		requester: 'Budi Pratama (Manager)',
		category: 'Maintenance',
		amount: 350000,
		reason: 'Ganti Seal Karet Steam Wand Mesin Espresso Sanremo (Mendesak)',
		requiresLeaderApproval: true, // > Rp 150.000 -> Perlu Approval Owner
		status: 'PENDING',
		createdAt: '12 Okt 2026 13:40'
	},
	{
		id: 'pc-3',
		trxNumber: 'PC-BSD-202610-008',
		outletId: 'out-2',
		outletName: 'Cabang BSD (GOP 9)',
		requester: 'Siti Aminah (Supervisor)',
		category: 'Kebersihan',
		amount: 65000,
		reason: 'Beli cairan pembersih grinder & sabun cuci food-grade',
		requiresLeaderApproval: false,
		status: 'APPROVED',
		approvedBy: 'Budi Pratama',
		createdAt: '11 Okt 2026 16:00'
	}
];

export const INITIAL_REQUISITIONS: StockRequisition[] = [
	{
		id: 'req-1',
		reqNumber: 'REQ-SEN-202610-003',
		outletId: 'out-1',
		outletName: 'Outlet Pusat (Senopati Flagship)',
		requesterName: 'Budi Pratama (Manager)',
		notes: 'Stok susu dan matcha menipis jelang akhir pekan ramai.',
		status: 'DISPATCHED',
		createdAt: '12 Okt 2026 08:30',
		items: [
			{ itemId: 'ing-1', itemName: 'Fresh Milk Greenfield 1L', unit: 'Liter', requestedQty: 40, dispatchedQty: 40 },
			{ itemId: 'ing-2', itemName: 'Pure Uji Matcha Powder', unit: 'Gram', requestedQty: 500, dispatchedQty: 500 },
			{ itemId: 'pack-1', itemName: 'Paper Cup Hot 8oz Hanjo Logo', unit: 'Pcs', requestedQty: 300, dispatchedQty: 300 }
		]
	},
	{
		id: 'req-2',
		reqNumber: 'REQ-BSD-202610-002',
		outletId: 'out-2',
		outletName: 'Cabang BSD (GOP 9)',
		requesterName: 'Siti Aminah (Supervisor)',
		notes: 'Kebutuhan biji kopi house blend dan gula aren cair.',
		status: 'SUBMITTED',
		createdAt: '12 Okt 2026 11:00',
		items: [
			{ itemId: 'ing-3', itemName: 'House Blend Espresso Beans', unit: 'Kg', requestedQty: 15 },
			{ itemId: 'ing-4', itemName: 'Gula Aren Organik Cair (Jerrycan 5L)', unit: 'Jerrycan', requestedQty: 4 }
		]
	}
];

export const INITIAL_AGING_PAYABLES: AgingPayable[] = [
	{
		supplierName: 'PT Greenfields Fresh Dairy',
		outletName: 'Outlet Pusat & BSD',
		totalDebt: 3700000,
		current0_30: 3700000,
		bracket31_60: 0,
		bracketOver60: 0,
		nextDueDate: '26 Okt 2026'
	},
	{
		supplierName: 'Koperasi Tani Gayo Highland',
		outletName: 'Konsolidasi Gudang Pusat',
		totalDebt: 4800000,
		current0_30: 4800000,
		bracket31_60: 0,
		bracketOver60: 0,
		nextDueDate: '24 Okt 2026'
	},
	{
		supplierName: 'CV Kemasan Nusantara Packaging',
		outletName: 'Outlet Pusat',
		totalDebt: 1250000,
		current0_30: 0,
		bracket31_60: 1250000,
		bracketOver60: 0,
		nextDueDate: '18 Okt 2026'
	}
];
