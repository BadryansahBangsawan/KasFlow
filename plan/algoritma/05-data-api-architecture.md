# 05 Data Model, API, dan Arsitektur

## Prinsip arsitektur

- Semua data user harus scoped by userId.
- Upload, parsing, dan analysis dipisahkan sebagai state machine.
- File asli disimpan terpisah dari transaksi hasil parsing.
- Parser harus idempotent.
- AI analysis bisa diulang tanpa upload ulang.
- Multi-bank disiapkan dari awal lewat bankCode dan parser adapter.

## Data model

Auth table sudah tersedia dari Better Auth:
- user
- session
- account
- verification

Table baru yang dibutuhkan:

### bank_accounts

Menyimpan rekening yang terdeteksi dari statement.

Fields:
- id
- userId
- bankCode
- accountMask
- accountName
- currency
- createdAt
- updatedAt

Unique:
- userId + bankCode + accountMask

### statement_imports

Satu proses upload dan parsing.

Fields:
- id
- userId
- bankAccountId nullable
- bankCode
- periodStart nullable
- periodEnd nullable
- status
- parserMode
- parserVersion
- importConfidence
- totalTransactions
- totalDebit
- totalCredit
- openingBalance nullable
- closingBalance nullable
- errorCode nullable
- errorMessage nullable
- createdAt
- updatedAt

Status:
- uploaded
- validating
- needs_password
- parsing
- parsed
- needs_review
- analyzing
- completed
- failed

### statement_files

Metadata file upload.

Fields:
- id
- importId
- userId
- originalName
- mimeType
- sizeBytes
- sha256
- storageKey
- pageCount nullable
- isEncrypted
- hasTextLayer
- createdAt

### raw_transaction_rows

Data mentah hasil ekstraksi.

Fields:
- id
- importId
- userId
- pageNumber
- rowNumber
- rawText
- parsedJson
- warningCode nullable
- confidence
- createdAt

### transactions

Transaksi normalisasi.

Fields:
- id
- importId
- userId
- bankAccountId nullable
- bankCode
- transactionDate
- postingDate nullable
- descriptionOriginal
- descriptionClean
- merchantName nullable
- transactionType
- direction
- amount
- currency
- balanceAfter nullable
- categoryId nullable
- categoryName
- confidence
- sourcePage nullable
- sourceRow nullable
- duplicateHash
- userReviewed
- createdAt
- updatedAt

### categories

Kategori sistem dan kategori custom user.

Fields:
- id
- userId nullable
- name
- type
- color
- icon
- isSystem
- createdAt

### merchant_aliases

Mapping merchant/deskripsi ke kategori.

Fields:
- id
- userId nullable
- bankCode nullable
- pattern
- merchantName
- categoryId
- confidence
- createdAt
- updatedAt

### analysis_reports

Hasil AI analysis per import.

Fields:
- id
- importId
- userId
- status
- modelName nullable
- inputSummaryJson
- outputJson
- summary
- cashflowHealthScore
- cashflowHealthLabel
- createdAt
- updatedAt

### insights

Insight terstruktur agar mudah ditampilkan/filter.

Fields:
- id
- reportId
- importId
- userId
- type
- severity
- title
- description
- amount nullable
- evidenceTransactionIdsJson
- suggestedAction nullable
- createdAt

### parsing_errors

Log error dan warning parser.

Fields:
- id
- importId
- userId
- level
- code
- message
- contextJson nullable
- createdAt

## API routers

### auth

Sudah memakai Better Auth.

Kebutuhan tambahan:
- session guard untuk semua route private.
- helper getCurrentUser.

### imports router

Procedures:
- createImport
- getImport
- listImports
- deleteImport
- retryImport
- submitPassword
- markReviewed

### upload router

Procedures:
- requestUpload
- completeUpload
- directUpload for MVP local/server upload

MVP bisa mulai dengan directUpload jika deployment belum memakai object storage.

### transactions router

Procedures:
- listByImport
- updateCategory
- updateMerchant
- markAsTransfer
- markAsIgnored
- bulkUpdateCategory

### analysis router

Procedures:
- startAnalysis
- getReport
- retryAnalysis
- listInsights

### export router

Procedures:
- exportTransactionsCsv
- exportReportPdf

## Background jobs

MVP bisa memakai in-process job sederhana.

Later:
- Queue terpisah.
- Retry policy.
- Job logs.

Job types:
- validate_statement_file
- parse_bca_statement
- normalize_transactions
- categorize_transactions
- generate_ai_analysis
- generate_export_pdf

## Parser adapter

Interface:

```ts
type BankStatementParser = {
  bankCode: "bca" | "mandiri" | "bri";
  detect(input: FileExtraction): Promise<DetectionResult>;
  parse(input: FileExtraction): Promise<ParseResult>;
};
```

BCA adapter dibuat dulu.

Mandiri/BRI nanti cukup menambah adapter baru tanpa mengubah flow import.

## Storage

MVP lokal:
- Simpan file di folder server storage.
- Simpan path sebagai storageKey.

Production:
- Object storage.
- storageKey tidak boleh URL publik permanen.
- Gunakan signed URL jika perlu download.

## Security

Wajib:
- Semua import/query difilter userId.
- Jangan expose storageKey user lain.
- Validasi MIME dan ukuran file.
- Rate limit upload dan AI analysis.
- Audit log untuk analysis.
- Jangan simpan password PDF plaintext.

Password PDF:
- Gunakan hanya untuk membuka file.
- Jangan simpan jika tidak perlu.
- Jika harus retry job, simpan encrypted sementara dan hapus setelah parsing selesai.

## Observability

Log event:
- upload_started
- upload_completed
- parse_started
- parse_completed
- parse_failed
- analysis_started
- analysis_completed
- analysis_failed

Metrics:
- parse duration.
- analysis duration.
- transactions count.
- parser confidence.
- failed imports by error code.
