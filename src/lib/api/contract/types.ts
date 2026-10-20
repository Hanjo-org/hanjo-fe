/**
 * Kontrak API — Tipe Dasar
 * Referensi: MILESTONE.md §3.3 (Antarmuka driver), §4.1-4.6
 *
 * Semua tipe di sini dipakai oleh kedua driver (mock dan HTTP).
 * Komponen UI TIDAK boleh mengimpor file ini secara langsung;
 * mereka mengakses data lewat service → client → driver.
 */

// ---------------------------------------------------------------------------
// Request & Response
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Permintaan API yang dikirim dari client ke driver.
 * Driver mock mencocokkan method + path; driver HTTP meneruskan ke jaringan.
 */
export interface ApiRequest {
  method: HttpMethod;
  /** Path relatif terhadap basis API, mis. `/inventory/stock` */
  path: string;
  /** Query parameters */
  query?: Record<string, unknown>;
  /** Request body (untuk POST/PUT/PATCH) */
  body?: unknown;
  /** Header tambahan */
  headers?: Record<string, string>;
  /** Kunci idempotensi (§4.6) */
  idempotencyKey?: string;
  /** Versi dokumen untuk If-Match concurrency (§4.6) */
  ifMatchVersion?: number;
  /** AbortSignal untuk pembatalan */
  signal?: AbortSignal;
}

/**
 * Respons API dari driver.
 */
export interface ApiResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: Envelope<T> | ErrorEnvelope;
}

// ---------------------------------------------------------------------------
// Amplop Respons (§4.3)
// ---------------------------------------------------------------------------

/** Respons sukses — objek tunggal */
export interface DataEnvelope<T> {
  data: T;
}

/** Respons sukses — daftar dengan paginasi */
export interface ListEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Meta paginasi */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Amplop gabungan */
export type Envelope<T> = DataEnvelope<T> | ListEnvelope<T>;

/** Respons galat */
export interface ErrorEnvelope {
  error: ApiError;
}

/** Detail galat */
export interface ApiError {
  code: string;
  message: string;
  details?: ValidationDetail[];
  request_id?: string;
}

/** Detail validasi per field */
export interface ValidationDetail {
  field: string;
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Driver Interface (§3.3) — Kontrak yang harus dipenuhi mock dan HTTP driver
// ---------------------------------------------------------------------------

/**
 * Antarmuka driver data.
 * Mock driver dan HTTP driver sama-sama mengimplementasikan ini.
 * Client API hanya tahu antarmuka ini, tidak tahu implementasinya.
 */
export interface DataDriver {
  request<T>(req: ApiRequest): Promise<ApiResponse<T>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cek apakah body adalah ErrorEnvelope */
export function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ErrorEnvelope).error?.code === 'string'
  );
}

/** Cek apakah body adalah ListEnvelope (punya meta) */
export function isListEnvelope<T>(body: unknown): body is ListEnvelope<T> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'data' in body &&
    Array.isArray((body as ListEnvelope<T>).data) &&
    'meta' in body
  );
}

// ---------------------------------------------------------------------------
// Angka sebagai string desimal (§4.2)
// ---------------------------------------------------------------------------

/**
 * Uang dan jumlah dikirim sebagai string desimal di batas API.
 * Presisi: jumlah dan biaya satuan 4 desimal; total uang 2 desimal.
 * Persentase juga string desimal ("5.00" = 5%).
 *
 * Contoh: "20000.0000", "5.00"
 */
export type DecimalString = string;

// ---------------------------------------------------------------------------
// ID dan waktu (§4.1)
// ---------------------------------------------------------------------------

/** UUIDv7 string */
export type EntityId = string;

/** ISO 8601 UTC, contoh: "2026-10-13T06:28:00Z" */
export type ISODateTime = string;

/** Hari bisnis YYYY-MM-DD (dihitung Asia/Jakarta), contoh: "2026-10-13" */
export type BusinessDate = string;

