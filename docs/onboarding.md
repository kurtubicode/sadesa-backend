# Panduan Onboarding Developer — SADESA

Dokumen ini membantu developer baru untuk setup environment, memahami struktur proyek, dan mulai berkontribusi dalam waktu singkat.

---

## 1. Gambaran Proyek

SADESA (Sahabat Digital Desa) adalah sistem informasi dan administrasi terpadu untuk warga Desa Cirangkong. Proyek ini terdiri dari dua bagian:

- **Backend** — Panel admin berbasis web untuk petugas desa, sekaligus REST API untuk aplikasi mobile
- **Mobile** — Aplikasi Android/iOS untuk warga mengakses layanan desa

```
sadesa-project/
├── backend/   ← Laravel 11 (web admin + REST API)
├── mobile/    ← React Native + Expo (aplikasi warga)
└── docs/      ← Dokumentasi teknis
```

---

## 2. Prasyarat

Install semua tools berikut sebelum memulai:

| Tool | Versi Minimum | Link Download |
|------|--------------|---------------|
| PHP | 8.2 | https://www.php.net |
| Composer | 2.x | https://getcomposer.org |
| Node.js | 20 LTS | https://nodejs.org |
| MySQL | 8.x | via Laragon / XAMPP |
| Git | terbaru | https://git-scm.com |
| Expo Go (HP) | terbaru | Play Store / App Store |

**Rekomendasi:** Gunakan **Laragon** di Windows karena sudah bundled PHP, MySQL, dan Nginx sekaligus.

---

## 3. Setup Lokal

### Clone & Masuk ke Direktori

```bash
git clone <url-repo> sadesa-project
cd sadesa-project
```

### Setup Backend

```bash
cd backend

# Install semua dependensi
composer install
npm install

# Buat file .env dari template
cp .env.example .env
php artisan key:generate
```

Edit `.env` — sesuaikan konfigurasi database:

```env
APP_NAME=SADESA
APP_URL=http://localhost:8000
APP_LOCALE=id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sadesa
DB_USERNAME=root
DB_PASSWORD=
```

Buat database `sadesa` di MySQL, lalu jalankan migrasi:

```bash
# Buat semua tabel
php artisan migrate

# (Opsional) Isi data awal jika seeder tersedia
php artisan db:seed
```

Jalankan server development:

```bash
# Gunakan --host=0.0.0.0 agar bisa diakses dari HP/emulator
php artisan serve --host=0.0.0.0 --port=8000

# Di terminal terpisah: jalankan Vite untuk asset hot-reload
npm run dev
```

Admin panel bisa diakses di `http://localhost:8000`.

### Setup Mobile

```bash
cd mobile
npm install
```

Temukan IP lokal komputermu:
```bash
# Windows
ipconfig
# Cari "IPv4 Address" di adapter Wi-Fi, contoh: 192.168.1.10
```

Update URL API di dua file:

**`app/index.tsx`** — cari dan ganti URL di fungsi login:
```javascript
// Sebelum:
const response = await axios.post('http://192.168.8.185:8000/api/login', ...)
// Sesudah (ganti dengan IP-mu):
const response = await axios.post('http://192.168.1.10:8000/api/login', ...)
```

**`app/cekapi.tsx`** — cari dan ganti URL tes koneksi:
```javascript
// Sebelum:
const response = await axios.get('http://192.168.8.185:8000/api/tes-koneksi')
// Sesudah:
const response = await axios.get('http://192.168.1.10:8000/api/tes-koneksi')
```

Jalankan Expo:
```bash
npx expo start
```

Scan QR code dengan Expo Go, atau tekan `a` untuk emulator Android.

---

## 4. Membuat Akun Admin Pertama

Buat user via Tinker:

```bash
php artisan tinker
```

```php
\App\Models\User::create([
    'name' => 'Admin Desa',
    'email' => 'admin@sadesa.test',
    'password' => 'password',
]);
```

