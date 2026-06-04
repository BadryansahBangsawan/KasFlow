# 07 Roadmap Implementasi

Roadmap ini dibuat berurutan. Jangan melompat ke AI sebelum parser dan data transaksi stabil.

## Phase 0 - Fondasi plan dan audit repo

- [x] Baca plan component.
- [x] Catat desain utama di plan/desain.md.
- [x] Buat plan algoritma.
- [x] Audit current schema dan route sebelum implementasi.
- [x] Tentukan storage lokal MVP. (local filesystem di apps/server/storage/)
- [x] Tentukan library PDF extraction. (pdf-parse v2)

Output:
- Plan jelas.
- Tidak ada perubahan kode aplikasi.

## Phase 1 - Design system KasFlow

- [x] Tambahkan Poppins global. (packages/ui/src/styles/globals.css)
- [x] Sesuaikan token warna ke solid white.
- [x] Sesuaikan radius modern.
- [x] Rapikan Button/Input/Card agar sesuai KasFlow.
- [x] Integrasikan Toast final. (Sonner)
- [x] Integrasikan Loader/Progress Indicator final.

Validasi:
- `bun run check-types`
- Visual desktop/mobile.

## Phase 2 - Public Landing dan Auth UX

- [x] Buat landing page di route /.
- [x] Tambahkan hero KasFlow dan CTA "Coba KasFlow".
- [x] Tambahkan section cara kerja.
- [x] Tambahkan preview insight/report.
- [x] Tambahkan section bank support BCA, Mandiri coming soon, BRI coming soon.
- [x] Tambahkan security/trust section.
- [x] CTA unauthenticated mengarah ke /login?next=/imports/new.
- [x] CTA authenticated mengarah ke /imports/new atau /dashboard.
- [x] Ubah login/register ke desain KasFlow.
- [x] Pastikan Better Auth tetap bekerja.
- [x] Tambahkan redirect jika user sudah login.
- [x] Tambahkan empty dashboard user baru.
- [x] Tambahkan logout yang jelas.

Acceptance:
- User baru membuka / dan melihat landing page, bukan langsung form login.
- CTA "Coba KasFlow" membawa user belum login ke login/register.
- User bisa register.
- User bisa login.
- User bisa logout.
- Dashboard private tidak bisa diakses tanpa session.

## Phase 3 - Upload MVP BCA

- [x] Buat feature imports.
- [x] Buat upload page. (apps/web/src/routes/imports.new.tsx)
- [x] Integrasikan file upload dari plan/component.md/upload.md.
- [x] Validasi PDF client-side.
- [x] Buat API create import. (POST /api/imports/bca)
- [x] Buat API upload file.
- [x] Simpan metadata file. (statement_files table)
- [x] Simpan file lokal/server storage. (apps/server/storage/)
- [x] Tampilkan upload status.

Acceptance:
- User login bisa upload 1 PDF BCA.
- File tersimpan.
- Import status tercatat di DB.
- User lain tidak bisa melihat import tersebut.

## Phase 4 - Parser BCA

- [x] Pilih library PDF extraction. (pdf-parse v2)
- [x] Buat parser adapter interface.
- [x] Buat BCA detector.
- [x] Buat BCA text extraction.
- [x] Buat row segmentation.
- [x] Buat amount/date parser.
- [x] Buat balance reconciliation.
- [x] Simpan raw rows. (raw_transaction_rows)
- [x] Simpan normalized transactions. (transactions)
- [x] Buat parser confidence.
- [x] Buat warning/error system.

Acceptance:
- Parser tidak crash untuk file rusak/unsupported.
- Parser bisa menampilkan transaksi dari sample BCA yang didukung.
- Import status berubah sesuai hasil.

## Phase 5 - Review transaksi

- [x] Buat transaction table. (imports.$importId.tsx)
- [ ] Buat filter search.
- [ ] Buat category dropdown.
- [ ] Buat merchant edit.
- [ ] Buat mark transfer/internal.
- [ ] Buat mark ignored.
- [x] Buat summary total debit/credit.
- [x] Buat warning panel untuk transaksi confidence rendah.

Acceptance:
- User bisa melihat semua transaksi hasil parser.
- User bisa mengoreksi kategori.
- Koreksi user tersimpan.

## Phase 6 - Categorization engine

- [x] Buat system categories.
- [x] Buat merchant alias rules.
- [x] Buat keyword rules BCA. (CATEGORY_RULES di bca.ts)
- [x] Buat fallback category Other.
- [x] Buat confidence category.
- [ ] Siapkan AI categorization optional untuk ambiguous merchant.

Acceptance:
- Transaksi umum punya kategori awal.
- User correction bisa dipakai sebagai rule berikutnya.

## Phase 7 - AI analysis

- [x] Buat aggregate builder. (analysis.service.ts buildAggregates)
- [x] Buat candidate insight rule-based. (buildCandidateInsights)
- [x] Buat prompt contract JSON. (callClaudeAnalysis)
- [x] Buat AI analysis service. (packages/api/src/services/analysis.service.ts)
- [x] Simpan analysis report. (analysis_reports table)
- [x] Simpan insights. (analysis_insights table)
- [x] Buat retry jika AI gagal. (triggerAnalysis reset + re-run)
- [x] Buat fallback rule-based summary jika AI error. (buildFallbackOutput)

Acceptance:
- AI output JSON valid.
- Insight punya evidence transaction ids.
- Tidak ada insight tanpa dasar data.

## Phase 8 - Report dashboard

- [x] Buat report page. (apps/web/src/routes/reports.$importId.tsx)
- [x] Buat KPI cards. (pemasukan, pengeluaran, net cashflow, health)
- [x] Buat category breakdown. (CategoryBreakdown component)
- [ ] Buat top merchant.
- [x] Buat insight cards. (InsightCard component dengan expand/collapse)
- [ ] Buat recurring expense list.
- [ ] Buat anomaly list.
- [x] Buat evidence transaction drawer/table. (expand insight → transaksi terkait)

Acceptance:
- User bisa memahami pengeluaran bulan tersebut dari 1 halaman.
- Semua insight bisa ditelusuri ke transaksi.

## Phase 9 - Export

- [x] Export CSV transaksi normalisasi.
- [ ] Export PDF report.
- [ ] Integrasikan download button.
- [ ] Simpan export log.

Acceptance:
- User bisa download CSV.
- User bisa download report ringkas.

## Phase 10 - Mandiri dan BRI later

Jangan dikerjakan sebelum BCA stabil.

- [ ] Kumpulkan sample Mandiri.
- [ ] Kumpulkan sample BRI.
- [ ] Buat mandiri parser adapter.
- [ ] Buat bri parser adapter.
- [ ] Tambahkan bank selector aktif.
- [ ] Tambahkan fixture tests tiap bank.

Acceptance:
- Parser multi-bank tidak merusak BCA.

## Phase 11 - Hardening

- [ ] Rate limit upload.
- [ ] Rate limit AI analysis.
- [ ] Ownership checks di semua API.
- [ ] Delete import dan file.
- [ ] Audit logs.
- [ ] Error boundary frontend.
- [ ] Production storage.
- [ ] Backup DB.

## Validation commands

Minimal setiap selesai phase:

```bash
bun run check-types
```

Untuk schema/API:

```bash
bun run db:generate
bun run db:push
bun run check-types
```

Untuk frontend:

```bash
bun run dev:web
```

Untuk server:

```bash
bun run dev:server
```