// ---------------------------------------------------------------------------
// Aksi transisi status (§4.5)
// ---------------------------------------------------------------------------

/** Respons aksi transisi status */
export interface ActionResponse<T> {
  data: T;
  meta?: {
    effects?: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Konkurensi (§4.6)
// ---------------------------------------------------------------------------

/** Entitas yang mendukung optimistic concurrency */
export interface Versioned {
  version: number;
}

// ---------------------------------------------------------------------------
// Organisasi & Outlet (§MS-00, §MS-02)
// ---------------------------------------------------------------------------

/** Entitas Organisasi (Di atas Outlet: 1 Organisasi mengelola beberapa Outlet) */
export interface Organization {
  id: string;
  code: string;
  name: string;
  description?: string;
  active?: boolean;
  created_at?: string;
}

/** Entitas Outlet / Gerai (Berada di bawah Organisasi) */
export interface Outlet {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  city: string;
  owner_type?: 'own_company' | 'partner';
  active?: boolean;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Identitas, Autentikasi & RBAC (§7, §MS-00)
// ---------------------------------------------------------------------------

/** Peran Pengguna Baku */
export type UserRole = 'owner' | 'hq_admin' | 'finance' | 'store_manager' | 'cashier';

/** Profil Pengguna */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  /** ID organisasi utama tempat pengguna bertugas */
  organization_id?: string;
  /** Daftar ID organisasi yang boleh diakses pengguna */
  organization_ids?: string[];
  /** Daftar ID outlet yang ditugaskan (khusus store_manager) */
  outlet_ids?: string[];
  /** Daftar izin granular spesifik pengguna (PBAC) */
  permissions?: string[];
  created_at?: string;
}

/** Sesi Login Pengguna */
export interface Session {
  token: string;
  user: User;
  expires_at: string;
  permissions: string[];
  feature_flags: Record<string, boolean>;
}

/** Permintaan Login */
export interface AuthLoginRequest {
  email?: string;
  password?: string;
  role?: UserRole;
}

/** Permintaan Step-Up Auth */
export interface StepUpRequest {
  password?: string;
  pin?: string;
}

/** Respons Step-Up Auth */
export interface StepUpResponse {
  step_up_token: string;
  expires_in_seconds: number;
}

// ---------------------------------------------------------------------------
// Shell, Navigasi & Notifikasi (MS-01)
// ---------------------------------------------------------------------------

/** Peta jumlah lencana navigasi menunggu tindakan */
export type NavBadges = Record<string, number>;

/** Item Notifikasi Pengguna */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  link?: string;
  created_at: string;
}

/** Tipe Entitas Hasil Pencarian Global (T-01.4, AC-01.7) */
export type SearchEntityType = 'page' | 'po' | 'invoice' | 'item' | 'recipe' | 'outlet' | 'supplier';

/** Item Hasil Pencarian Entitas Global (T-01.4, AC-01.7) */
export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  href: string;
  outlet_id?: string;
  outlet_name?: string;
  badge?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Proyeksi Kartu Dashboard 4 Peran (MS-01B & MS-01C, §6.11, §MS-01)
// ---------------------------------------------------------------------------

export type DashboardCardKey =
  | 'action_center'
  | 'sales_summary'
  | 'gross_profit'
  | 'outlet_comparison'
  | 'stock_issues'
  | 'hq_payables'
  | 'petty_cash'
  | 'outlet_ops_status'
  | 'outlet_eod_status'
  | 'payment_reconciliation'
  | 'true_up_pending'
  | 'sm_stock_min'
  | 'sm_count_schedule'
  | 'sm_petty_cash'
  | 'sm_proposals'
  | 'sm_eod_status';

export interface DashboardCardResponse<T = unknown> {
  card_key: DashboardCardKey;
  updated_at: string;
  data: T;
}

export interface DashboardCardQuery {
  organization_id?: string;
  outlet_id?: string;
  owner_type?: 'all' | 'own_company' | 'partner';
  from?: string;
  to?: string;
  date?: string;
  role?: string;
}

// 1. Action Center
export interface ActionCenterItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  actionUrl: string;
  actionLabel: string;
  badge: string;
  badgeColor: 'warning' | 'danger' | 'info' | 'success';
}

