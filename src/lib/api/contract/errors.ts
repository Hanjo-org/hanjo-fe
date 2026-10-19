/**
 * Kode Galat Baku
 * Referensi: MILESTONE.md §4.7
 *
 * Dipakai oleh mock driver (untuk menghasilkan galat)
 * dan client (untuk menangani galat).
 */

import type { ErrorEnvelope, ValidationDetail } from './types.js';

// ---------------------------------------------------------------------------
// Kode galat sebagai konstanta
// ---------------------------------------------------------------------------

export const ErrorCode = {
  /** 401 — Sesi tidak ada/kedaluwarsa */
  UNAUTHENTICATED: 'unauthenticated',
  /** 403 — Peran tidak punya izin */
  FORBIDDEN: 'forbidden',
  /** 403 — Fitur dimatikan */
  FEATURE_DISABLED: 'feature_disabled',
  /** 403 — Aksi butuh step-up auth */
  STEP_UP_REQUIRED: 'step_up_required',
  /** 403 — Pembuat tidak bisa menyetujui sendiri */
  SELF_APPROVAL: 'self_approval',
  /** 404 — Tidak ada, atau di luar scope outlet pengguna */
  NOT_FOUND: 'not_found',
  /** 409 — Versi tidak cocok / status tidak valid / referensi masih dipakai */
  CONFLICT: 'conflict',
  /** 409 — Versi dokumen tidak cocok (optimistic locking) */
  VERSION_MISMATCH: 'version_mismatch',
  /** 409 — Posting ke periode tertutup */
  PERIOD_CLOSED: 'period_closed',
  /** 422 — Isian tidak valid */
  VALIDATION_ERROR: 'validation_error',
  /** 422 — Aksi butuh persetujuan lebih dulu */
  APPROVAL_REQUIRED: 'approval_required',
  /** 422 — Melewati batas */
  LIMIT_EXCEEDED: 'limit_exceeded',
  /** 422 — Saldo tidak cukup */
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  /** 429 — Pembatasan laju */
  RATE_LIMITED: 'rate_limited',
  /** 500 — Galat tak terduga */
  SERVER_ERROR: 'server_error',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------------------------------------------------------------------------
// Peta HTTP status per kode galat
// ---------------------------------------------------------------------------

const ERROR_STATUS_MAP: Record<ErrorCodeType, number> = {
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.FEATURE_DISABLED]: 403,
  [ErrorCode.STEP_UP_REQUIRED]: 403,
  [ErrorCode.SELF_APPROVAL]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VERSION_MISMATCH]: 409,
  [ErrorCode.PERIOD_CLOSED]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.APPROVAL_REQUIRED]: 422,
  [ErrorCode.LIMIT_EXCEEDED]: 422,
  [ErrorCode.INSUFFICIENT_BALANCE]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.SERVER_ERROR]: 500,
};

/** Ambil HTTP status dari kode galat */
export function getHttpStatus(code: ErrorCodeType): number {
  return ERROR_STATUS_MAP[code] ?? 500;
}

// ---------------------------------------------------------------------------
// Helper pembuat ErrorEnvelope
// ---------------------------------------------------------------------------

/** Buat ErrorEnvelope standar */
export function createErrorEnvelope(
  code: ErrorCodeType,
  message: string,
  details?: ValidationDetail[],
  requestId?: string
): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
      ...(requestId ? { request_id: requestId } : {}),
    },
  };
}

/** Buat galat validasi dengan detail per field */
export function createValidationError(
  details: ValidationDetail[],
  message = 'Data tidak valid'
): ErrorEnvelope {
  return createErrorEnvelope(ErrorCode.VALIDATION_ERROR, message, details);
}

/** Buat galat "tidak ditemukan" */
export function createNotFoundError(resource = 'Data'): ErrorEnvelope {
  return createErrorEnvelope(ErrorCode.NOT_FOUND, `${resource} tidak ditemukan`);
}

/** Buat galat "tidak berhak" */
export function createForbiddenError(message = 'Anda tidak memiliki izin untuk aksi ini'): ErrorEnvelope {
  return createErrorEnvelope(ErrorCode.FORBIDDEN, message);
}

/** Buat galat "fitur dimatikan" */
export function createFeatureDisabledError(feature: string): ErrorEnvelope {
  return createErrorEnvelope(ErrorCode.FEATURE_DISABLED, `Fitur "${feature}" tidak aktif`);
}

/** Buat galat "konflik versi" */
export function createVersionMismatchError(): ErrorEnvelope {
  return createErrorEnvelope(
    ErrorCode.VERSION_MISMATCH,
    'Data telah diubah oleh pengguna lain. Muat ulang dan coba lagi.'
  );
}

