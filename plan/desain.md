KasFlow Design Direction

Tujuan desain:
- Website bernama KasFlow harus terasa modern, bersih, tenang, dan profesional untuk analisis keuangan pribadi.
- Fokus utama adalah kepercayaan, keterbacaan transaksi, dan proses upload yang jelas.
- Website wajib punya landing page publik yang menjelaskan KasFlow bekerja bagaimana sebelum user login.
- Landing page tidak boleh terlalu marketing kosong. Landing harus edukatif, langsung menjelaskan problem, cara kerja, contoh insight, keamanan data, dan CTA untuk mencoba.
- Saat user klik CTA mencoba, user diarahkan ke login/register. Setelah login, layar pertama harus langsung membantu user mengupload dan melihat status analisis.

Gaya visual utama:
- Font utama: Poppins untuk seluruh aplikasi.
- Warna dasar: solid white.
- Background utama: putih solid, bukan gradient.
- Surface/card: putih, border abu-abu halus, shadow sangat ringan.
- Radius: rounded modern. Default 12px untuk card/form/upload panel, 999px untuk pill/button tertentu, 10px untuk input dan tombol.
- Accent warna dipakai secukupnya untuk status, chart, dan CTA. Rekomendasi:
  - Primary: #111827 atau #0F172A untuk teks dan tombol utama.
  - Success: #16A34A untuk transaksi sehat/sukses.
  - Warning: #F59E0B untuk pemborosan/peringatan.
  - Danger: #DC2626 untuk anomali berat.
  - Info: #2563EB untuk proses analisis.

Prinsip layout:
- Public landing page memakai struktur naratif yang jelas: hero, cara kerja, contoh hasil analisis, bank yang didukung, keamanan data, dan CTA.
- Desktop menggunakan layout dashboard: sidebar/nav ringkas, area konten luas, panel upload dan insight mudah dipindai.
- Mobile menggunakan bottom navigation atau mobile menu dari plan component.
- Gunakan spacing lega tapi tetap efisien karena data transaksi perlu discan cepat.
- Hindari elemen dekoratif berlebihan, orb, background gelap, atau gradient dominan.
- Semua tabel transaksi harus mudah dibaca, dengan kolom tanggal, merchant/deskripsi, kategori, debit, kredit, saldo, dan confidence.

Landing page publik:
- Route utama: /.
- Tujuan: menjelaskan kepada user baru bahwa KasFlow membaca laporan bulanan bank dan mengubahnya menjadi insight pengeluaran.
- Hero headline: "KasFlow membaca arus uang bulananmu."
- Subcopy: "Upload laporan BCA bulanan, lalu KasFlow bantu menemukan pola pengeluaran, pemborosan, pembelian berlebihan, biaya berulang, dan peluang berhemat."
- CTA utama: "Coba KasFlow".
- CTA sekunder: "Lihat cara kerja".
- CTA utama mengarah ke login/register.
- Jika user sudah login, CTA boleh mengarah langsung ke dashboard atau upload baru.
- Landing tetap memakai solid white background, Poppins, rounded cards, dan visual dashboard/report mockup yang relevan.

Section landing yang wajib ada:
- Hero: nama KasFlow, value singkat, CTA.
- Cara kerja: Login -> Upload laporan BCA -> KasFlow parsing transaksi -> AI membuat insight -> User melihat report.
- Contoh insight: pembelian berlebihan, pemborosan kategori, biaya berulang, anomali transaksi.
- Bank support: BCA sebagai prioritas awal, Mandiri dan BRI coming soon.
- Keamanan data: file dan transaksi hanya milik user, tidak dibagikan ke user lain, data sensitif diproses dengan scope minimal.
- Preview report: card ringkas berisi total pemasukan, total pengeluaran, cashflow health, dan 3 insight contoh.
- Final CTA: "Mulai analisis laporan BCA".

Komponen dari plan/component.md yang menjadi acuan:
- upload.md: dasar flow upload file dan table upload.
- login&daftar.md: dasar halaman login/register, tetapi harus disesuaikan dengan brand KasFlow dan desain putih solid.
- navbar/Desktop.md dan navbar/Mobile.md: acuan navigasi desktop/mobile, perlu diadaptasi agar tidak terlalu dekoratif.
- Themebutton.md: boleh dipakai sebagai optional theme control, tetapi default aplikasi tetap light/white.
- toast.md: notifikasi upload, parsing, dan analisis.
- spinerload.md: loading state untuk upload, parser, dan AI analysis.
- Progress-Indicator.md: tahapan upload -> parsing -> review -> AI analysis -> report.
- boxchatai.md: acuan AI insight/chat panel setelah analisis selesai.
- unduhhasilbutton.md: tombol unduh laporan hasil analisis.
- 404.md: halaman not found, perlu diubah menjadi versi putih solid.

Brand copy awal:
- Nama produk: KasFlow.
- Tagline pendek: "Baca arus uangmu dengan jelas."
- Fokus pesan: upload laporan bulanan, KasFlow mengubah transaksi menjadi insight pengeluaran yang mudah dipahami.

Aturan implementasi desain:
- Poppins didefinisikan global di shared UI CSS.
- Komponen shared ditempatkan di packages/ui/src/components.
- Komponen app-specific ditempatkan di apps/web/src/components atau apps/web/src/features.
- Import dari contoh plan perlu diubah dari "@/components/ui/*" menjadi "@KasFlow/ui/components/*" jika komponen masuk shared UI.
- Jangan copy mentah desain yang memakai gradient/orb gelap jika bertentangan dengan arahan solid white.
