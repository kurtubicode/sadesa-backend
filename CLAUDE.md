# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Gambaran Proyek

**SADESA** (Sahabat Digital Desa) adalah platform digital terpadu untuk pelayanan warga Desa Cirangkong. Monorepo dua bagian:

- `backend/` — Laravel 12 + Inertia.js + React (TypeScript) + Tailwind CSS v4. Menyajikan **web dashboard** untuk admin/staff/kepala desa, sekaligus **REST API** untuk aplikasi mobile.
- `mobile/` — Expo SDK 54 + React Native. Aplikasi Android/iOS khusus warga.

---

## Perintah Umum

### Backend (`backend/`)

```bash
# Install dependensi
composer install
npm install

# Dev server (Laravel + Vite HMR)
php artisan serve          # http://localhost:8000
npm run dev                # Vite dev server (jalankan bersamaan)

# Build produksi
npm run build

# Migrasi & seeding
php artisan migrate
php artisan db:seed

# Satu test
php artisan test --filter NamaTest

# Semua test
php artisan test

# Linting PHP (Laravel Pint)
./vendor/bin/pint

# Format TypeScript/TSX
npx tsc --noEmit            # type-check saja, tanpa emit
```

### Mobile (`mobile/`)

```bash
# Install
npm install

# Dev (Expo Go)
npx expo start

# Build static (untuk verifikasi web bundle)
npx expo export

# Lint
npx eslint .
```

---

## Konfigurasi Wajib

### Backend — `.env`
Salin `.env.example` → `.env`, lalu isi:
```
DB_DATABASE=sadesa
APP_URL=http://localhost:8000
```

### Mobile — `.env`
```
EXPO_PUBLIC_API_URL=http://<IP_LOKAL>:8000
```
Gunakan IP LAN (bukan `localhost`) agar device fisik/emulator bisa menjangkau backend. Cek dengan `ipconfig` (Windows).

---

## Arsitektur Backend

### Auth & Role
- **Web**: Laravel Fortify (session + cookie). Middleware `auth` + `verified`.
- **API**: Laravel Sanctum Bearer token. `auth:sanctum` middleware.
- **Role** dikendalikan `RoleMiddleware` — nilai: `admin`, `staff`, `kepala_desa`, `warga`.
- Warga dengan status `menunggu_verifikasi` hanya bisa akses rute verifikasi dokumen.

### Struktur Controller

```
app/Http/Controllers/
  Admin/          — AdminUserController, AdminMasterSuratController, dll.
  Staff/          — StaffPengajuanController, StaffPengaduanController
  KepalaDesa/     — KepalaPengajuanController
  Warga/          — WargaDataDiriController
  Api/            — Semua controller REST API mobile (PengajuanSuratController, PengaduanController, UlasanController, dll.)
  PantauAntreanController  — Publik, tanpa auth
  BukuTamuController       — Publik, tanpa auth
```

### Routes

| File | Cakupan |
|------|---------|
| `routes/web.php` | Semua Inertia page routes. Group per role: `admin.`, `staff.`, `kepala-desa.`, `warga.` |
| `routes/api.php` | REST API untuk mobile. Group: publik, `auth:sanctum`, per role |
| `routes/settings.php` | Fortify + profile settings |

### Alur Status Pengajuan Surat

```
menunggu → diproses → diverifikasi → menunggu_pengesahan → disetujui → siap_diambil → selesai
```

- Status `ditolak_staff`, `ditolak_kepala`, `dibatalkan` adalah terminal.
- Nomor pengajuan digenerate oleh `PengajuanSurat::generateNoPengajuan()` dengan format `ADM/YYYYMMDD/NNN`.

### Services & Utilities

- **`SuratService`** — generate PDF surat (`barryvdh/laravel-dompdf`). Mengambil data dari `Penduduk`, `User`, `AppSetting`, dan template blade di `resources/views/surat/`.
- **`AuditLog::catat($aksi, $model, $id)`** — helper static, dipanggil di setiap aksi penting controller.
- **Notifikasi** dikirim via `$user->notify(new XxxNotification(...))` — tersimpan di tabel `notifications` (Laravel standard) + tabel `notifikasi` custom.

### Frontend Web (Inertia + React)

- Layout utama: `AppLayout` → `app-sidebar-layout` → `AppSidebar`.
- `AppSidebar` memilih nav items berdasarkan `auth.user.role` dari Inertia shared props.
- Design tokens: `teal-600` (`#0d9488`) sebagai primary, sidebar dark navy `#0f1a2b`. Font: **Outfit** (Google Fonts).
- Komponen UI: shadcn/ui (`components/ui/`).
- Route helper: `@/routes` (Laravel Wayfinder auto-generated).
- QR code (buku tamu): `qrcode.react` (`QRCodeSVG`).

---

## Arsitektur Mobile

### Routing
Expo Router (file-based). Semua screen ada di `app/`:

```
app/
  (tabs)/          — Tab bar utama (home, status, layanan, profile)
  pengajuan/       — [id].tsx, buat.tsx, index.tsx
  pengaduan/       — [id].tsx, buat.tsx, index.tsx
  buku-tamu.tsx    — Form kunjungan + QR scanner
  informasi/       — List & detail artikel
  notifikasi.tsx
```

### API Client
`lib/api.ts` — Axios instance. `baseURL` dari `EXPO_PUBLIC_API_URL`. Interceptors:
- **Request**: attach Sanctum Bearer token dari `SecureStore` (native) atau `localStorage` (web).
- **Response**: auto-logout + redirect ke `/` pada 401.

### State Auth
Tersimpan di `SecureStore` dengan key `sadesa_user_token` dan `sadesa_user_data`. Tidak ada state management global (Redux/Zustand) — tiap screen fetch data sendiri via `useFocusEffect`.

### Native-only Modules
`react-native-maps` tidak bisa diimpor langsung karena Expo melakukan static rendering web. Selalu gunakan wrapper platform-specific:

```ts
// ✅ Benar
import { MapView, Marker } from "@/components/native-map";

// ❌ Salah — akan error saat expo export
import MapView, { Marker } from "react-native-maps";
```

File `components/native-map.native.tsx` → re-export nyata.
File `components/native-map.tsx` → stub null untuk web.

### Design Tokens
`constants/theme.ts` — `COLORS`, `FONT`, `RADIUS`, `SHADOW`, `SPACING`. Primary mobile: `#0050A7` (biru, berbeda dari dashboard web yang teal).

---

## Hal-hal Non-obvious

- **`data_formulir`** di `PengajuanSurat` adalah JSON column. Key `keperluan` diisi saat pengajuan offline (loket). Key `keterangan` untuk pengajuan mandiri warga.
- **Pelayanan Loket** (`/staff/loket`) membuat pengajuan atas nama warga dengan status langsung `diproses` (skip `menunggu`) karena staff sudah hadir fisik.
- **QR Buku Tamu**: Admin generate 1 QR statis dengan payload `{"type":"buku-tamu","venue":"..."}`. Mobile validasi field `type` setelah scan.
- **Koordinat Pengaduan**: `latitude` dan `longitude` nullable decimal di tabel `pengaduan`. Dikirim mobile via `FormData` jika warga memilih titik peta.
- **Pantau Antrean** (`/antrean`) adalah halaman publik tanpa auth — bisa ditampilkan di layar loket.
- **`AppSetting::allAsArray()`** mengambil konfigurasi desa (nama desa, kop surat, TTD kades) dari tabel `app_settings`, dipakai `SuratService` saat generate PDF.
- Migrations di-prefix dengan timestamp `2026_05_08_000xxx` untuk urutan deterministik.
