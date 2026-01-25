## Ringkasan Masalah
- Header chatbot tidak terlihat karena tinggi tetap (fixed height) terlalu kecil dibanding konten dua baris (title + subtitle), sehingga isi terpotong/ter-overlap.
- Chatbot masih memunculkan error koneksi; kemungkinan sebab: API key tidak valid/absen (401/403), payload tidak sesuai ekspektasi n8n, atau masalah CORS.

## Rencana Perbaikan UI Header
1. Ubah `chat-header` dari `height` tetap menjadi `min-height: 40px` dan `padding: 8px 12px` agar konten tidak terpotong.
2. Kompres isi header:
   - Turunkan ukuran ikon menjadi 18px.
   - Jadikan header satu baris (tampilkan hanya `title`, sembunyikan `subtitle` di desktop jika tinggi jadi sempit; opsional tampilkan subtitle di mobile dengan tinggi otomatis).
3. Tambah `border-bottom` tipis (`rgba(255,255,255,0.2)`) untuk pemisah visual.
4. Pastikan background gradient tetap aktif dan tidak tertimpa oleh container lain (tidak ada overlay di atas header).

## Rencana Perbaikan Error Chatbot
1. Perbaiki layer HTTP:
   - Baca body error dari `response.text()` saat status bukan 2xx untuk menampilkan pesan lebih informatif.
   - Dukung 2 skema auth: `X-N8N-API-KEY` dan `Authorization: Bearer <key>` (beberapa setup n8n memakai salah satunya).
2. Validasi konfigurasi:
   - Jika `VITE_N8N_CHAT_URL` kosong, tampilkan pesan konfigurasi endpoint belum disetel.
   - Jika 401/403, tampilkan prompt input API key sesuai aturan Anda.
3. Payload kompatibilitas:
   - Kirim `{ message, sessionId }` dan jika gagal, fallback kirim `{ text }` (sebagian flow n8n memakai nama field berbeda).
4. Tampilkan fallback yang lebih natural ketika gagal (tanpa mengulang dua blok error sekaligus).

## Prompt API Key (Sesuai Aturan Anda)
- Deteksi 401/403 → tampilkan modal input: "API key bermasalah. Masukkan API key n8n".
- Simpan sementara di `localStorage` dan gunakan hingga refresh, tanpa mengubah `.env`.

## Verifikasi
1. Jalankan di `localhost:1111` dan cek:
   - Header tampak jelas dengan tinggi ringkas.
   - Mengirim pesan "halo" → respons dari n8n muncul tanpa blok error ganda.
2. Cek Network tab: status, headers (`X-N8N-API-KEY`/`Authorization`), dan payload.
3. Jika masih gagal, log detail error di console dan tampilkan pesan ramah pengguna.

Silakan konfirmasi rencana ini. Setelah Anda menyetujui, saya akan menerapkan perubahan dan memverifikasi di localhost:1111.