Login di `http://localhost:8000/login` dengan email dan password di atas.

---

## 5. Sistem & Cara Kerjanya

### Autentikasi

Ada dua sistem auth yang berjalan bersamaan:

| Konteks | Library | Mekanisme |
|---------|---------|-----------|
| Web (admin panel) | Laravel Fortify | Session + cookie |
| Mobile (app warga) | Laravel Sanctum | Bearer token |

Alur login mobile: warga login via `POST /api/login` → dapat token → token disimpan di SecureStore → setiap request berikutnya kirim token di header `Authorization`.

### Web Admin (Inertia.js)

Backend Laravel merender halaman menggunakan **Inertia.js** — bukan API JSON biasa. Controller mengembalikan `Inertia::render('PageName', $props)` yang kemudian dirender oleh React di browser. Tidak ada endpoint JSON untuk halaman admin.

### Routing Mobile

Mobile menggunakan **Expo Router** (file-based routing). Nama file = nama route:

```
app/index.tsx          → /          (halaman login)
app/(tabs)/index.tsx   → /(tabs)    (home)
app/(tabs)/profile.tsx → /(tabs)/profile
app/cekapi.tsx         → /cekapi
```

---

## 6. Task Harian yang Umum

### Menambah Endpoint API Baru

1. Tambahkan route di `backend/routes/api.php`
2. Buat atau update controller di `app/Http/Controllers/`
3. Test endpoint dengan Postman / Insomnia
4. Update [`docs/api.md`](api.md)

### Menambah Halaman Mobile Baru

1. Buat file baru di `mobile/app/` (contoh: `mobile/app/dashboard.tsx`)
2. Expo Router otomatis mengenali route baru
3. Tambahkan navigasi ke halaman tersebut dari halaman lain

### Menambah Kolom Database

```bash
# Buat migration baru
php artisan make:migration add_phone_to_users_table --table=users

# Edit file migration, lalu jalankan
php artisan migrate
```

### Melihat Log Error

```bash
# Log Laravel
tail -f backend/storage/logs/laravel.log

# Atau lihat di browser: http://localhost:8000 saat APP_DEBUG=true
```

---

## 7. Panduan Git

### Branch Convention

```
main          ← kode production-ready
develop       ← integrasi fitur
feature/xxx   ← fitur baru (contoh: feature/surat-pengajuan)
fix/xxx       ← bugfix (contoh: fix/login-token-expired)
```

### Workflow

```bash
# Mulai fitur baru dari develop
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur

# Setelah selesai
git add .
git commit -m "feat: deskripsi singkat perubahan"
git push origin feature/nama-fitur
# Buat Pull Request ke develop
```

### Commit Message Format

```
feat: tambah endpoint pengajuan surat
fix: perbaiki crash saat token expired
docs: update API documentation
refactor: pisahkan logic auth ke service class
```

---

## 8. Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| `php artisan migrate` error | Pastikan database `sadesa` sudah dibuat dan `.env` sudah benar |
| Mobile tidak bisa connect ke API | Pastikan IP di `app/index.tsx` sudah benar, HP dan komputer di Wi-Fi yang sama |
| Vite asset tidak muncul | Jalankan `npm run dev` atau `npm run build` di folder backend |
| Expo QR tidak bisa di-scan | Coba `npx expo start --tunnel` |
| `composer install` gagal | Cek versi PHP: `php -v` harus >= 8.2 |
| Token rejected (401) | Logout dan login ulang untuk refresh token |

---

## 9. Kontak & Referensi

- **Repository:** Tanya ke lead developer
- **Dokumentasi API:** [`docs/api.md`](api.md)
- **Arsitektur Sistem:** [`docs/architecture.md`](architecture.md)

### Referensi Teknologi

- [Laravel 11 Docs](https://laravel.com/docs/11.x)
- [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)
- [Laravel Fortify](https://laravel.com/docs/11.x/fortify)
- [Inertia.js](https://inertiajs.com)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
