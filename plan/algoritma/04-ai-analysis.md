# 04 AI Analysis

## Tujuan AI

AI dipakai untuk menjelaskan pola transaksi dengan bahasa yang mudah dipahami. AI tidak boleh menggantikan parser. Parser dan agregasi harus menghasilkan fakta terlebih dahulu, lalu AI menulis insight berdasarkan fakta itu.

Prinsip:
- AI menganalisis data yang sudah dinormalisasi.
- AI tidak boleh mengarang transaksi.
- Setiap insight harus punya evidence.
- Insight harus spesifik terhadap bulan dan user.
- Data yang dikirim ke AI harus seminimal mungkin.

## Input AI

Input utama bukan raw PDF.

Input yang dikirim:
- Bulan/periode.
- Total income.
- Total expense.
- Net cashflow.
- Kategori dan total.
- Merchant dan total.
- Recurring transactions.
- Large transactions.
- Frequency by merchant/category.
- Cash withdrawal summary.
- Bank fee summary.
- Transaction evidence ids.

Raw description boleh dikirim hanya jika perlu untuk kategori/merchant, dan sebaiknya sudah disanitasi.

## Output AI

Output harus JSON terstruktur.

Format:

```json
{
  "summary": "Ringkasan 3-5 kalimat.",
  "cashflowHealth": {
    "score": 0,
    "label": "good | watch | risky",
    "reason": "Alasan singkat."
  },
  "insights": [
    {
      "type": "overspending | recurring | anomaly | saving_opportunity | category_pattern",
      "severity": "low | medium | high",
      "title": "Judul insight",
      "description": "Penjelasan singkat",
      "amount": 0,
      "evidenceTransactionIds": ["txn_1"],
      "suggestedAction": "Aksi praktis"
    }
  ],
  "categoryNotes": [
    {
      "category": "Food and drink",
      "total": 0,
      "note": "Catatan kategori"
    }
  ],
  "nextMonthSuggestions": [
    "Saran praktis"
  ],
  "disclaimer": "Analisis ini bersifat informasi, bukan nasihat keuangan profesional."
}
```

## Jenis insight

### 1. Pembelian berlebihan

Deteksi:
- Frekuensi tinggi pada merchant/kategori.
- Total kategori jauh lebih besar dari baseline user.
- Banyak transaksi kecil dalam hari yang sama.

Contoh:
- 18 transaksi coffee shop dalam 1 bulan.
- 30 persen pengeluaran non-tagihan ada di satu kategori.

### 2. Pemborosan

Deteksi:
- Pengeluaran discretionary besar.
- Merchant non-esensial berulang.
- Transaksi impulse kecil tetapi total besar.

Output harus hati-hati:
- Jangan menyalahkan user.
- Gunakan bahasa praktis.
- Contoh: "Kategori makanan/minuman terlihat paling mudah dioptimalkan."

### 3. Biaya berulang

Deteksi:
- Merchant sama, nominal mirip, interval mirip.
- Tagihan/subscription bulanan.
- Transfer otomatis.

Insight:
- List biaya berulang.
- Total bulanan.
- Potensi review.

### 4. Anomali

Deteksi:
- Transaksi sangat besar dibanding transaksi lain.
- Merchant baru dengan nominal besar.
- Banyak transaksi di hari yang sama.
- Fee tidak biasa.

Anomali tidak selalu fraud. Label harus "perlu dicek", bukan tuduhan.

### 5. Cashflow health

Hitung:
- netCashflow = income - expense.
- expenseRatio = expense / income.
- discretionaryRatio.
- recurringRatio.

Label awal:
- good: income > expense dan recurring terkendali.
- watch: expense mendekati income atau discretionary tinggi.
- risky: expense > income atau banyak transaksi anomali.

## Pre-analysis rule engine

Sebelum AI:
- Hitung semua aggregate di backend.
- Buat candidate insight rule-based.
- AI hanya menyusun narasi dan prioritas.

Candidate insight fields:
- type
- metric
- amount
- transactionIds
- confidence

## Prompt strategy

System prompt:
- Kamu adalah analis arus kas personal.
- Gunakan hanya data yang diberikan.
- Jangan membuat transaksi baru.
- Jangan memberi nasihat investasi.
- Jawab dalam Bahasa Indonesia.
- Output wajib JSON valid.

User prompt:
- Berisi summary aggregate dan candidate insight.
- Berisi daftar evidence transaction ids.
- Berisi preferensi bahasa: jelas, sopan, praktis.

## Privacy

Sebelum dikirim ke AI:
- Mask account number.
- Jangan kirim nama lengkap jika tidak dibutuhkan.
- Jangan kirim raw PDF.
- Merchant/deskripsi boleh dipakai karena relevan, tetapi simpan audit log.

## AI failure handling

Jika AI gagal:
- Simpan status failed.
- Tampilkan ringkasan rule-based sementara.
- User bisa retry.
- Jangan hilangkan transaksi yang sudah diparsing.

Jika JSON invalid:
- Retry dengan prompt repair.
- Jika tetap gagal, simpan raw response untuk debug internal, bukan ditampilkan ke user.

## Evaluation

Setiap insight dinilai:
- Ada evidence atau tidak.
- Amount benar atau tidak.
- Tidak ada hallucination.
- Bahasa jelas.
- Saran bisa dilakukan.

Manual QA:
- Upload fixture BCA.
- Bandingkan total aggregate.
- Cek insight tidak menyebut merchant yang tidak ada.
- Cek semua transaction id evidence valid.
