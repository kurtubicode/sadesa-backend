# SADESA — Sahabat Digital Desa

Sistem informasi dan administrasi terpadu untuk pelayanan warga Desa Cirangkong. Dibangun dengan arsitektur monorepo yang memisahkan sistem backend (Admin Web & REST API) dan frontend (Aplikasi Mobile Warga).

## Struktur Repositori

| Direktori  | Teknologi                         | Deskripsi                                                              |
| :--------- | :-------------------------------- | :--------------------------------------------------------------------- |
| `/backend` | Laravel 11, Inertia.js, React     | Panel Admin berbasis web, skema database, dan REST API untuk mobile    |
| `/mobile`  | React Native, Expo Router         | Aplikasi Android/iOS untuk warga mengakses layanan desa                |
| `/docs`    | Markdown                          | Dokumentasi teknis lengkap (API, arsitektur, onboarding)               |

## Prasyarat

Pastikan semua tools berikut sudah terinstal:

- **PHP** >= 8.2 + **Composer**
- **Node.js** >= 20 + **npm**
- **MySQL** (via Laragon / XAMPP / Docker)
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** di HP / Android Emulator / iOS Simulator

## Instalasi & Setup

### 1. Clone Repositori

```bash
git clone <url-repo>
cd sadesa-project
```

### 2. Setup Backend (Laravel)

```bash
cd backend

# Install dependensi
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate
```

Edit file `.env` — sesuaikan konfigurasi database:

```env
APP_NAME=SADESA
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sadesa
DB_USERNAME=root
DB_PASSWORD=
```

```bash
# Buat database 'sadesa' terlebih dahulu, lalu jalankan migrasi
php artisan migrate

# Build asset frontend (admin panel)
npm run build

# Jalankan server (gunakan 0.0.0.0 agar bisa diakses dari HP/emulator)
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Setup Mobile (React Native)

```bash
cd mobile

# Install dependensi
npm install
```

Sebelum menjalankan aplikasi, update URL API di dua file berikut dengan IP lokal komputermu:

- [`app/index.tsx`](mobile/app/index.tsx) — endpoint login
- [`app/cekapi.tsx`](mobile/app/cekapi.tsx) — endpoint tes koneksi

Ganti `http://192.168.8.185:8000` dengan IP komputermu (cek dengan `ipconfig` di Windows).

```bash
# Jalankan Expo (gunakan -c untuk clear cache jika perlu)
npx expo start -c
```

Scan QR code dengan Expo Go, atau tekan `a` untuk Android emulator / `i` untuk iOS simulator.

## Fitur

| Status | Fitur                                  |
| :----: | :------------------------------------- |
| ✅     | Autentikasi API via Laravel Sanctum    |
| ✅     | Auto-login mobile dengan Expo SecureStore |
| ✅     | Panel admin web (Inertia.js + React)   |
| ✅     | Two-factor authentication (web)        |
| 🚧     | Dashboard informasi warga              |
| 🚧     | Layanan pengajuan surat desa           |

## Dokumentasi

- [API Reference](docs/api.md) — Daftar endpoint REST API
- [Arsitektur Sistem](docs/architecture.md) — Desain sistem dan keputusan teknis
- [Panduan Onboarding](docs/onboarding.md) — Setup lengkap untuk developer baru

## Akun Default (Development)

Jalankan seeder (jika tersedia) atau buat user manual via `php artisan tinker`:

```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@sadesa.test',
    'password' => 'password',
]);
```

## Lisensi

Proyek ini dikembangkan untuk keperluan administrasi Desa Cirangkong.
