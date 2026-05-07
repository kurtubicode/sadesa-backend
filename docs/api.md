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

---

## Sprint 2 — Pengajuan Surat & Alur Verifikasi

Sprint 2 menambahkan fitur pengajuan surat oleh warga, verifikasi oleh staff, dan pengesahan oleh kepala desa.

### Alur Status Pengajuan

```
menunggu → diproses → diverifikasi → menunggu_pengesahan → disetujui
                                                          → ditolak_kepala
         → ditolak_staff   (oleh staff)
         → dibatalkan      (oleh warga)
         → revisi          (oleh staff, kembali ke diproses)
```

| Status | Keterangan |
|--------|-----------|
| `menunggu` | Pengajuan baru dibuat warga, belum diproses |
| `diproses` | Staff sedang memproses |
| `diverifikasi` | Staff telah memverifikasi, menunggu pengesahan |
| `menunggu_pengesahan` | Siap disahkan kepala desa |
| `disetujui` | Disetujui kepala desa |
| `ditolak_kepala` | Ditolak kepala desa |
| `ditolak_staff` | Ditolak staff |
| `dibatalkan` | Dibatalkan oleh warga (hanya saat `menunggu`) |
| `revisi` | Dikembalikan ke warga untuk diperbaiki, lalu kembali ke `diproses` |

---

## Endpoints Sprint 2 — Warga

Middleware: `auth:sanctum` + `role:warga`

---

### GET `/api/master-surat`

Mendapatkan daftar jenis surat yang aktif. Dapat diakses publik (tanpa autentikasi).

**Autentikasi:** Tidak diperlukan

