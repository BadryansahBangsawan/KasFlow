# 03 Parser BCA dan Normalisasi

## Tujuan parser

Parser mengubah file laporan BCA menjadi transaksi terstruktur yang bisa dianalisis.

Output minimal setiap transaksi:
- transactionId
- statementImportId
- bankCode
- accountMask
- transactionDate
- postingDate
- descriptionOriginal
- descriptionClean
- merchantName
- direction: debit, credit
- amount
- balanceAfter
- currency
- category
- confidence
- sourcePage
- sourceLine
- rawText

## Tantangan PDF bank

PDF bank bisa punya beberapa bentuk:
- PDF teks normal.
- PDF tabel dengan posisi kolom tidak konsisten.
- PDF terenkripsi/password.
- PDF hasil image/scan.
- Multi-page.
- Ada header/footer berulang.
- Ada saldo awal dan saldo akhir yang bukan transaksi.

Karena itu parser harus dibuat sebagai pipeline, bukan satu regex besar.

## Pipeline parser BCA

### 1. Detect file properties

Input: file PDF.

Langkah:
- Cek apakah PDF bisa dibuka.
- Cek jumlah halaman.
- Cek apakah terenkripsi.
- Cek apakah mengandung text layer.
- Cek metadata jika tersedia.
- Cek indikasi BCA: "BCA", "Bank Central Asia", "myBCA", atau pola e-statement BCA.

Output:
- isPdfReadable
- isEncrypted
- hasTextLayer
- pageCount
- detectedBank
- parserMode

parserMode:
- text_pdf
- encrypted_pdf
- scanned_pdf
- unsupported

### 2. Extract text

Mode text_pdf:
- Extract text per page.
- Simpan page text mentah.
- Jangan langsung buang whitespace karena posisi kolom penting.

Mode encrypted_pdf:
- Jika user memberi password, retry extraction.
- Jika tidak, status needs_password.

Mode scanned_pdf:
- MVP boleh status unsupported_ocr_required.
- Later gunakan OCR.

### 3. Clean text

Langkah:
- Normalize line endings.
- Hilangkan karakter kontrol.
- Normalize multiple spaces tetapi simpan versi raw.
- Buang header/footer yang berulang.
- Deteksi blok transaksi.
- Pisahkan summary section dari transaction section.

### 4. Detect account and period

Cari metadata:
- Nama pemilik rekening jika ada.
- Nomor rekening masked.
- Periode laporan.
- Mata uang.
- Saldo awal.
- Saldo akhir.

Jika period tidak ditemukan:
- Pakai tanggal transaksi paling awal dan paling akhir.
- Minta user konfirmasi bulan.

### 5. Segment transaction rows

Tujuan:
- Mengubah text menjadi baris transaksi kandidat.

Strategi:
- Cari pola tanggal.
- Gabungkan continuation line ke transaksi sebelumnya.
- Pisahkan kolom angka berdasarkan posisi atau pola amount.
- Jangan ambil saldo awal/akhir sebagai transaksi.

Pseudo flow:

```text
for each page:
  for each line:
    if line starts with transaction date:
      close previous candidate
      start new candidate
    else if inside transaction candidate:
      append line to previous candidate
    else:
      ignore or store as metadata
```

### 6. Parse amount and balance

Untuk setiap candidate:
- Ambil tanggal.
- Ambil deskripsi.
- Deteksi debit atau credit.
- Ambil amount.
- Ambil balanceAfter jika ada.

Aturan:
- Amount harus positive integer/decimal.
- Direction menentukan apakah transaksi masuk atau keluar.
- Jangan simpan debit sebagai angka negatif di amount. Simpan direction terpisah.
- Untuk perhitungan cashflow, debit dianggap expense dan credit dianggap income.

### 7. Reconcile balance

Jika saldo tersedia:
- Urutkan transaksi berdasarkan tanggal dan urutan file.
- Mulai dari saldo awal.
- Debit mengurangi saldo.
- Credit menambah saldo.
- Cocokkan dengan balanceAfter.
- Jika mismatch kecil karena pembulatan, beri warning ringan.
- Jika mismatch besar, turunkan confidence.

### 8. Deduplicate

Deduplication key:
- userId
- bankCode
- accountMask
- transactionDate
- descriptionClean
- direction
- amount
- balanceAfter

Buat hash transaksi:

```text
sha256(bankCode + accountMask + date + descriptionClean + direction + amount + balanceAfter)
```

Jika duplicate:
- Jangan insert dua kali.
- Tandai sebagai duplicate saat import.

## Normalisasi deskripsi

Input:
- descriptionOriginal

Langkah:
- Uppercase untuk matching.
- Trim whitespace.
- Hilangkan nomor referensi yang tidak berguna.
- Simpan token pembayaran seperti QRIS, BI-FAST, TRSF, EDC, VA, ADMIN.
- Deteksi merchant name.
- Deteksi transfer internal.

Output:
- descriptionClean
- merchantName
- transactionType

transactionType contoh:
- qris_payment
- debit_card
- bank_transfer
- virtual_account
- admin_fee
- interest
- salary_income
- cash_withdrawal
- unknown

## Kategorisasi awal

Kategori MVP:
- Food and drink
- Groceries
- Transportation
- Shopping
- Bills and utilities
- Health
- Education
- Entertainment
- Transfer
- Cash withdrawal
- Bank fees
- Income
- Savings/investment
- Other

Rule examples:
- QRIS + restoran/cafe keywords -> Food and drink.
- GRAB/GOJEK/MAXIM -> Transportation atau Food jika ada food keyword.
- PLN/PDAM/TELKOM/INDIHOME -> Bills and utilities.
- ADMIN/BIAYA -> Bank fees.
- GAJI/PAYROLL/SALARY -> Income.
- TARIK TUNAI/ATM -> Cash withdrawal.

Jika rule confidence rendah:
- Kategori "Other".
- Kirim kandidat ke AI categorization setelah data disanitasi.

## Confidence score

Setiap transaksi punya confidence 0 sampai 1.

Naik jika:
- Tanggal valid.
- Amount valid.
- Direction jelas.
- Balance cocok.
- Bank terdeteksi BCA.
- Row berasal dari transaction section.

Turun jika:
- Line multiline tidak jelas.
- Balance mismatch.
- Amount ambiguous.
- Tanggal tidak punya tahun.
- Parser fallback dipakai.

Import confidence:
- Rata-rata confidence transaksi.
- Persentase transaksi yang balance-nya valid.
- Jumlah warning/error.

## Error dan warning

Error blocking:
- PDF tidak bisa dibuka.
- PDF terenkripsi tanpa password.
- Tidak ada transaksi ditemukan.
- Bank bukan BCA.

Warning:
- Beberapa row tidak terbaca.
- Period tidak ditemukan.
- Saldo tidak cocok.
- Beberapa transaksi duplicate.
- Kategori belum yakin.

## Testing parser

Fixture yang dibutuhkan:
- BCA PDF 1 bulan dengan text layer.
- BCA PDF password protected.
- BCA PDF multi-page.
- BCA PDF tanpa transaksi.
- BCA PDF dengan banyak QRIS.
- BCA PDF dengan transfer dan admin fee.

Test wajib:
- Jumlah transaksi sama dengan fixture expected.
- Total debit sama.
- Total credit sama.
- Saldo akhir cocok.
- Duplicate tidak masuk dua kali.
- Parser tidak crash untuk PDF unsupported.
