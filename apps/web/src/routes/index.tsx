import { Button } from "@KasFlow/ui/components/button";
import { CinematicFooter } from "@KasFlow/ui/components/motion-footer";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BarChart3,
	FileText,
	LockKeyhole,
	Sparkles,
	UploadCloud,
} from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

const steps = [
	{
		title: "Login ke KasFlow",
		description:
			"Akun menjaga file laporan dan transaksi tetap terikat ke user yang benar.",
	},
	{
		title: "Upload laporan BCA",
		description:
			"MVP menerima PDF laporan bulanan BCA atau myBCA terlebih dahulu.",
	},
	{
		title: "Parser merapikan transaksi",
		description:
			"Tanggal, deskripsi, debit, kredit, saldo, merchant, dan kategori awal disusun.",
	},
	{
		title: "AI membaca pola",
		description:
			"KasFlow mencari pemborosan, pembelian berlebihan, biaya berulang, dan anomali.",
	},
	{
		title: "Report siap dipakai",
		description:
			"User bisa review transaksi dan melihat ringkasan arus kas bulanan.",
	},
];

const insightCards = [
	{
		title: "Pembelian berlebihan",
		description:
			"Deteksi frekuensi merchant atau kategori yang terlalu sering dalam satu bulan.",
	},
	{
		title: "Pemborosan kategori",
		description:
			"Tandai kategori yang mengambil porsi besar dari pengeluaran non-esensial.",
	},
	{
		title: "Biaya berulang",
		description:
			"Temukan subscription, tagihan, dan transfer rutin yang perlu direview.",
	},
	{
		title: "Anomali transaksi",
		description:
			"Sorot transaksi besar atau tidak biasa agar user bisa cek ulang.",
	},
];

function HomeComponent() {
	return (
		<main className="bg-white">
			<section
				id="home"
				className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-20"
			>
				<div className="space-y-8">
					<div className="inline-flex rounded-full border bg-white px-4 py-2 font-medium text-muted-foreground text-xs shadow-sm">
						BCA first. Mandiri dan BRI segera.
					</div>
					<div className="space-y-5">
						<h1 className="max-w-3xl font-bold text-5xl text-slate-950 leading-tight tracking-tight md:text-6xl">
							KasFlow membaca arus uang bulananmu.
						</h1>
						<p className="max-w-2xl text-base text-slate-600 leading-8 md:text-lg">
							Upload laporan BCA bulanan, lalu KasFlow bantu menemukan pola
							pengeluaran, pemborosan, pembelian berlebihan, biaya berulang, dan
							peluang berhemat.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Link to="/login" search={{ next: "/imports/new" }}>
							<Button size="lg" className="w-full rounded-full px-6 sm:w-auto">
								Coba KasFlow
							</Button>
						</Link>
						<a href="#cara-kerja">
							<Button
								variant="outline"
								size="lg"
								className="w-full rounded-full px-6 sm:w-auto"
							>
								Lihat cara kerja
							</Button>
						</a>
					</div>
				</div>

				<div className="rounded-[2rem] border bg-white p-4 shadow-sm">
					<div className="rounded-[1.5rem] border bg-slate-50 p-5">
						<div className="mb-5 flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs">Preview report</p>
								<h2 className="font-semibold text-xl">Mei 2026</h2>
							</div>
							<div className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 text-xs">
								Watch
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							{[
								["Pemasukan", "Rp8,4 jt"],
								["Pengeluaran", "Rp6,1 jt"],
								["Net cashflow", "Rp2,3 jt"],
							].map(([label, value]) => (
								<div key={label} className="rounded-2xl border bg-white p-4">
									<p className="text-muted-foreground text-xs">{label}</p>
									<p className="mt-2 font-semibold text-lg">{value}</p>
								</div>
							))}
						</div>
						<div className="mt-4 space-y-3">
							{[
								"Food and drink naik 38% dibanding kategori lain.",
								"12 transaksi kecil berulang totalnya Rp640.000.",
								"Ada satu transaksi besar yang perlu dicek ulang.",
							].map((insight) => (
								<div
									key={insight}
									className="flex gap-3 rounded-2xl border bg-white p-4"
								>
									<Sparkles className="mt-0.5 size-4 text-blue-600" />
									<p className="text-slate-700 text-sm">{insight}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section id="cara-kerja" className="border-y bg-slate-50 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6">
					<div className="mb-10 max-w-2xl">
						<p className="font-semibold text-blue-700 text-sm">Cara kerja</p>
						<h2 className="mt-2 font-bold text-3xl text-slate-950">
							Dari laporan bank ke insight.
						</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-5">
						{steps.map((step, index) => (
							<div
								key={step.title}
								className="rounded-2xl border bg-white p-5 shadow-sm"
							>
								<div className="mb-5 flex size-9 items-center justify-center rounded-full bg-slate-950 font-semibold text-sm text-white">
									{index + 1}
								</div>
								<h3 className="font-semibold">{step.title}</h3>
								<p className="mt-2 text-muted-foreground text-sm leading-6">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section
				id="contoh-insight"
				className="mx-auto max-w-7xl px-4 py-16 sm:px-6"
			>
				<div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
					<div>
						<p className="font-semibold text-blue-700 text-sm">
							Contoh insight
						</p>
						<h2 className="mt-2 font-bold text-3xl text-slate-950">
							KasFlow tidak hanya menampilkan tabel.
						</h2>
					</div>
					<p className="max-w-xl text-muted-foreground text-sm leading-6">
						Setiap insight nantinya harus punya dasar transaksi atau agregasi
						agar mudah dicek ulang.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-4">
					{insightCards.map((card) => (
						<div
							key={card.title}
							className="rounded-2xl border bg-white p-5 shadow-sm"
						>
							<BarChart3 className="mb-4 size-5 text-blue-700" />
							<h3 className="font-semibold">{card.title}</h3>
							<p className="mt-2 text-muted-foreground text-sm leading-6">
								{card.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<section id="keamanan" className="border-y bg-slate-50 py-16">
				<div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3">
					<div className="rounded-2xl border bg-white p-6 shadow-sm">
						<FileText className="mb-4 size-5 text-blue-700" />
						<h3 className="font-semibold">BCA tersedia dulu</h3>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							Parser awal difokuskan ke PDF laporan BCA agar kualitas ekstraksi
							stabil sebelum bank lain.
						</p>
					</div>
					<div className="rounded-2xl border bg-white p-6 shadow-sm">
						<UploadCloud className="mb-4 size-5 text-blue-700" />
						<h3 className="font-semibold">Mandiri dan BRI menyusul</h3>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							Arsitektur parser disiapkan multi-bank, tetapi sample Mandiri dan
							BRI harus dikumpulkan dulu.
						</p>
					</div>
					<div className="rounded-2xl border bg-white p-6 shadow-sm">
						<LockKeyhole className="mb-4 size-5 text-blue-700" />
						<h3 className="font-semibold">Data milik user</h3>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							Upload hanya tersedia setelah login, dan setiap import harus
							terikat ke akun pemiliknya.
						</p>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
				<h2 className="font-bold text-3xl text-slate-950">
					Mulai analisis laporan BCA.
				</h2>
				<p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-sm leading-6">
					Buat akun, upload PDF laporan bulanan, lalu lihat transaksi yang sudah
					dirapikan KasFlow.
				</p>
				<Link
					to="/login"
					search={{ next: "/imports/new" }}
					className="mt-7 inline-flex"
				>
					<Button size="lg" className="rounded-full px-7">
						Coba KasFlow
					</Button>
				</Link>
			</section>

			<CinematicFooter />
		</main>
	);
}
