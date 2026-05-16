# KasFlow Algorithm Plan

Dokumen ini adalah source of truth untuk membangun KasFlow.

KasFlow adalah website analisis laporan keuangan bulanan. User login, upload file laporan dari aplikasi bank, lalu sistem mengekstrak transaksi, mengelompokkan pengeluaran, dan AI memberi insight seperti pembelian berlebihan, pemborosan, biaya berulang, anomali, serta rekomendasi penghematan.

Prioritas bank:
1. BCA / myBCA lebih dulu.
2. Mandiri setelah parser BCA stabil.
3. BRI setelah arsitektur multi-bank siap.

Stack repo saat ini:
- Web: React, TanStack Router, Vite.
- API: Hono, tRPC.
- Auth: Better Auth.
- Database: Drizzle ORM dengan SQLite/Turso.
- UI: shared shadcn-style components di packages/ui.
- Package manager/runtime: Bun.

Plan yang sudah dibaca:
- plan/component.md/upload.md
- plan/component.md/login&daftar.md
- plan/component.md/navbar/Desktop.md
- plan/component.md/navbar/Mobile.md
- plan/component.md/Themebutton.md
- plan/component.md/toast.md
- plan/component.md/spinerload.md
- plan/component.md/Progress-Indicator.md
- plan/component.md/boxchatai.md
- plan/component.md/unduhhasilbutton.md
- plan/component.md/footer.md
- plan/component.md/404.md
- plan/component.md/button.md
- plan/component.md/cta.md
- plan/contohfileuploads-file's/bca/contohdata.pdf
- plan/contohfileuploads-file's/bca/contohdata.md
- plan/desain.md

Catatan penting dari plan saat ini:
- plan/desain.md sebelumnya kosong, sekarang diisi sebagai arah desain.
- contoh BRI dan Mandiri masih kosong, jadi MVP jangan menebak format bank tersebut.
- contoh BCA PDF ada, tetapi perlu divalidasi saat implementasi parser karena PDF bank sering terenkripsi, berbasis teks, atau berbasis gambar.

Urutan dokumen:
- 01-produk-dan-scope.md: visi produk, MVP, non-goal, modul.
- 02-flow-user-upload-bca.md: alur user dari login sampai laporan analisis.
- 03-parser-bca-normalisasi.md: algoritma ekstraksi dan normalisasi transaksi BCA.
- 04-ai-analysis.md: desain AI analysis dan insight.
- 05-data-api-architecture.md: data model, API, background job, security.
- 06-ui-design-implementation.md: implementasi desain berdasarkan plan/component.md dan plan/desain.md.
- 07-roadmap-implementasi.md: checklist fase kerja dari awal sampai multi-bank.

Definisi selesai untuk MVP:
- User baru melihat landing page publik yang menjelaskan cara kerja KasFlow sebelum login.
- User bisa register/login.
- User bisa upload laporan BCA bulanan.
- Sistem menyimpan file dan status import.
- Sistem mengekstrak transaksi BCA menjadi data terstruktur.
- User bisa review transaksi hasil parsing.
- Sistem menghasilkan insight AI dengan bukti transaksi.
- User bisa melihat dashboard ringkas dan mengunduh laporan.
- Semua flow punya loading, error, empty state, dan toast yang jelas.
