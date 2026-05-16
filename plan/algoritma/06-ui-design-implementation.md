# 06 UI dan Design Implementation

## Arah desain

Ikuti plan/desain.md:
- Poppins.
- Solid white color.
- Rounded.
- Modern.
- Bersih dan profesional.

KasFlow punya dua area UI:
- Public landing page untuk menjelaskan cara kerja sebelum user login.
- Dashboard app setelah login untuk upload, status proses, review transaksi, dan insight.

Landing page boleh punya storytelling, tetapi tetap harus edukatif dan spesifik. Jangan membuat landing page yang hanya berisi klaim marketing tanpa menjelaskan upload, parsing, AI analysis, dan report.

## Struktur route

Routes MVP:
- / sebagai landing page publik.
- /login
- /register atau toggle register di /login
- /dashboard
- /imports
- /imports/new
- /imports/:importId
- /imports/:importId/review
- /reports/:reportId
- /settings

Default setelah login:
- Jika belum ada import: redirect ke /imports/new atau dashboard dengan upload panel besar.
- Jika sudah ada import: dashboard ringkasan terbaru.

Landing route behavior:
- User belum login membuka /: tampilkan landing page.
- User klik "Coba KasFlow": arahkan ke /login?next=/imports/new.
- User sudah login membuka /: boleh tampilkan tombol "Masuk dashboard" atau redirect ke /dashboard.

## Landing page implementation

Landing page wajib memakai Poppins, solid white, rounded cards, dan visual yang menjelaskan produk.

Section:
- Hero dengan headline, subcopy, CTA utama, CTA sekunder.
- Cara kerja dengan 5 step: Login, Upload BCA, Parsing, AI Analysis, Report.
- Preview report mockup dengan KPI dan insight contoh.
- Contoh insight cards: pembelian berlebihan, pemborosan, biaya berulang, anomali.
- Bank support: BCA first, Mandiri/BRI soon.
- Security/trust section.
- Final CTA.

Landing copy:
- Headline: "KasFlow membaca arus uang bulananmu."
- Subcopy: "Upload laporan BCA bulanan, lalu KasFlow bantu menemukan pola pengeluaran, pemborosan, pembelian berlebihan, biaya berulang, dan peluang berhemat."
- CTA utama: "Coba KasFlow".
- CTA sekunder: "Lihat cara kerja".

Komponen landing:
- PublicHeader
- LandingHero
- HowItWorksSteps
- InsightPreviewCards
- ReportPreviewMockup
- SupportedBanks
- SecuritySection
- FinalCta

## Komponen dari plan/component.md

### Upload

Source:
- plan/component.md/upload.md

Adaptasi:
- Jadikan komponen upload utama KasFlow.
- Terima PDF BCA dulu.
- Tambahkan progress state.
- Tambahkan error state khusus PDF bank.
- Tambahkan table preview setelah parsing.
- Gunakan style putih solid, bukan terlalu ramai.

Komponen final:
- StatementUploadDropzone
- UploadProgressSteps
- ImportStatusCard
- ParsedTransactionTable

### Login dan daftar

Source:
- plan/component.md/login&daftar.md

Adaptasi:
- Pakai Poppins.
- Copy disesuaikan ke KasFlow.
- Tetap sambungkan ke Better Auth.
- Jangan terlalu kartun jika mengganggu trust finansial.
- Animasi boleh ringan.

Komponen final:
- AuthShell
- SignInForm
- SignUpForm
- PasswordInput

### Navbar desktop/mobile

Source:
- plan/component.md/navbar/Desktop.md
- plan/component.md/navbar/Mobile.md

Adaptasi:
- Desktop: gunakan navigation ringkas untuk dashboard.
- Mobile: gunakan menu bawah atau compact menu.
- Jangan pakai efek 3D terlalu berat di area data.

Menu:
- Dashboard
- Upload
- Reports
- Settings

### Theme button

Source:
- plan/component.md/Themebutton.md

Adaptasi:
- Default light.
- Dark mode optional.
- Jika dark mode dibuat, tetap tidak mengganggu brand putih.

### Toast

Source:
- plan/component.md/toast.md

Toast wajib:
- Upload berhasil.
- Upload gagal.
- Parser butuh password.
- Parser selesai.
- AI analysis selesai.
- Export berhasil.
- Retry gagal.

### Spinner/loading

Source:
- plan/component.md/spinerload.md

Adaptasi:
- Loading upload dan AI boleh memakai versi loader.
- Untuk proses panjang, jangan hanya spinner. Tampilkan progress step.

### Progress indicator

Source:
- plan/component.md/Progress-Indicator.md

Tahap:
- Upload
- Parse
- Review
- Analyze
- Report

### AI chat/insight box

Source:
- plan/component.md/boxchatai.md

Adaptasi:
- Jangan jadikan chat sebagai fitur utama MVP.
- Mulai sebagai insight panel.
- Later bisa menjadi "Tanya KasFlow" untuk bertanya tentang laporan.

### Download button

Source:
- plan/component.md/unduhhasilbutton.md

Adaptasi:
- Pakai untuk PDF/CSV export.
- Status: idle, preparing, downloading, done, failed.

### 404

Source:
- plan/component.md/404.md

Adaptasi:
- Hilangkan orb/gradient dominan.
- White surface, clear CTA back to dashboard.

## Design tokens

CSS global:
- Font family: Poppins.
- Background: #FFFFFF.
- Foreground: #0F172A.
- Muted foreground: #64748B.
- Border: #E5E7EB.
- Card: #FFFFFF.
- Primary: #111827.
- Radius default: 12px.

Spacing:
- Page padding desktop: 32px.
- Page padding mobile: 16px.
- Card padding: 20px sampai 24px.
- Table row height: 48px minimal.

Typography:
- H1 dashboard: 28px sampai 32px.
- Section title: 18px sampai 20px.
- Body: 14px sampai 16px.
- Table text: 13px sampai 14px.
- Label: 12px sampai 13px.

## Dashboard MVP layout

Top area:
- Greeting.
- Current month.
- Upload CTA.

KPI row:
- Income.
- Expense.
- Net cashflow.
- Cashflow health.

Main content:
- Left: spending by category.
- Right: top insights.
- Bottom: transaction preview and recent imports.

## Upload page layout

Top:
- Title "Upload laporan BCA".
- Description singkat.

Main:
- Dropzone.
- File requirements.
- Bank selector locked/default BCA.
- Optional statement password field hidden until needed.

After upload:
- Progress indicator.
- Status log.
- Review table link.

## Report page layout

Sections:
- Summary.
- Cashflow health.
- Pemborosan/pembelian berlebihan.
- Recurring expenses.
- Category breakdown.
- Transaction evidence.
- Download actions.

## Accessibility

- Semua button punya accessible label.
- Upload dropzone bisa dipakai keyboard.
- Error field punya teks jelas.
- Table bisa discan dengan heading yang benar.
- Warna status tidak menjadi satu-satunya indikator.

## Implementation note

Contoh komponen di plan memakai import seperti:

```ts
import { Button } from "@/components/ui/button";
```

Repo ini memakai shared UI package. Jika komponen masuk shared UI, import harus disesuaikan menjadi:

```ts
import { Button } from "@KasFlow/ui/components/button";
```

Jika komponen hanya dipakai web app, boleh masuk:
- apps/web/src/components
- apps/web/src/features/imports
- apps/web/src/features/reports
