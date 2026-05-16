import { Button } from "@KasFlow/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FileText, UploadCloud } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { next: "/dashboard" },
				throw: true,
			});
		}
		return { session };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const imports = useQuery(trpc.imports.list.queryOptions());
	const latestImport = imports.data?.[0];

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
			<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<p className="text-muted-foreground text-sm">
						Selamat datang, {session.data?.user.name}
					</p>
					<h1 className="mt-2 font-bold text-3xl tracking-tight">
						Dashboard KasFlow
					</h1>
				</div>
				<Link to="/imports/new">
					<Button className="rounded-full">
						<UploadCloud className="size-4" />
						Upload laporan BCA
					</Button>
				</Link>
			</div>

			<section className="grid gap-4 md:grid-cols-4">
				{[
					["Total import", imports.data?.length ?? 0],
					["Transaksi terbaru", latestImport?.totalTransactions ?? 0],
					["Total debit", formatRupiah(latestImport?.totalDebitCents ?? 0)],
					["Total kredit", formatRupiah(latestImport?.totalCreditCents ?? 0)],
				].map(([label, value]) => (
					<div
						key={label}
						className="rounded-2xl border bg-white p-5 shadow-sm"
					>
						<p className="text-muted-foreground text-xs">{label}</p>
						<p className="mt-3 font-semibold text-2xl">{value}</p>
					</div>
				))}
			</section>

			<section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
				<div className="mb-5 flex items-center justify-between gap-4">
					<div>
						<h2 className="font-semibold">Riwayat import</h2>
						<p className="text-muted-foreground text-sm">
							Upload BCA yang sudah masuk akan tampil di sini.
						</p>
					</div>
				</div>
				{imports.isLoading ? (
					<p className="text-muted-foreground text-sm">Memuat import...</p>
				) : imports.data?.length ? (
					<div className="divide-y">
						{imports.data.map((item) => (
							<Link
								key={item.id}
								to="/imports/$importId"
								params={{ importId: item.id }}
								className="flex items-center justify-between gap-4 py-4"
							>
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
										<FileText className="size-4" />
									</div>
									<div>
										<p className="font-medium">Laporan BCA</p>
										<p className="text-muted-foreground text-sm">
											{new Date(item.createdAt).toLocaleDateString("id-ID")} -{" "}
											{item.status}
										</p>
									</div>
								</div>
								<p className="text-muted-foreground text-sm">
									{item.totalTransactions} transaksi
								</p>
							</Link>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-dashed p-8 text-center">
						<UploadCloud className="mx-auto mb-4 size-8 text-muted-foreground" />
						<h3 className="font-semibold">Belum ada laporan.</h3>
						<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
							Mulai dari upload PDF laporan BCA bulanan. KasFlow akan menyimpan
							import dan mencoba membaca transaksi secara otomatis.
						</p>
						<Link to="/imports/new" className="mt-5 inline-flex">
							<Button className="rounded-full">Upload laporan pertama</Button>
						</Link>
					</div>
				)}
			</section>
		</main>
	);
}

function formatRupiah(amountCents: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amountCents / 100);
}
