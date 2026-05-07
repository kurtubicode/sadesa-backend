# SADESA API Reference

REST API untuk aplikasi mobile SADESA. Autentikasi menggunakan **Laravel Sanctum** (token-based).

**Base URL (development):** `http://<IP_LOKAL>:8000`

---

## Autentikasi

API menggunakan Bearer Token. Setelah login, sertakan token di setiap request yang memerlukan autentikasi:

```
Authorization: Bearer <token>
```

---

## Endpoints

### POST `/api/logout`

Revoke token aktif (logout). Token yang dikirim di header akan dihapus dari database.

**Autentikasi:** Diperlukan (Bearer Token)

**Request Body:** Tidak ada

**Response — Sukses `200 OK`:**

```json
{
  "message": "Logout berhasil"
}
```

**Response — Tidak Terautentikasi `401 Unauthorized`:**

```json
{
  "message": "Unauthenticated."
}
```

**Contoh penggunaan (Axios):**

```javascript
await api.post("/api/logout");
await SecureStore.deleteItemAsync("sadesa_user_token");
router.replace("/");
```

---

### POST `/api/login`

Login warga dan mendapatkan token akses.

**Autentikasi:** Tidak diperlukan

**Request Body:**

```json
{
  "email": "warga@example.com",
  "password": "password123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `email` | string | Ya | Email terdaftar |
| `password` | string | Ya | Password akun |

**Response — Sukses `200 OK`:**

```json
{
  "message": "Login berhasil",
  "user": {
    "id": 1,
    "name": "Ahmad Warga",
    "email": "warga@example.com",
    "email_verified_at": null,
    "created_at": "2025-01-01T00:00:00.000000Z",
    "updated_at": "2025-01-01T00:00:00.000000Z"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response — Gagal `422 Unprocessable Content`:**

```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

**Contoh penggunaan (Axios):**

```javascript
const response = await axios.post('http://192.168.x.x:8000/api/login', {
  email: 'warga@example.com',
  password: 'password',
});

const token = response.data.token;
await SecureStore.setItemAsync('sadesa_user_token', token);
```

---

### GET `/api/tes-koneksi`

Cek koneksi ke server API. Digunakan untuk debugging di halaman `cekapi`.

**Autentikasi:** Tidak diperlukan

**Response — Sukses `200 OK`:**

```json
{
  "status": "ok",
  "pesan": "Koneksi ke API berhasil!"
}
```

**Contoh penggunaan (Axios):**

```javascript
const response = await axios.get('http://192.168.x.x:8000/api/tes-koneksi');
console.log(response.data.pesan);
```

---

## Endpoint Mendatang

Berikut endpoint yang direncanakan untuk fitur selanjutnya:

| Method | Endpoint | Deskripsi | Status |
|--------|----------|-----------|--------|
| `GET` | `/api/user` | Data profil user terautentikasi | 🚧 Belum dibuat |
| `GET` | `/api/surat` | Daftar pengajuan surat warga | 🚧 Belum dibuat |
| `POST` | `/api/surat` | Buat pengajuan surat baru | 🚧 Belum dibuat |
| `GET` | `/api/surat/{id}` | Detail pengajuan surat | 🚧 Belum dibuat |
| `GET` | `/api/informasi` | Informasi/pengumuman desa | 🚧 Belum dibuat |

---

## Kode Error Umum

| Kode | Keterangan |
|------|-----------|
| `200` | Sukses |
| `401` | Token tidak valid atau belum login |
| `403` | Tidak memiliki akses |
| `404` | Resource tidak ditemukan |
| `422` | Validasi input gagal |
| `429` | Terlalu banyak request (rate limited) |
| `500` | Server error |

---

## Rate Limiting

| Endpoint | Batas |
|----------|-------|
| `POST /api/login` | 5 request/menit per IP |
| Endpoint lainnya | Default Laravel |

---

## Token

- Token tidak memiliki batas waktu kadaluarsa (expiration: `null`)
- Satu user dapat memiliki banyak token aktif
- Token disimpan di tabel `personal_access_tokens`
- Di mobile, token disimpan dengan Expo SecureStore (key: `sadesa_user_token`)
- Token dihapus dari SecureStore saat logout
