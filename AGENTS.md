# Antigravity Agent Guidelines: Hanjo Frontend (SvelteKit 5)

> **Cakupan Proyek**: `frontend/` (SvelteKit 5, TypeScript, Vanilla CSS)  
> **Dokumen Referensi Utama**: [`docs/MILESTONE.md`](file:///c:/PROJECT/WEBSITE/hanjo/frontend/docs/MILESTONE.md) & [`docs/milestones/README.md`](file:///c:/PROJECT/WEBSITE/hanjo/frontend/docs/milestones/README.md)  
> **Prinsip Inti**: Domain-Driven Design (DDD), Clean Architecture, Component-First, UI Buta Sumber Data, Mock-to-Real Parity.

---

## 1. Golden Rules (Aturan Utama Tanpa Pengecualian)

1. **UI Buta Sumber Data (Prinsip P1 & P2)**:
   - Komponen UI (`features/*`, `routes/*`, `ui/*`) **TIDAK BOLEH** mengetahui dari mana data berasal.
   - **DILARANG KERAS** memanggil `fetch()` langsung dari dalam file `.svelte`.
   - Seluruh interaksi data **WAJIB** melalui alur:  
     `UI Component -> Domain Service -> ApiClient -> DataDriver (MockDriver / HttpDriver)`.
   - Mengubah `PUBLIC_DATA_SOURCE=api` atau `mock` hanya mengganti driver, tidak mengubah satu baris pun kode tampilan.

2. **Pemisahan Logika dari File `.svelte` (Separation of Concerns)**:
   - File `.svelte` **HANYA BERFOKUS PADA PRESENTASI** (tata letak, template markup, visual rendering, binding input, dan visual toggle lokal).
   - Seluruh logika bisnis, manipulasi data, kalkulasi, orkestrasi service, dan state management kompleks **WAJIB dibuat di file `.ts` atau `.svelte.ts` terpisah**:
     - Logika kalkulasi bisnis murni → `src/lib/domain/*.ts`
     - Pemanggilan API & orkestrasi → `src/lib/services/*.service.ts`
     - State reaktif & form handler fitur → `src/lib/features/<modul>/stores/*.svelte.ts`
   - **DILARANG KERAS** menumpuk ratusan baris fungsi algoritma, pemrosesan data, atau state machine langsung di dalam tag `<script>` file `.svelte`. File `.svelte` harus tetap tipis, bersih, dan mudah dibaca.

3. **Arsitektur Component-First & Anti-Duplikasi UI**:
   - **Cek Komponen Terlebih Dahulu**: Sebelum membuat halaman, view, drawer, modal, atau elemen visual baru, **WAJIB periksa terlebih dahulu komponen yang sudah ada di `src/lib/ui/`** (seperti `Button`, `Input`, `Select`, `Combobox`, `Table`, `StatCard`, `StatusBadge`, `Modal`, `ProgressBar`, dll.).
   - **Wajib Digunakan Ulang (Reuse)**: Jika komponen sudah ada, **WAJIB REUSE**. Dilarang membuat duplikasi markup HTML dan styling baru untuk fungsi yang sama.
   - **Buat Komponen Baru Jika Belum Ada**: Jika belum ada komponen yang memenuhi kebutuhan, **WAJIB buat komponen reusable baru di `src/lib/ui/` terlebih dahulu**, lengkapi dengan tipe props TypeScript dan styling token desain baku, baru kemudian digunakan pada halaman/fitur.

4. **Pemisahan Style & Tailwind CSS v4 sebagai Base**:
   - **Tailwind CSS v4 sebagai Base**: Gunakan utility classes Tailwind v4 untuk tata letak (*layout*), *flexbox/grid*, *spacing*, *sizing*, dan tipografi dasar.
   - **Pemisahan Berkas Style (Style Separation)**:
     - **DILARANG KERAS** menumpuk ratusan atau ribuan baris CSS mentah langsung di tag `<style>` pada file `+layout.svelte` atau `+page.svelte`.
     - Styling custom, animasi khusus, atau stylesheet tata letak kompleks **WAJIB disendirikan** ke dalam berkas `.css` terpisah (misalnya `layout.css` atau file CSS modular per komponen).
     - Token desain terpusat (warna brand Emerald, status semantik, latar belakang) dikelola secara terpusat di `src/app.css` menggunakan `@theme` / CSS variables.

5. **Aturan Batas Modul Bersih (§3.6)**:
   - `features/*` dan `ui/*` **DILARANG** mengimpor berkas apa pun dari `api/drivers/*`.
   - `domain/*` adalah logika murni (*pure business logic*, bebas I/O). **DILARANG** mengimpor dari `api/`, `features/`, atau `ui/`.
   - Mock handler boleh memakai `domain/*`; Service dan UI boleh memakai fungsi murni `domain/*` untuk kalkulasi lokal/pratinjau, namun **angka resmi tetap berasal dari server/mock**.

6. **Waktu Deterministik (§5 & Aturan Kerja 4)**:
   - **DILARANG** memanggil `new Date()` atau `Date.now()` secara langsung di dalam logika bisnis atau mock handler.
   - Gunakan selalu `clock.now()`, `clock.nowIso()`, dan `clock.businessDate()` dari `#lib/api/drivers/mock/engine/clock.js`.
   - Hari bisnis dihitung pada zona waktu **Asia/Jakarta (WIB, UTC+7)** dengan format `YYYY-MM-DD`.

7. **Presisi Finansial & String Desimal (§4.2)**:
   - Uang dan jumlah kuantitas pada batas API **selalu dikirim sebagai string desimal** (mis. `"25000.0000"`).
   - Dilarang melakukan operasi aritmatika uang dengan tipe `number` float biasa. Gunakan pustaka `decimal.js` atau utilitas `#lib/utils/format.js`.

8. **4 Keadaan Layar Wajib (Mandatory Screen States §6)**:
   Setiap komponen atau halaman pemuat data **wajib** mengimplementasikan 4 status tampilan:
   - **Memuat (Loading)**: Tampilkan skeleton shimmer (`<Skeleton />`), bukan spinner kosong.
   - **Kosong (Empty)**: Tampilkan pesan informatif + tombol ajakan bertindak (*CTA*).
   - **Galat (Error)**: Tampilkan pesan kesalahan ramah pengguna + tombol Coba Lagi (*Retry*).
   - **Tidak Berhak (403 / Forbidden)**: Tampilkan layar akses ditolak jika `can()` bernilai false.

9. **Otorisasi & Scope Terpusat (§7 & Prinsip P5)**:
   - **Dilarang** hardcode peran di komponen (mis. `if (user.role === 'store_manager')`).
   - Gunakan fungsi izin terpusat: `can(action, resource, outlet_id?)` dari `#lib/auth/can.js`.
   - Store Manager dibatasi secara ketat hanya pada outlet tugasnya (`404 not_found` jika mencoba membuka data outlet lain).

10. **Invarian Tema Ganda & Anti-Sticker Putih (Light & Dark Mode Parity)**:
   - **DILARANG KERAS** menggunakan warna statis/heksadesimal mentah atau class utility Tailwind statis untuk latar belakang, border, dan teks (seperti `#ffffff`, `#fff`, `#f8fafc`, `#f1f5f9`, `bg-white`, `bg-slate-50`, `bg-slate-100`, `text-slate-900`, `text-slate-800`, `text-slate-700`).
   - Warna latar belakang terang yang di-hardcode menimbulkan efek cacat visual berupa **"sticker putih" (white patches)** di Dark Mode dan menyebabkan teks bertabrakan (*unreadable contrast/white-on-white*).
   - **DILARANG KERAS** memberi pseudo-state hover atau active dengan warna putih (misal `:hover { background: #ffffff; }` atau `hover:bg-white`), karena kartu di Dark Mode akan langsung menjadi blok putih menyilaukan saat kursor melintas.
   - **WAJIB** menggunakan CSS Design Tokens terpusat dari `src/app.css`:
     - **Latar Belakang Panel Utama**: `var(--bg-panel)`
     - **Sub-Container / Item Baris / Sub-Grid / Tabel**: `var(--bg-panel-sub)`
     - **Interaksi Hover / Active**: `var(--bg-panel-hover)` (aktif: `var(--bg-panel-active)`)
     - **Garis Batas (Borders)**: `var(--border-panel)` (utama) dan `var(--border-subtle)` (pembatas item dalam)
     - **Fokus Garis Batas**: `var(--border-focus)`
     - **Tipografi**:
       - Judul & Nilai Metrik: `var(--text-main)` (otomatis putih di dark, slate gelap di light)
       - Subtitle & Label: `var(--text-muted)`
       - Caption, Timestamp & Monospace ID: `var(--text-subtle)`
     - **Banner & Status Callout**:
       - Warning: `var(--pill-warning-bg)`, `var(--pill-warning-border)`, `var(--pill-warning-text)`
       - Success: `var(--pill-success-bg)`, `var(--pill-success-border)`, `var(--pill-success-text)`
       - Danger: `var(--pill-danger-bg)`, `var(--pill-danger-border)`, `var(--pill-danger-text)`
       - Info: `var(--pill-info-bg)`, `var(--pill-info-border)`, `var(--pill-info-text)`
   - **Prosedur Audit Tema Wajib (Visual Theme Audit Protocol)**:
     Setiap pembuatan atau pembaruan komponen UI **WAJIB diuji dan diverifikasi secara visual pada KEDUA mode tema** (`data-theme="light"` dan `data-theme="dark"`). Jangan pernah menyelesaikan task sebelum memastikan tidak ada "sticker putih" di mode gelap dan tidak ada teks pudar di mode terang.

11. **Larangan Keras Emoticon/Emoji & Kewajiban Heroicons SVG**:
   - **DILARANG KERAS** menggunakan karakter emoji/emoticon Unicode (seperti ⚡, 📈, 💰, 🏢, ⚠️, 📑, 📡, 🌙, 💳, 🪙, 📋, 💡, 🧾, 🎉, ℹ️, ☕, dll.) pada seluruh antarmuka ERP Hanjo.
   - Karakter emoji Unicode tampak amatir, tidak konsisten antar sistem operasi (tampilan rendering di Windows, macOS, Android, iOS, dan Linux berbeda drastis), tidak dapat diatur ketebalan garisnya (*stroke weight*), dan tidak mengikuti sistem warna tema.
   - **WAJIB** menggunakan icon SVG berbasis standar **Heroicons** (24x24 outline dengan `stroke-width="1.8"` atau `2`, atau 20x20 solid) yang bersih, profesional, elegan, dan proporsional.
   - Gunakan komponen terpusat `<Icon name="..." size={...} class="..." />` dari `#lib/components/ui/Icon.svelte` atau `#lib/ui/Icon.svelte`.
   - Seluruh icon wajib mewarisi warna secara dinamis menggunakan `stroke="currentColor"` atau `fill="currentColor"` agar otomatis selaras dengan token semantik (`var(--brand-primary)`, `var(--text-muted)`, status badges, dll.).

---

## 2. Struktur Folder Baku (`frontend/src/lib/`)

```
src/lib/
├── api/
│   ├── contract/          # Tipe DTO, skema validasi, kode galat, registry endpoints
│   ├── client.ts          # ApiClient singleton, driver resolver dinamis, retry GET
│   └── drivers/
│       ├── http/          # Driver fetch riil + token + If-Match + Idempotency-Key
│       └── mock/
│           ├── engine/    # DB in-memory, tx rollback, router, clock, event bus, persist
│           ├── handlers/  # Mock route handlers per bounded context (org, catalog, inv, dll)
│           └── driver.ts  # MockDriver implementasi DataDriver
├── domain/                # Logika bisnis murni / formula bebas I/O (pricing, recipe, HPP, True-Up)
├── services/              # Satu berkas per domain, memanggil API (catalog.service.ts, dll)
├── auth/                  # Sesi Svelte 5, can() permission engine, scope outlet checker
├── config/                # Feature flags, konfigurasi navigasi deklaratif, kamus status
├── ui/                    # Kit komponen UI reusable (forms, data, feedback, navigation, layout)
│   ├── forms/             # Button, Input, NumberInput, Select, Combobox, DatePicker, dll
│   ├── data/              # Table, StatCard, StatusBadge, Timeline, DiffViewer, Chart, FilterBar
│   ├── feedback/          # Toast, Skeleton, EmptyState, ErrorState, ConfirmDialog, StepUpDialog
│   ├── navigation/        # Tabs, Breadcrumb, Drawer, CommandPalette
│   └── layout/            # PageHeader, Shell, Sidebar, Header
├── features/<modul>/      # Tampilan spesifik fitur, dialog alur kerja, & store lokal
│   ├── components/        # Sub-komponen spesifik hanya untuk modul ini
│   └── stores/            # Logic state terpisah (*.svelte.ts), TIDAK di dalam .svelte
└── utils/                 # formatRupiah, formatDateWIB, desimal, konversi satuan
```

---

## 3. Konvensi Svelte 5 (Runes) & Styling

Gunakan fitur modern **Svelte 5 Runes** untuk keterbacaan dan reaktivitas eksplisit:
- **State**: Gunakan `let count = $state(0);` atau `let items = $state<Item[]>([]);`
- **Derived**: Gunakan `let total = $derived(price * qty);`
- **Props**: Gunakan destructuring `$props`:  
  `let { title, isOpen = $bindable(false), onclose }: Props = $props();`
- **Snippet**: Gunakan `{#snippet header()} ... {/snippet}` menggantikan `<slot />`.
- **Tema Desain (Light & Dark Mode Parity)**: Sistem mendukung mode Gelap dan Terang secara dinamis via atribut `data-theme`. Kontras teks minimum 4.5:1 (WCAG AA). Hindari warna generik ad-hoc atau class statis (`bg-white`), selalu gunakan token CSS variables terpusat yang otomatis beradaptasi saat tema berganti.

---

## 4. Alur Kerja Eksekusi Milestone (Standar Pengembangan)

Setiap kali mengerjakan sub-fase atau tugas dari `docs/milestones/MS-xx.md`:
1. **Periksa Kontrak**: Pastikan endpoint terdaftar di `api/contract/endpoints.ts` dan tipe ada di `types.ts`.
2. **Domain Logic Murni**: Tulis kalkulasi bisnis (rumus) di `domain/*.ts` lengkap dengan unit test vektor uji.
3. **Mock Handler**: Implementasikan simulasi backend di `api/drivers/mock/handlers/<domain>.ts`.
4. **Service & State Logic Terpisah**:
   - Buat method pemanggil API di `services/<domain>.service.ts`.
   - Buat state controller & handler reaktif di `features/<domain>/stores/<name>.svelte.ts` (terpisah dari `.svelte`).
5. **Cek Komponen Terlebih Dahulu (Component-First)**:
   - Periksa `src/lib/ui/`.
   - Jika butuh elemen input/data baru, buat komponen reusable di `src/lib/ui/` terlebih dahulu.
6. **Susun Tampilan `.svelte`**:
   - Rakit tampilan halaman dengan mengimpor reusable component dari `ui/` dan state dari `stores/*.svelte.ts`.
   - Terapkan **4 state wajib**: Loading (Skeleton), Empty, Error (+ Retry), dan 403 Forbidden.
7. **Verifikasi Kualitas**: Jalankan `npm run check` (harus 0 errors, 0 warnings).
8. **Perbarui Checklist**: Centang `- [x]` tugas terkait di [`docs/milestones/MS-xx.md`](file:///c:/PROJECT/WEBSITE/hanjo/frontend/docs/milestones/).