export interface ActionCenterCardData {
  items: ActionCenterItem[];
  total_pending: number;
}

// 2. Sales Summary
export interface SalesSummaryCardData {
  omzet: DecimalString;
  cup_count: number;
  transaction_count?: number;
  yesterday_transaction_count?: number;
  avg_transaction_value: DecimalString;
  cash_amount: DecimalString;
  cash_percentage: DecimalString;
  non_cash_amount: DecimalString;
  non_cash_percentage: DecimalString;
  void_refund_count: number;
  void_refund_amount: DecimalString;
  trend_vs_previous_pct: DecimalString;
  yesterday_omzet?: DecimalString;
  yesterday_cup_count?: number;
  is_busier_than_yesterday?: boolean;
  busier_label?: string;
  hourly_traffic: {
    hour: string;
    count: number;
    omzet: DecimalString;
    yesterday_omzet?: DecimalString;
    yesterday_count?: number;
  }[];
  daily_trends: { date: string; omzet: DecimalString; cup_count: number; is_today?: boolean }[];
}

// 3. Gross Profit
export interface GrossProfitCardData {
  gross_profit: DecimalString;
  margin_pct: DecimalString;
  cogs_amount: DecimalString;
  is_estimate: boolean;
  pending_invoice_count: number;
  estimate_badge?: string;
  trend_vs_previous_pct: DecimalString;
}

// 4. Outlet Comparison
export interface OutletComparisonRow {
  outlet_id: string;
  outlet_name: string;
  organization_id?: string;
  organization_name?: string;
  owner_type: 'own_company' | 'partner';
  omzet: DecimalString;
  cups: number;
  cogs: DecimalString;
  operational_costs: DecimalString;
  gross_profit: DecimalString;
  margin_pct: DecimalString;
  stock_diff_pct: DecimalString;
  waste_pct: DecimalString;
  sync_status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  last_sync: string;
}

export interface OutletComparisonCardData {
  rows: OutletComparisonRow[];
  mode: 'full' | 'operational';
}

// 5. Stock Issues
export interface StockIssueItem {
  id: string;
  item_name: string;
  outlet_id: string;
  outlet_name: string;
  current_qty: DecimalString;
  min_qty: DecimalString;
  unit: string;
  est_days_left: DecimalString;
  severity: 'danger' | 'warning' | 'success';
  stock_diff_pct?: DecimalString;
  waste_pct?: DecimalString;
}

export interface StockIssuesCardData {
  items: StockIssueItem[];
  total_issues: number;
  summary_mode: boolean;
}

// 6. HQ Payables
export interface AgingBucket {
  not_due: DecimalString;
  days_1_30: DecimalString;
  days_31_60: DecimalString;
  days_61_90: DecimalString;
  days_over_90: DecimalString;
}

export interface DuePayableBill {
  id: string;
  invoice_number: string;
  supplier_name: string;
  category: string;
  due_date: string;
  due_date_formatted: string;
  days_left: number;
  days_left_label: string;
  amount: DecimalString;
  status: 'due_today' | 'due_soon' | 'overdue';
}

export interface HqPayablesCardData {
  total_balance: DecimalString;
  due_soon_amount: DecimalString;
  due_soon_count: number;
  due_bills: DuePayableBill[];
  overdue_amount: DecimalString;
  aging: AgingBucket;
  summary_mode: boolean;
}

// 7. Petty Cash (Finance)
export interface PettyCashOutletRow {
  outlet_id: string;
  outlet_name: string;
  organization_id?: string;
  organization_name?: string;
  current_balance: DecimalString;
  daily_spent: DecimalString;
  daily_limit: DecimalString;
  pending_verification_count: number;
  pending_verification_amount: DecimalString;
}