**Response — Sukses `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "nama": "Surat Keterangan Domisili",
      "deskripsi": "Surat keterangan tempat tinggal warga",
      "fields_formulir": ["nama_lengkap", "alamat", "keperluan"],
      "is_aktif": true,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "nama": "Surat Keterangan Tidak Mampu",
      "deskripsi": "Surat keterangan ekonomi tidak mampu",
      "fields_formulir": ["nama_lengkap", "pekerjaan", "penghasilan_bulanan"],
      "is_aktif": true,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

### GET `/api/pengajuan`

Mendapatkan riwayat semua pengajuan milik warga yang sedang login.

**Autentikasi:** Diperlukan (Bearer Token, role: warga)

**Response — Sukses `200 OK`:**

```json
{
  "data": [
    {
      "id": 10,
      "master_surat_id": 1,
      "master_surat": {
        "id": 1,
        "nama": "Surat Keterangan Domisili"
      },
      "status": "menunggu",
      "catatan": null,
      "created_at": "2025-03-01T08:00:00.000000Z",
      "updated_at": "2025-03-01T08:00:00.000000Z"
    }
  ]
}
```

---

### POST `/api/pengajuan`

Membuat pengajuan surat baru.

**Autentikasi:** Diperlukan (Bearer Token, role: warga)

**Request Body:**

```json
{
  "master_surat_id": 1,
  "data_formulir": {
    "nama_lengkap": "Ahmad Warga",
    "alamat": "Jl. Merdeka No. 10 RT 01/02",
    "keperluan": "Pendaftaran sekolah"
  }
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `master_surat_id` | integer | Ya | ID jenis surat dari `/api/master-surat` |
| `data_formulir` | object | Ya | Isian formulir sesuai `fields_formulir` jenis surat |

**Response — Sukses `201 Created`:**

```json
{
  "message": "Pengajuan berhasil dibuat",
  "data": {
    "id": 10,
    "master_surat_id": 1,
    "status": "menunggu",
    "data_formulir": {
      "nama_lengkap": "Ahmad Warga",
      "alamat": "Jl. Merdeka No. 10 RT 01/02",
      "keperluan": "Pendaftaran sekolah"
    },
    "created_at": "2025-03-01T08:00:00.000000Z",
    "updated_at": "2025-03-01T08:00:00.000000Z"
  }
}
```

**Response — Validasi Gagal `422 Unprocessable Content`:**

```json
{
  "message": "The master surat id field is required.",
  "errors": {
    "master_surat_id": ["The master surat id field is required."]
  }
}
```

---

### GET `/api/pengajuan/{id}`

Mendapatkan detail satu pengajuan milik warga yang sedang login.

**Autentikasi:** Diperlukan (Bearer Token, role: warga)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Response — Sukses `200 OK`:**

```json
{
  "data": {
    "id": 10,
    "master_surat_id": 1,
    "master_surat": {
      "id": 1,
      "nama": "Surat Keterangan Domisili"
    },
    "status": "diverifikasi",
    "catatan": "Dokumen lengkap, diteruskan ke kepala desa.",
    "data_formulir": {
      "nama_lengkap": "Ahmad Warga",
      "alamat": "Jl. Merdeka No. 10 RT 01/02",
      "keperluan": "Pendaftaran sekolah"
    },
    "dokumen": [
      {
        "id": 3,
        "jenis_dokumen": "KTP",
        "file_path": "dokumen/pengajuan/10/ktp.jpg",
        "created_at": "2025-03-01T09:00:00.000000Z"
      }
    ],
    "created_at": "2025-03-01T08:00:00.000000Z",
    "updated_at": "2025-03-02T10:00:00.000000Z"
  }
}
```

**Response — Tidak Ditemukan `404 Not Found`:**

```json
{
  "message": "Pengajuan tidak ditemukan."
}
```

---

### POST `/api/pengajuan/{id}/dokumen`

Mengunggah file dokumen pendukung untuk pengajuan. Menggunakan `multipart/form-data`.

**Autentikasi:** Diperlukan (Bearer Token, role: warga)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Request Body (multipart/form-data):**

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `file` | file | Ya | File dokumen (jpg, jpeg, png, pdf). Maks 5 MB |
| `jenis_dokumen` | string | Ya | Jenis dokumen, misal: `KTP`, `KK`, `Surat_Pengantar` |

**Contoh penggunaan (Axios — React Native):**

```javascript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  name: 'ktp.jpg',
  type: 'image/jpeg',
});
formData.append('jenis_dokumen', 'KTP');

await api.post(`/api/pengajuan/${id}/dokumen`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

**Response — Sukses `201 Created`:**

```json
{
  "message": "Dokumen berhasil diunggah",
  "data": {
    "id": 3,
    "pengajuan_id": 10,
    "jenis_dokumen": "KTP",
    "file_path": "dokumen/pengajuan/10/ktp.jpg",
    "created_at": "2025-03-01T09:00:00.000000Z"
  }
}
```

**Response — Validasi Gagal `422 Unprocessable Content`:**

```json
{
  "message": "The file field is required.",
  "errors": {
    "file": ["The file field is required."]
  }
}
```

---

### DELETE `/api/pengajuan/{id}`

Membatalkan pengajuan. Hanya dapat dilakukan jika status masih `menunggu`.

**Autentikasi:** Diperlukan (Bearer Token, role: warga)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Request Body:** Tidak ada

**Response — Sukses `200 OK`:**

```json
{
  "message": "Pengajuan berhasil dibatalkan"
}
```

**Response — Tidak Dapat Dibatalkan `403 Forbidden`:**

```json
{
  "message": "Pengajuan tidak dapat dibatalkan karena sudah diproses."
}
```

---

## Endpoints Sprint 2 — Staff

Middleware: `auth:sanctum` + `role:staff|admin`  
Prefix: `/api/staff`

---

### GET `/api/staff/pengajuan`

Mendapatkan semua pengajuan yang masuk. Dapat difilter berdasarkan status.

**Autentikasi:** Diperlukan (Bearer Token, role: staff atau admin)

**Query Parameter (opsional):**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `status` | string | Filter status, misal: `?status=menunggu` |

**Response — Sukses `200 OK`:**

```json
{
  "data": [
    {
      "id": 10,
      "warga": {
        "id": 5,
        "name": "Ahmad Warga",
        "email": "warga@example.com"
      },
      "master_surat": {
        "id": 1,
        "nama": "Surat Keterangan Domisili"
      },
      "status": "menunggu",
      "catatan": null,
      "created_at": "2025-03-01T08:00:00.000000Z",
      "updated_at": "2025-03-01T08:00:00.000000Z"
    }
  ]
}
```

---

### GET `/api/staff/pengajuan/{id}`

Mendapatkan detail satu pengajuan beserta dokumen pendukungnya.

**Autentikasi:** Diperlukan (Bearer Token, role: staff atau admin)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Response — Sukses `200 OK`:**

```json
{
  "data": {
    "id": 10,
    "warga": {
      "id": 5,
      "name": "Ahmad Warga",
      "email": "warga@example.com"
    },
    "master_surat": {
      "id": 1,
      "nama": "Surat Keterangan Domisili"
    },
    "status": "menunggu",
    "catatan": null,
    "data_formulir": {
      "nama_lengkap": "Ahmad Warga",
      "alamat": "Jl. Merdeka No. 10 RT 01/02",
      "keperluan": "Pendaftaran sekolah"
    },
    "dokumen": [
      {
        "id": 3,
        "jenis_dokumen": "KTP",
        "file_path": "dokumen/pengajuan/10/ktp.jpg",
        "created_at": "2025-03-01T09:00:00.000000Z"
      }
    ],
    "created_at": "2025-03-01T08:00:00.000000Z",
    "updated_at": "2025-03-01T08:00:00.000000Z"
  }
}
```

---

### POST `/api/staff/pengajuan/{id}/verifikasi`

Memverifikasi pengajuan — menyetujui, menolak, atau meminta revisi.

**Autentikasi:** Diperlukan (Bearer Token, role: staff atau admin)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Request Body:**

```json
{
  "status": "disetujui",
  "catatan": "Dokumen lengkap dan valid."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `status` | string | Ya | Nilai: `disetujui`, `ditolak`, atau `revisi` |
| `catatan` | string | Tidak | Catatan atau alasan keputusan |

**Response — Sukses `200 OK` (disetujui):**

```json
{
  "message": "Pengajuan berhasil diverifikasi",
  "data": {
    "id": 10,
    "status": "menunggu_pengesahan",
    "catatan": "Dokumen lengkap dan valid.",
    "updated_at": "2025-03-02T10:00:00.000000Z"
  }
}
```

**Response — Sukses `200 OK` (ditolak):**

```json
{
  "message": "Pengajuan berhasil diverifikasi",
  "data": {
    "id": 10,
    "status": "ditolak_staff",
    "catatan": "KTP tidak terbaca, mohon unggah ulang.",
    "updated_at": "2025-03-02T10:00:00.000000Z"
  }
}
```

**Response — Sukses `200 OK` (revisi):**

```json
{
  "message": "Pengajuan dikembalikan untuk revisi",
  "data": {
    "id": 10,
    "status": "revisi",
    "catatan": "Harap lengkapi dokumen Kartu Keluarga.",
    "updated_at": "2025-03-02T10:00:00.000000Z"
  }
}
```

**Response — Validasi Gagal `422 Unprocessable Content`:**

```json
{
  "message": "The selected status is invalid.",
  "errors": {
    "status": ["The selected status is invalid."]
  }
}
```

---

## Endpoints Sprint 2 — Kepala Desa

Middleware: `auth:sanctum` + `role:kepala_desa|admin`  
Prefix: `/api/kepala-desa`

---

### GET `/api/kepala-desa/pengajuan`

Mendapatkan daftar pengajuan yang siap untuk disahkan. Dapat difilter berdasarkan status.

**Autentikasi:** Diperlukan (Bearer Token, role: kepala_desa atau admin)

**Query Parameter (opsional):**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `status` | string | Filter status, misal: `?status=menunggu_pengesahan` |

**Response — Sukses `200 OK`:**

```json
{
  "data": [
    {
      "id": 10,
      "warga": {
        "id": 5,
        "name": "Ahmad Warga",
        "email": "warga@example.com"
      },
      "master_surat": {
        "id": 1,
        "nama": "Surat Keterangan Domisili"
      },
      "status": "menunggu_pengesahan",
      "catatan": "Dokumen lengkap dan valid.",
      "created_at": "2025-03-01T08:00:00.000000Z",
      "updated_at": "2025-03-02T10:00:00.000000Z"
    }
  ]
}
```

---

### GET `/api/kepala-desa/pengajuan/{id}`

Mendapatkan detail satu pengajuan untuk keperluan pengesahan.

**Autentikasi:** Diperlukan (Bearer Token, role: kepala_desa atau admin)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Response — Sukses `200 OK`:**

```json
{
  "data": {
    "id": 10,
    "warga": {
      "id": 5,
      "name": "Ahmad Warga",
      "email": "warga@example.com"
    },
    "master_surat": {
      "id": 1,
      "nama": "Surat Keterangan Domisili"
    },
    "status": "menunggu_pengesahan",
    "catatan": "Dokumen lengkap dan valid.",
    "data_formulir": {
      "nama_lengkap": "Ahmad Warga",
      "alamat": "Jl. Merdeka No. 10 RT 01/02",
      "keperluan": "Pendaftaran sekolah"
    },
    "dokumen": [
      {
        "id": 3,
        "jenis_dokumen": "KTP",
        "file_path": "dokumen/pengajuan/10/ktp.jpg",
        "created_at": "2025-03-01T09:00:00.000000Z"
      }
    ],
    "created_at": "2025-03-01T08:00:00.000000Z",
    "updated_at": "2025-03-02T10:00:00.000000Z"
  }
}
```

---

### POST `/api/kepala-desa/pengajuan/{id}/pengesahan`

Mengesahkan atau menolak pengajuan yang sudah diverifikasi staff.

**Autentikasi:** Diperlukan (Bearer Token, role: kepala_desa atau admin)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `id` | integer | ID pengajuan |

**Request Body:**

```json
{
  "status": "disetujui",
  "catatan": "Surat disetujui dan dapat diambil di kantor desa."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `status` | string | Ya | Nilai: `disetujui` atau `ditolak` |
| `catatan` | string | Tidak | Catatan atau alasan keputusan |

**Response — Sukses `200 OK` (disetujui):**

```json
{
  "message": "Pengajuan berhasil disahkan",
  "data": {
    "id": 10,
    "status": "disetujui",
    "catatan": "Surat disetujui dan dapat diambil di kantor desa.",
    "updated_at": "2025-03-03T09:00:00.000000Z"
  }
}
```

**Response — Sukses `200 OK` (ditolak):**

```json
{
  "message": "Pengajuan berhasil diproses",
  "data": {
    "id": 10,
    "status": "ditolak_kepala",
    "catatan": "Pengajuan tidak memenuhi persyaratan administratif desa.",
    "updated_at": "2025-03-03T09:00:00.000000Z"
  }
}
```

**Response — Status Tidak Valid `422 Unprocessable Content`:**

```json
{
  "message": "The selected status is invalid.",
  "errors": {
    "status": ["The selected status is invalid."]
  }
}
```

**Response — Pengajuan Belum Siap Disahkan `403 Forbidden`:**

```json
{
  "message": "Pengajuan belum siap untuk disahkan."
}
```
