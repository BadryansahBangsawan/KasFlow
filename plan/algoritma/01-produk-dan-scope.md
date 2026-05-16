# 01 Produk dan Scope

## Visi

KasFlow membantu user memahami arus kas pribadi dari laporan bank bulanan. User tidak perlu membaca mutasi satu per satu. KasFlow mengubah laporan menjadi ringkasan pengeluaran, pola kebiasaan, tanda pemborosan, dan rekomendasi yang mudah dilakukan.

## Target user

- Pekerja yang ingin tahu uang bulanan habis ke mana.
- Pemilik usaha kecil yang memakai rekening pribadi atau rekening operasional sederhana.
- User yang punya banyak transaksi digital dan sulit membaca pola dari mutasi bank.
- User yang belum memakai aplikasi budgeting, tetapi punya laporan bank bulanan.

## Masalah yang diselesaikan

- Laporan bank panjang dan sulit dibaca.
- User sulit melihat pembelian berulang yang sebenarnya tidak penting.
- Pengeluaran kecil berulang sering tidak terasa, tetapi totalnya besar.
- User sulit membedakan transaksi normal, pemborosan, dan anomali.
- User tidak punya ringkasan bulanan yang bisa langsung dipahami.

## Value utama

- Upload laporan bulanan.
- Transaksi diekstrak otomatis.
- Pengeluaran dikategorikan.
- AI memberi insight yang spesifik, bukan nasihat generik.
- Laporan bisa dibaca sebagai dashboard dan diunduh.

## MVP

MVP hanya fokus pada BCA.

Fitur MVP:
- Landing page publik yang menjelaskan cara kerja KasFlow.
- Register dan login.
- Dashboard kosong untuk user baru.
- Upload file laporan BCA.
- Validasi file upload.
- Pipeline parsing BCA.
- Review hasil transaksi.
- Kategori transaksi awal.
- AI analysis bulanan.
- Dashboard insight.
- Export hasil analisis.

## Non-goal MVP

Yang tidak dikerjakan dulu:
- Integrasi langsung ke API bank.
- Sinkronisasi otomatis rekening.
- Mandiri dan BRI production parser.
- Multi-currency.
- Team/business workspace.
- Pembayaran/subscription aplikasi.
- Mobile native app.
- Akuntansi lengkap.
- Rekomendasi investasi.

## Modul aplikasi

0. Landing Page
   - Menjelaskan problem user.
   - Menjelaskan cara kerja KasFlow.
   - Menampilkan contoh insight.
   - Mengarahkan user ke login/register saat ingin mencoba.

1. Auth
   - Register, login, session, logout.
   - Semua data import terikat ke user.

2. Upload
   - User upload statement.
   - User pilih bank dan bulan jika tidak terdeteksi otomatis.
   - File disimpan dengan status.

3. Parser
   - Sistem baca PDF.
   - Sistem ekstrak tanggal, deskripsi, debit, kredit, saldo.
   - Sistem normalisasi transaksi.

4. Review
   - User melihat transaksi hasil parsing.
   - User bisa koreksi kategori atau menandai transaksi salah.

5. Categorization
   - Rule-based untuk kategori umum.
   - AI fallback untuk transaksi yang ambigu.

6. AI Analysis
   - Sistem membuat ringkasan data.
   - AI memberi insight berbasis transaksi.
   - Output harus punya bukti transaksi atau agregasi.

7. Report
   - Dashboard insight.
   - Export PDF/CSV/JSON.
   - Riwayat analisis per bulan.

## Prinsip produk

- Jangan mengklaim analisis jika parsing belum cukup yakin.
- Insight harus selalu bisa dilacak ke transaksi atau agregasi transaksi.
- User harus tahu status proses: upload, parsing, review, AI, selesai.
- Data keuangan harus dianggap sensitif.
- UI harus cepat dipahami, bukan sekadar terlihat ramai.

## Success metrics MVP

- User berhasil upload file BCA tanpa bantuan manual.
- Parser berhasil mengambil minimal 95 persen transaksi dari sampel yang didukung.
- User bisa memahami 5 insight utama dalam waktu kurang dari 2 menit.
- Setiap insight punya bukti transaksi/agregasi.
- Tidak ada data user yang terlihat oleh user lain.
