# Deployment Checklist — Wajib Sebelum Lapor "Selesai"

Checklist ini WAJIB dijalankan setiap kali ada perubahan yang mempengaruhi
frontend (Next.js) sebelum melaporkan pekerjaan sebagai "selesai/deployed/
berhasil" ke user. Dibuat setelah dua kejadian salah lapor: perubahan sudah
di-build tapi user masih melihat versi lama karena proses PM2 lama masih
jalan / belum diverifikasi ke server / cache Cloudflare.

## 1. Build lalu WAJIB restart PM2

`npm run build` saja tidak cukup — proses `bankmini-web` yang sedang jalan
masih memegang bundle lama di memory sampai di-restart.

```bash
cd /var/www/bank-mini/frontend && npm run build
pm2 restart bankmini-web
```

Kalau ada perubahan backend (schema/migration/module baru), restart juga:
```bash
pm2 restart bankmini-api
```

## 2. Verifikasi dari SISI SERVER — bukan asumsi

**PENTING — `curl` polos ke halaman TIDAK VALID di app ini.** Semua halaman
dibungkus `Layout.tsx` yang menampilkan spinner loading selama
`useAuthStore` status masih `idle`/`loading` — status ini hanya di-set
setelah JS jalan di **browser** (client-side), bukan saat render di server.
Akibatnya `curl -s http://localhost:3000/<halaman> | grep "apapun"` SELALU
kosong untuk teks spesifik halaman, benar atau salah kodenya — HTML yang
benar-benar dikirim server cuma `<div>...lucide-loader-circle...</div>`.
Pernah dipakai sebagai "bukti" padahal cacat, jangan diulangi.

Cara yang BENAR-BENAR valid — cek langsung JS chunk yang dikirim ke
browser (ini isinya sama persis untuk semua orang, tidak tergantung status
login):

```bash
# 1. Cari chunk yang berisi kode halaman terkait (pakai teks unik yang PASTI ada, mis. judul modal)
grep -rl "<teks unik yang pasti ada di halaman ini>" frontend/.next/static/chunks/*.js

# 2. Di chunk yang sama, cari teks/elemen yang seharusnya SUDAH DIHAPUS
grep -io "<teks lama yang seharusnya sudah hilang>" frontend/.next/static/chunks/<nama-chunk>.js
```

- Langkah 1 kosong → chunk salah, cari ulang.
- Langkah 2 **kosong** → benar sudah hilang dari kode yang dikirim ke browser.
- Langkah 2 **ada isinya** → JANGAN lapor selesai, kode lama masih ter-bundle.

Untuk backend (API tanpa masalah client-render), `curl` langsung ke
`http://localhost:3001/api/...` (pakai token JWT valid) tetap valid apa
adanya — masalah di atas cuma berlaku untuk HTML halaman frontend.

Tambahan sanity check (bukan pengganti langkah di atas, cuma pendukung):
cek build benar-benar sukses tanpa error, cek `pm2 list` proses baru
benar-benar restart (lihat kolom `uptime`/`↺` naik), cek timestamp file
source vs `frontend/.next/BUILD_ID` vs waktu restart PM2 harus berurutan.

## 3. Cek cache Cloudflare

```bash
curl -sI https://bankmini.smklimpung.id/<halaman-terkait> | grep -i cf-cache-status
```

- `DYNAMIC` / `MISS` / `BYPASS` → aman, Cloudflare tidak menahan versi lama.
- `HIT` → Cloudflare kemungkinan menyajikan cache lama, perlu purge cache
  untuk halaman/aset terkait sebelum lapor selesai.

## 4. Isi laporan ke user WAJIB mencantumkan

- Hasil `curl` dari langkah 2 (bukti konten baru ter-serve di server).
- Status `cf-cache-status` dari langkah 3.
- Kalimat eksplisit: *"Karena ada kemungkinan cache browser Anda sendiri,
  silakan hard refresh (Ctrl+Shift+R) atau buka di jendela incognito untuk
  verifikasi akhir."*

## 5. JANGAN pernah lapor "selesai" hanya berdasarkan

- "Build berhasil tanpa error" saja.
- Asumsi bahwa restart PM2 otomatis terjadi setelah build.
- Tanpa curl verifikasi langsung ke server (langkah 2 dan 3).
