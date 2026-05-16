# 07 Roadmap Implementasi

Roadmap ini dibuat berurutan. Jangan melompat ke AI sebelum parser dan data transaksi stabil.

## Phase 0 - Fondasi plan dan audit repo

- [x] Baca plan component.
- [x] Catat desain utama di plan/desain.md.
- [x] Buat plan algoritma.
- [ ] Audit current schema dan route sebelum implementasi.
- [ ] Tentukan storage lokal MVP.
- [ ] Tentukan library PDF extraction.

Output:
- Plan jelas.
- Tidak ada perubahan kode aplikasi.

## Phase 1 - Design system KasFlow

- [ ] Tambahkan Poppins global.
- [ ] Sesuaikan token warna ke solid white.
- [ ] Sesuaikan radius modern.
- [ ] Rapikan Button/Input/Card agar sesuai KasFlow.
- [ ] Integrasikan Toast final.
- [ ] Integrasikan Loader/Progress Indicator final.

Validasi:
- `bun run check-types`
- Visual desktop/mobile.

## Phase 2 - Public Landing dan Auth UX

- [ ] Buat landing page di route /.
- [ ] Tambahkan hero KasFlow dan CTA "Coba KasFlow".
- [ ] Tambahkan section cara kerja.
- [ ] Tambahkan preview insight/report.
- [ ] Tambahkan section bank support BCA, Mandiri coming soon, BRI coming soon.
- [ ] Tambahkan security/trust section.
- [ ] CTA unauthenticated mengarah ke /login?next=/imports/new.
- [ ] CTA authenticated mengarah ke /imports/new atau /dashboard.
- [ ] Ubah login/register ke desain KasFlow.
- [ ] Pastikan Better Auth tetap bekerja.
- [ ] Tambahkan redirect jika user sudah login.
- [ ] Tambahkan empty dashboard user baru.
- [ ] Tambahkan logout yang jelas.

Acceptance:
- User baru membuka / dan melihat landing page, bukan langsung form login.
- CTA "Coba KasFlow" membawa user belum login ke login/register.
- User bisa register.
- User bisa login.
- User bisa logout.
- Dashboard private tidak bisa diakses tanpa session.

## Phase 3 - Upload MVP BCA

- [ ] Buat feature imports.
- [ ] Buat upload page.
- [ ] Integrasikan file upload dari plan/component.md/upload.md.
- [ ] Validasi PDF client-side.
- [ ] Buat API create import.
- [ ] Buat API upload file.
- [ ] Simpan metadata file.
- [ ] Simpan file lokal/server storage.
- [ ] Tampilkan upload status.

Acceptance:
- User login bisa upload 1 PDF BCA.
- File tersimpan.
- Import status tercatat di DB.
- User lain tidak bisa melihat import tersebut.

## Phase 4 - Parser BCA

- [ ] Pilih library PDF extraction.
- [ ] Buat parser adapter interface.
- [ ] Buat BCA detector.
- [ ] Buat BCA text extraction.
- [ ] Buat row segmentation.
- [ ] Buat amount/date parser.
- [ ] Buat balance reconciliation.
- [ ] Simpan raw rows.
- [ ] Simpan normalized transactions.
- [ ] Buat parser confidence.
- [ ] Buat warning/error system.

Acceptance:
- Parser tidak crash untuk file rusak/unsupported.
- Parser bisa menampilkan transaksi dari sample BCA yang didukung.
- Import status berubah sesuai hasil.

## Phase 5 - Review transaksi

- [ ] Buat transaction table.
- [ ] Buat filter search.
- [ ] Buat category dropdown.
- [ ] Buat merchant edit.
- [ ] Buat mark transfer/internal.
- [ ] Buat mark ignored.
- [ ] Buat summary total debit/credit.
- [ ] Buat warning panel untuk transaksi confidence rendah.

Acceptance:
- User bisa melihat semua transaksi hasil parser.
- User bisa mengoreksi kategori.
- Koreksi user tersimpan.

## Phase 6 - Categorization engine

- [ ] Buat system categories.
- [ ] Buat merchant alias rules.
- [ ] Buat keyword rules BCA.
- [ ] Buat fallback category Other.
- [ ] Buat confidence category.
- [ ] Siapkan AI categorization optional untuk ambiguous merchant.

Acceptance:
- Transaksi umum punya kategori awal.
- User correction bisa dipakai sebagai rule berikutnya.

## Phase 7 - AI analysis

- [ ] Buat aggregate builder.
- [ ] Buat candidate insight rule-based.
- [ ] Buat prompt contract JSON.
- [ ] Buat AI analysis service.
- [ ] Simpan analysis report.
- [ ] Simpan insights.
- [ ] Buat retry jika AI gagal.
- [ ] Buat fallback rule-based summary jika AI error.

Acceptance:
- AI output JSON valid.
- Insight punya evidence transaction ids.
- Tidak ada insight tanpa dasar data.

## Phase 8 - Report dashboard

- [ ] Buat report page.
- [ ] Buat KPI cards.
- [ ] Buat category breakdown.
- [ ] Buat top merchant.
- [ ] Buat insight cards.
- [ ] Buat recurring expense list.
- [ ] Buat anomaly list.
- [ ] Buat evidence transaction drawer/table.

Acceptance:
- User bisa memahami pengeluaran bulan tersebut dari 1 halaman.
- Semua insight bisa ditelusuri ke transaksi.

## Phase 9 - Export

- [ ] Export CSV transaksi normalisasi.
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
