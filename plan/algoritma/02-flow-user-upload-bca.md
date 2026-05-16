# 02 Flow User dan Upload BCA

## Flow utama

1. User membuka KasFlow.
2. User melihat landing page yang menjelaskan KasFlow bekerja bagaimana.
3. User membaca cara kerja: login, upload laporan BCA, parsing transaksi, AI analysis, report.
4. User klik CTA "Coba KasFlow" atau "Mulai analisis laporan BCA".
5. User login atau register.
6. User masuk dashboard/upload page.
7. User memilih bank BCA.
8. User upload PDF laporan bulanan.
9. Sistem validasi file.
10. Sistem membuat import batch.
11. Sistem parsing file.
12. Sistem menampilkan hasil transaksi.
13. User review hasil parsing.
14. User menjalankan AI analysis.
15. Sistem menampilkan insight.
16. User mengunduh laporan.

## Screen yang dibutuhkan

### Public

- Landing page utama di route /.
- Login.
- Register.
- 404.

### Authenticated

- Dashboard overview.
- Upload statement.
- Import detail/status.
- Review transactions.
- Analysis report.
- History imports.
- Settings sederhana.

## Landing page flow

Landing page adalah pengalaman pertama untuk user yang belum login.

Tujuan landing:
- Menjelaskan KasFlow tanpa memaksa user langsung login.
- Membuat user paham bahwa mereka perlu upload laporan BCA bulanan.
- Membuat user paham hasil yang akan didapat: insight pemborosan, pembelian berlebihan, biaya berulang, dan anomali.
- Memberi rasa aman bahwa data keuangan sensitif diproses dalam akun user.

Section landing:
1. Hero
   - Headline: "KasFlow membaca arus uang bulananmu."
   - Copy: "Upload laporan BCA bulanan, lalu KasFlow bantu menemukan pola pengeluaran, pemborosan, pembelian berlebihan, biaya berulang, dan peluang berhemat."
   - CTA utama: "Coba KasFlow".
   - CTA sekunder: "Lihat cara kerja".

2. Cara kerja
   - Login ke akun KasFlow.
   - Upload laporan BCA.
   - KasFlow membaca dan merapikan transaksi.
   - AI menganalisis pola pengeluaran.
   - User melihat report dan rekomendasi.

3. Contoh insight
   - "Pengeluaran makanan/minuman naik 38 persen dibanding kategori lain."
   - "Ada 12 transaksi kecil berulang yang totalnya cukup besar."
   - "Biaya subscription terdeteksi setiap bulan."
   - "Ada transaksi nominal besar yang perlu dicek ulang."

4. Bank support
   - BCA tersedia lebih dulu.
   - Mandiri dan BRI coming soon.

5. Keamanan data
   - User wajib login sebelum upload.
   - File dan transaksi hanya bisa dilihat pemilik akun.
   - Data yang dikirim ke AI harus berupa ringkasan dan evidence yang diperlukan, bukan akses penuh rekening.

6. Final CTA
   - Tombol "Mulai analisis laporan BCA".
   - Arahkan ke /login dengan next target /imports/new.

CTA behavior:
- Jika user belum login: /login?next=/imports/new.
- Jika user sudah login: /imports/new atau /dashboard.

## Upload states

Upload harus punya state eksplisit:
- idle: belum ada file.
- dragging: user sedang drag file.
- selected: file dipilih, belum dikirim.
- uploading: file sedang dikirim ke server.
- uploaded: file tersimpan.
- validating: file dicek.
- parsing: PDF dibaca.
- parsed: transaksi ditemukan.
- needs_review: confidence rendah atau ada warning.
- analyzing: AI sedang membuat insight.
- completed: laporan siap.
- failed: error dan user bisa retry.

## Validasi client

Aturan awal:
- File type: PDF untuk BCA MVP.
- Max file size: mulai dari 15 MB.
- Jumlah file: 1 file per import untuk MVP.
- Nama file boleh bebas.
- User harus login sebelum upload.
- Bank default BCA, tetapi tetap disimpan sebagai field.

Pesan error:
- File bukan PDF.
- File terlalu besar.
- Upload gagal.
- File kosong/rusak.
- PDF terenkripsi dan butuh password.
- Tidak ditemukan transaksi.
- Format belum didukung.

## Validasi server

Server tidak boleh percaya validasi client.

Server harus cek:
- MIME type.
- Ekstensi.
- Ukuran.
- User ownership.
- Duplicate file hash.
- Virus/malware scan jika nanti deploy production.
- Apakah file sudah pernah diproses oleh user yang sama.

## Algoritma upload

Input:
- userId
- bankCode = "bca"
- file
- optional periodMonth
- optional statementPassword

Langkah:
1. Hitung sha256 hash file.
2. Cek apakah hash pernah diupload user.
3. Simpan metadata file.
4. Simpan file ke storage.
5. Buat statement_import dengan status "uploaded".
6. Jalankan job validate.
7. Jika valid, ubah status ke "parsing".
8. Jalankan parser BCA.
9. Simpan raw extraction.
10. Simpan normalized transactions.
11. Hitung parser confidence.
12. Jika confidence cukup, status "parsed".
13. Jika banyak warning, status "needs_review".
14. User review.
15. Jalankan AI analysis.
16. Simpan analysis_report.
17. Status "completed".

## Review hasil parsing

Review table harus menampilkan:
- Tanggal transaksi.
- Deskripsi asli.
- Merchant hasil normalisasi.
- Kategori.
- Debit.
- Kredit.
- Saldo.
- Confidence.
- Warning jika data meragukan.

User bisa:
- Mengubah kategori.
- Menggabungkan merchant yang sama.
- Menandai transaksi bukan pengeluaran.
- Menandai transaksi transfer internal.
- Menandai transaksi parsing salah.
- Retry parsing dengan password atau mode lain.

## Empty state

User baru:
- Tampilkan upload panel utama.
- Jangan tampilkan dashboard kosong yang membingungkan.

Tidak ada transaksi:
- Jelaskan file berhasil dibaca tetapi transaksi tidak ditemukan.
- Minta user cek periode/file.

AI belum dijalankan:
- Tampilkan CTA "Analisis sekarang".

## Output setelah analisis

Dashboard laporan menampilkan:
- Total pemasukan.
- Total pengeluaran.
- Net cashflow.
- Top kategori pengeluaran.
- Top merchant.
- Pembelian berlebihan.
- Biaya berulang.
- Anomali.
- Rekomendasi penghematan.
- Ringkasan naratif bulanan.

## Export

MVP export:
- PDF ringkasan.
- CSV transaksi yang sudah dinormalisasi.

Later:
- JSON untuk backup.
- XLSX untuk user bisnis kecil.
