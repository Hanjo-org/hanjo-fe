/**
 * Katalog Pesan Validasi Standar Bahasa Indonesia
 * Referensi: MILESTONE.md §T-00.11
 */

export const ValidationMessages = {
	required: (field: string = 'Kolom ini') => `${field} wajib diisi`,
	minLength: (field: string, min: number) => `${field} minimal ${min} karakter`,
	maxLength: (field: string, max: number) => `${field} maksimal ${max} karakter`,
	email: () => 'Format alamat email tidak valid',
	number: (field: string = 'Nilai') => `${field} harus berupa angka yang valid`,
	positive: (field: string = 'Nilai') => `${field} harus bernilai lebih besar dari 0`,
	min: (field: string, min: number) => `${field} tidak boleh kurang dari ${min}`,
	max: (field: string, max: number) => `${field} tidak boleh melebihi ${max}`,
	decimalString: (field: string = 'Nilai') => `${field} harus berupa format angka desimal yang valid`,
	date: (field: string = 'Tanggal') => `${field} harus berupa format tanggal yang valid (YYYY-MM-DD)`,
	futureDate: (field: string = 'Tanggal') => `${field} tidak boleh berupa tanggal di masa lalu`,
	fileTooLarge: (maxMb: number = 5) => `Ukuran berkas melebihi batas maksimal ${maxMb} MB`,
	fileInvalidType: (allowed: string[]) => `Format berkas tidak diizinkan. Gunakan: ${allowed.join(', ')}`,
	stepUpPassword: () => 'Kata sandi atau PIN step-up wajib diisi',
	invalidDeviationReason: () => 'Alasan wajib diisi jika deviasi harga melebihi 10%'
};
