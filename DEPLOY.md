# Deployment Guide: Moodlab Website 🚀

Panduan ini berisi langkah-langkah untuk men-deploy backend serverless (Edge Functions) agar fitur pembayaran dan update status order berjalan otomatis.

## 1. Persiapan Environment Variables

Karena kita memindahkan database utama ke **Turso**, Webhook Pembayaran (Midtrans) yang berjalan di Supabase Edge Functions harus tahu cara menghubungi Turso.

### Set Secrets di Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka Project Anda > **Settings** (icon gerigi) > **Edge Functions**.
3. Cari bagian **Secrets** atau **Environment Variables**.
4. Tambahkan/Update variabel berikut:

| Key | Value (Contoh) | Catatan |
| :--- | :--- | :--- |
| `TURSO_DATABASE_URL` | `https://moodlab...turso.io` | URL database Turso Anda (pastikan pakai `https://`, bukan `libsql://`) |
| `TURSO_AUTH_TOKEN` | `eyJhbG...` | Token autentikasi Turso yang panjang |
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-...` | Server Key dari Midtrans Dashboard |

> **Tips:** Anda bisa melihat nilai `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` dari file `.env` di project lokal Anda.

## 2. Deploy Edge Functions

Anda perlu meng-upload kode webhook terbaru yang sudah dimodifikasi agar bisa menulis ke Turso.

### Menggunakan Supabase CLI (Recommended)
Jika Anda sudah menginstall Supabase CLI, jalankan perintah ini di terminal project (root folder):

```bash
# Login CLI (jika belum)
npx supabase login

# Deploy fungsi midtrans-webhook
npx supabase functions deploy midtrans-webhook --no-verify-jwt

# Deploy fungsi process-payment (untuk checkout)
npx supabase functions deploy process-payment --no-verify-jwt
```

**Catatan:** Flag `--no-verify-jwt` penting agar Midtrans bisa memanggil webhook kita tanpa harus login (publik), karena Midtrans adalah layanan eksternal.

## 3. Verifikasi Webhook di Midtrans

1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/) (Sandbox/Production).
2. Masuk ke **Settings** > **Configuration**.
3. Di bagian **Notification Endpoint (Webhook URL)**, pastikan URL-nya mengarah ke fungsi Supabase Anda:
   `https://[PROJECT_REF].supabase.co/functions/v1/midtrans-webhook`
   *(Ganti `[PROJECT_REF]` dengan ID project Supabase Anda)*.

## 4. Troubleshooting Umum

*   **Status Order Tetap "Pending" setelah Bayar:**
    *   Cek Logs di Supabase Dashboard > Edge Functions > `midtrans-webhook` > Logs.
    *   Jika ada error `Missing Turso configuration`, berarti langkah no. 1 belum benar.
    *   Jika error `Unauthorized` (401) dari Turso, cek apakah Token valid.

*   **Gagal Checkout (Error 500/400):**
    *   Cek Logs fungsi `process-payment`.
    *   Pastikan `MIDTRANS_SERVER_KEY` sudah benar.

## 5. Ringkasan Perubahan Kode Terbaru

*   **Frontend Cart:** Menggunakan Database Turso sepenuhnya.
*   **Admin Dashboard:** Bisa edit konten dinamis (Home/About).
*   **Webhook:** Sekarang menulis status pembayaran langsung ke tabel `orders` di Turso.
