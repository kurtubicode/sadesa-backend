# Arsitektur Sistem SADESA

Dokumen ini menjelaskan desain sistem, keputusan teknis, dan alur data pada proyek SADESA.

---

## Gambaran Sistem

SADESA menggunakan arsitektur **monorepo dual-client**: satu backend melayani dua jenis klien — panel admin web dan aplikasi mobile warga.

```
┌─────────────────────────────────────────────────────────────┐
│                         SADESA                              │
│                                                             │
│   ┌──────────────┐              ┌──────────────────────┐    │
│   │  Admin Web   │              │   Aplikasi Mobile    │    │
│   │  (Browser)   │              │   (Android / iOS)    │    │
│   │              │              │                      │    │
│   │  React +     │              │  React Native +      │    │
│   │  Inertia.js  │              │  Expo Router         │    │
│   └──────┬───────┘              └──────────┬───────────┘    │
│          │ HTTP (Session)                  │ HTTP (Token)    │
│          │                                 │                 │
│   ┌──────▼─────────────────────────────────▼───────────┐    │
│   │                    BACKEND                          │    │
│   │                  Laravel 11                        │    │
│   │                                                    │    │
│   │   ┌─────────────┐      ┌───────────────────────┐  │    │
│   │   │  Web Routes  │      │      API Routes        │  │    │
│   │   │  (Inertia)  │      │   /api/* (Sanctum)    │  │    │
│   │   │  Fortify    │      │                       │  │    │
│   │   └──────┬──────┘      └──────────┬────────────┘  │    │
│   │          │                        │                │    │
│   │   ┌──────▼────────────────────────▼────────────┐  │    │
│   │   │              Controllers                    │  │    │
│   │   │         Models (Eloquent ORM)               │  │    │
│   │   └─────────────────────┬──────────────────────┘  │    │
│   │                         │                          │    │
│   │                  ┌──────▼──────┐                   │    │
│   │                  │    MySQL    │                   │    │
│   │                  │  Database  │                   │    │
│   │                  └────────────┘                   │    │
│   └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen Utama

### Backend (Laravel 11)

Backend menjalankan dua peran sekaligus:

**1. Web Application (Admin Panel)**
- Menggunakan **Inertia.js** sebagai jembatan antara Laravel dan React
- Laravel tidak mengembalikan JSON untuk halaman web — ia merender HTML dengan data terhidrasi di dalamnya
- React berjalan di browser sebagai SPA (Single Page App), navigasi tanpa full page reload
- Autentikasi via **Laravel Fortify** (session-based, cookie)

**2. REST API (untuk Mobile)**
- Route terpisah di `routes/api.php` dengan prefix `/api`
- Autentikasi via **Laravel Sanctum** (token-based)
- Mengembalikan JSON murni

### Mobile (React Native + Expo)

- Dibangun dengan **Expo** untuk kemudahan development dan distribusi
- Routing menggunakan **Expo Router** (file-based, mirip Next.js)
- Komunikasi ke backend via **Axios** (HTTP client)
- Token disimpan dengan **Expo SecureStore** (enkripsi OS-level, aman dari akses app lain)

---

## Database

### Skema Tabel

```
users
├── id (PK)
├── name
├── email (unique)
├── email_verified_at
├── password (hashed bcrypt)
├── two_factor_secret (nullable)
├── two_factor_recovery_codes (nullable)
├── two_factor_confirmed_at (nullable)
├── remember_token
├── created_at
└── updated_at

personal_access_tokens          ← token Sanctum untuk mobile
├── id (PK)
├── tokenable_id (FK → users.id)
├── tokenable_type
├── name
├── token (unique, 64 chars)
├── abilities
├── last_used_at
├── expires_at
├── created_at
└── updated_at

password_reset_tokens
├── email (PK)
├── token
└── created_at

sessions                        ← session web admin
├── id (PK)
├── user_id (FK, nullable)
├── ip_address
├── user_agent
├── payload
└── last_activity
```

---

## Alur Autentikasi

### Web Admin (Fortify + Session)

```
Browser → POST /login (email, password)
        → Fortify validasi kredensial
        → Buat session → Set cookie
        → Redirect ke /dashboard
        → Setiap request berikutnya: cookie dikirim otomatis
```

Fitur tambahan yang aktif:
- Two-factor authentication (TOTP)
- Email verification
- Password reset via email
- Rate limiting: 5 percobaan/menit per IP+email

### Mobile (Sanctum + Token)

```
App dibuka
  → Cek SecureStore["sadesa_user_token"]
  → Token ada? → Langsung ke halaman utama
  → Token tidak ada? → Tampilkan halaman login