export interface PettyCashCardData {
  total_balance: DecimalString;
  pending_verification_count: number;
  pending_verification_amount: DecimalString;
  outlets: PettyCashOutletRow[];
}

// 8. Outlet Ops Status
export interface OutletOpsStatusRow {
  outlet_id: string;
  outlet_name: string;
  organization_id?: string;
  organization_name?: string;
  sync_status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  last_sync_time: string;
  last_sync_mins_ago: number;
  eod_status: 'completed' | 'in_progress' | 'pending';
}

export interface OutletOpsStatusCardData {
  online_count: number;
  total_outlets: number;
  outlets: OutletOpsStatusRow[];
}

// 9. Outlet EOD Status (Owner & HQ Admin)
export interface OutletEodStatusRow {
  outlet_id: string;
  outlet_name: string;
  organization_id?: string;
  organization_name?: string;
  eod_status: 'completed' | 'pending';
  cash_drawer_counted: boolean;
  sales_synced: boolean;
  waste_recorded: boolean;
  completed_at?: string;
  completed_by_name?: string;
}

export interface OutletEodStatusCardData {
  business_date: string;
  completed_count: number;
  total_count: number;
  outlets: OutletEodStatusRow[];
}

// 10. Payment Reconciliation (Finance)
export interface PaymentReconciliationCardData {
  erp_non_cash_total: DecimalString;
  midtrans_settlement_total: DecimalString;
  discrepancy_amount: DecimalString;
  status: 'matched' | 'discrepancy';
  settlement_date: string;
  unsettled_transactions_count: number;
}

// 11. True-Up Pending (Finance)
export interface TrueUpPendingItem {
  id: string;
  receipt_number: string;
  supplier_name: string;
  outlet_name: string;
  provisional_total: DecimalString;
  age_days: number;
}

export interface TrueUpPendingCardData {
  pending_invoices_count: number;
  provisional_total_value: DecimalString;
  items: TrueUpPendingItem[];
}

// 12. Store Manager: Stock Below Minimum
export interface SmStockMinItem {
  item_id: string;
  item_name: string;
  current_stock: DecimalString;
  min_stock: DecimalString;
  unit: string;
  est_days: DecimalString;
  severity: 'danger' | 'warning';
}

export interface SmStockMinCardData {
  outlet_id: string;
  outlet_name: string;
  items: SmStockMinItem[];
}

// 13. Store Manager: Count Schedule
export interface SmCountScheduleCardData {
  outlet_id: string;
  next_count_date: string;
  is_overdue: boolean;
  overdue_days: number;
  scope: 'all' | 'category' | 'critical';
  status_label: string;
}

// 14. Store Manager: Petty Cash
export interface SmPettyCashCardData {
  outlet_id: string;
  current_balance: DecimalString;
  daily_spent: DecimalString;
  daily_limit: DecimalString;
  spent_pct: DecimalString;
  remaining_today: DecimalString;
}

// 15. Store Manager: Menu Proposals
export interface SmProposalsItem {
  id: string;
  recipe_name: string;
  status: 'draft' | 'submitted' | 'revision_needed' | 'approved';
  feedback?: string;
  updated_at: string;
}

export interface SmProposalsCardData {
  outlet_id: string;
  items: SmProposalsItem[];
}

// 16. Store Manager: EOD Status
export interface SmEodChecklistItem {
  key: 'cash_drawer' | 'sales_synced' | 'waste_recorded';
  label: string;
  done: boolean;
  details?: string;
}

export interface SmEodStatusCardData {
  outlet_id: string;
  outlet_name: string;
  business_date: string;
  is_completed: boolean;
  completed_at?: string;
  checklist: SmEodChecklistItem[];
  can_complete: boolean;
}

// EOD Mutation Request
export interface CompleteEodRequest {
  outlet_id: string;
  business_date: string;
  cash_drawer_counted: boolean;
  waste_recorded: boolean;
  notes?: string;
}