/** Buat galat "periode tertutup" */
export function createPeriodClosedError(period: string): ErrorEnvelope {
  return createErrorEnvelope(
    ErrorCode.PERIOD_CLOSED,
    `Tidak dapat memposting ke periode ${period} yang sudah ditutup`
  );
}

/** Buat galat "butuh persetujuan" */
export function createApprovalRequiredError(
  tier: number,
  approverRoles: string[],
  ruleName: string
): ErrorEnvelope {
  return createErrorEnvelope(
    ErrorCode.APPROVAL_REQUIRED,
    `Aksi ini membutuhkan persetujuan tingkat ${tier}`,
    [
      {
        field: '_approval',
        code: 'required',
        message: `Penyetuju: ${approverRoles.join(', ')} (aturan: ${ruleName})`,
      },
    ]
  );
}

// ---------------------------------------------------------------------------
// Error class untuk dilempar di domain/service
// ---------------------------------------------------------------------------

/**
 * Error kelas yang bisa dilempar oleh handler/middleware mock
 * dan akan ditangkap oleh router untuk menghasilkan ApiResponse.
 */
export class ApiErrorException extends Error {
  readonly status: number;
  readonly code: ErrorCodeType;
  readonly envelope: ErrorEnvelope;

  constructor(code: ErrorCodeType, message: string, details?: ValidationDetail[]) {
    super(message);
    this.name = 'ApiErrorException';
    this.code = code;
    this.status = getHttpStatus(code);
    this.envelope = createErrorEnvelope(code, message, details);
  }
}

/** Alias untuk kesederhanaan */
export const AppError = ApiErrorException;
export type AppError = ApiErrorException;

/** Factory helpers ApiErrors.* */
export const ApiErrors = {
  unauthenticated: (msg = 'Sesi tidak ada atau kedaluwarsa') =>
    new ApiErrorException(ErrorCode.UNAUTHENTICATED, msg),
  forbidden: (msg = 'Anda tidak memiliki izin untuk aksi ini') =>
    new ApiErrorException(ErrorCode.FORBIDDEN, msg),
  featureDisabled: (feature: string) =>
    new ApiErrorException(ErrorCode.FEATURE_DISABLED, `Fitur "${feature}" tidak aktif`),
  stepUpRequired: (msg = 'Aksi ini memerlukan konfirmasi kata sandi (step-up)') =>
    new ApiErrorException(ErrorCode.STEP_UP_REQUIRED, msg),
  selfApproval: (msg = 'Pembuat dokumen tidak dapat menyetujui dokumennya sendiri') =>
    new ApiErrorException(ErrorCode.SELF_APPROVAL, msg),
  notFound: (msg = 'Data tidak ditemukan') =>
    new ApiErrorException(ErrorCode.NOT_FOUND, msg),
  conflict: (msg: string, details?: ValidationDetail[]) =>
    new ApiErrorException(ErrorCode.CONFLICT, msg, details),
  versionMismatch: (msg = 'Versi dokumen tidak cocok. Data telah diubah pihak lain.') =>
    new ApiErrorException(ErrorCode.VERSION_MISMATCH, msg),
  periodClosed: (period: string) =>
    new ApiErrorException(ErrorCode.PERIOD_CLOSED, `Tidak dapat memposting ke periode ${period} yang sudah ditutup`),
  validationError: (details: ValidationDetail[], msg = 'Data tidak valid') =>
    new ApiErrorException(ErrorCode.VALIDATION_ERROR, msg, details),
  approvalRequired: (tier: number, approverRoles: string[], ruleName: string) =>
    new ApiErrorException(
      ErrorCode.APPROVAL_REQUIRED,
      `Aksi ini membutuhkan persetujuan tingkat ${tier}`,
      [{ field: '_approval', code: 'required', message: `Penyetuju: ${approverRoles.join(', ')} (aturan: ${ruleName})` }]
    ),
  limitExceeded: (msg = 'Melewati batas yang diizinkan') =>
    new ApiErrorException(ErrorCode.LIMIT_EXCEEDED, msg),
  insufficientBalance: (msg = 'Saldo tidak mencukupi') =>
    new ApiErrorException(ErrorCode.INSUFFICIENT_BALANCE, msg),
  rateLimited: (msg = 'Terlalu banyak permintaan, coba lagi nanti') =>
    new ApiErrorException(ErrorCode.RATE_LIMITED, msg),
  serverError: (msg = 'Terjadi galat server yang tidak terduga') =>
    new ApiErrorException(ErrorCode.SERVER_ERROR, msg),
};