Login:
  → POST /api/login {email, password}
  → Server buat personal_access_token
  → Kembalikan token dalam response
  → Simpan di SecureStore["sadesa_user_token"]
  → Navigasi ke /(tabs)

Request terautentikasi:
  → Header: Authorization: Bearer <token>
  → Sanctum validasi token dari DB
  → Lanjutkan request

Logout:
  → Hapus token dari SecureStore
  → (TODO: Revoke token di server via POST /api/logout)
  → Navigasi ke halaman login
```

---

## Keputusan Teknis

### Mengapa Inertia.js (bukan SPA terpisah)?

**Konteks:** Panel admin perlu halaman yang kompleks (form, tabel, navigasi) dengan data dari database.

**Keputusan:** Gunakan Inertia.js alih-alih membangun API JSON terpisah untuk web admin.

**Alasan:**
- Tidak perlu membangun dan maintain dua layer (API + frontend) untuk panel admin
- Server-side validation Laravel tetap bisa digunakan langsung
- Routing, auth middleware, dan session Laravel berfungsi seperti biasa
- React tetap bisa digunakan untuk UI interaktif

**Trade-off:** Admin panel tidak bisa diakses sebagai pure SPA dari domain berbeda.

---

### Mengapa Sanctum (bukan JWT) untuk Mobile?

**Konteks:** Aplikasi mobile perlu autentikasi yang aman dan mudah di-manage.

**Keputusan:** Gunakan Laravel Sanctum dengan database tokens.

**Alasan:**
- Token tersimpan di database — bisa di-revoke kapan saja (logout dari server)
- Tidak perlu refresh token — token tidak expired secara default
- Built-in di Laravel, tidak perlu library tambahan
- Cocok untuk aplikasi dengan user base kecil-menengah

**Trade-off:** Setiap request melakukan query DB untuk validasi token (vs JWT yang stateless). Dapat dimitigasi dengan caching di masa depan.

---

### Mengapa Monorepo?

**Keputusan:** Backend dan mobile disimpan dalam satu repositori.

**Alasan:**
- Perubahan API dan mobile bisa di-commit bersamaan
- Lebih mudah untuk developer yang mengerjakan keduanya
- Satu PR bisa mencakup perubahan end-to-end

**Trade-off:** Repo menjadi lebih besar; tim besar mungkin lebih nyaman dengan multi-repo.

---

## Middleware & Request Lifecycle

### Web Request

```
HTTP Request
  → EncryptCookies (kecuali appearance, sidebar_state)
  → HandleAppearance (baca cookie tema, set ke view)
  → HandleInertiaRequests (inject auth.user, app.name ke semua halaman)
  → Auth middleware (redirect ke login jika belum auth)
  → Controller
  → Inertia::render() → JSON response (Inertia) / HTML (first load)
```

### API Request

```
HTTP Request ke /api/*
  → Sanctum middleware (validasi Bearer token)
  → Controller
  → Response JSON
```

---

## Konfigurasi Environment Penting

| Variable | Deskripsi | Nilai Dev | Catatan |
|----------|-----------|-----------|---------|
| `APP_ENV` | Mode aplikasi | `local` | Set `production` saat deploy |
| `APP_DEBUG` | Tampilkan error detail | `true` | **Wajib `false` di production** |
| `DB_CONNECTION` | Driver database | `sqlite` / `mysql` | Gunakan mysql untuk production |
| `SESSION_DRIVER` | Penyimpanan session | `database` | — |
| `BCRYPT_ROUNDS` | Kekuatan hash password | `12` | Naikkan ke 14+ di production |

**Catatan keamanan:** Di production, `APP_DEBUG=false` wajib — jika `true`, stack trace dan konfigurasi server bisa terekspos ke publik.

---

## Area Pengembangan Selanjutnya

### Sudah Diselesaikan

- ✅ **Environment variable untuk API URL** — Base URL dibaca dari `EXPO_PUBLIC_API_URL` di `.env`. Salin `.env.example` ke `.env` dan isi dengan IP lokal.
- ✅ **Logout me-revoke token di server** — `POST /api/logout` (auth:sanctum) menghapus token dari DB. Mobile memanggil endpoint ini sebelum menghapus token lokal; jika server tidak bisa dihubungi, logout lokal tetap berjalan.
- ✅ **Centralized Axios instance** — `mobile/lib/api.ts` menjadi satu-satunya tempat konfigurasi base URL dan interceptor Authorization. Semua screen menggunakan `import api from "@/lib/api"`.

### Fitur Mendatang

- Dashboard informasi warga (pengumuman, kegiatan desa)
- Layanan pengajuan surat (RT, domisili, keterangan usaha, dll.)
- Notifikasi push (status pengajuan surat)
- Role-based access (Admin, Petugas, Warga)
