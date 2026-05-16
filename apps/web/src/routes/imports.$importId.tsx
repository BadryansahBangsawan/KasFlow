import { Button } from "@KasFlow/ui/components/button";
import DownloadButton, {
	type DownloadStatus,
} from "@KasFlow/ui/components/button-download";
import { ProgressIndicator } from "@KasFlow/ui/components/progress-indicator";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AlertCircle, FileText, UploadCloud } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/imports/$importId")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { next: "/imports/new" },
				throw: true,
			});
		}
		return { session };
	},
});

function RouteComponent() {
	const { importId } = Route.useParams();
	const detail = useQuery(trpc.imports.byId.queryOptions({ id: importId }));
	const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
	const [downloadProgress, setDownloadProgress] = useState(0);

	if (detail.isLoading) {
		return (
			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
				<p className="text-muted-foreground text-sm">Memuat detail import...</p>
			</main>
		);
	}

	if (!detail.data) {
		return (
			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
				<p className="text-muted-foreground text-sm">Import tidak ditemukan.</p>
			</main>
		);
	}

	const statementImport = detail.data.import;
	const transactions = detail.data.transactions;
	const currentStep =
		statementImport.status === "parsed"
			? 4
			: statementImport.status === "failed"
				? 2
				: 3;

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
			<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<p className="font-semibold text-blue-700 text-sm">Import BCA</p>
					<h1 className="mt-2 font-bold text-3xl tracking-tight">
						Review transaksi
					</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Status: {statementImport.status}. Confidence:{" "}
						{statementImport.importConfidence}%.
					</p>
				</div>
				<Link to="/imports/new">
					<Button variant="outline" className="rounded-full">
						<UploadCloud className="size-4" />
						Upload lagi
					</Button>
				</Link>
			</div>

			{statementImport.errorMessage && (
				<div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
					<AlertCircle className="mt-0.5 size-4" />
					<div>
						<p className="font-medium">{statementImport.errorCode}</p>
						<p className="mt-1">{statementImport.errorMessage}</p>
					</div>
				</div>
			)}

			<section className="mb-6 grid gap-4 md:grid-cols-4">
				{[
					["Transaksi", statementImport.totalTransactions],
					["Debit", formatRupiah(statementImport.totalDebitCents)],
					["Kredit", formatRupiah(statementImport.totalCreditCents)],
					["File", detail.data.file?.originalName ?? "-"],
				].map(([label, value]) => (
					<div
						key={label}
						className="rounded-2xl border bg-white p-5 shadow-sm"
					>
						<p className="text-muted-foreground text-xs">{label}</p>
						<p className="mt-3 break-words font-semibold text-xl">{value}</p>
					</div>
				))}
			</section>

			<section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
				<div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<h2 className="font-semibold">Progress import</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Komponen progress mengikuti acuan plan/component.md.
						</p>
					</div>
					{transactions.length > 0 && (
						<DownloadButton
							label="CSV"
							downloadStatus={downloadStatus}
							progress={downloadProgress}
							onClick={() => {
								setDownloadStatus("downloading");
								setDownloadProgress(65);
								downloadTransactionsCsv(transactions);
								setTimeout(() => {
									setDownloadProgress(100);
									setDownloadStatus("downloaded");
								}, 250);
								setTimeout(() => {
									setDownloadProgress(0);
									setDownloadStatus("idle");
								}, 1600);
							}}
						/>
					)}
				</div>
				<ProgressIndicator
					currentStep={currentStep}
					steps={[
						{ label: "Upload", description: "File tersimpan" },
						{ label: "Validasi", description: "Metadata dicek" },
						{ label: "Parsing", description: "Row dibaca" },
						{ label: "Review", description: "Transaksi siap" },
					]}
				/>
			</section>

			<section className="rounded-2xl border bg-white shadow-sm">
				<div className="border-b p-5">
					<h2 className="font-semibold">Transaksi hasil parser</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						AI analysis belum dikerjakan di fase ini. Tahap ini fokus parsing
						dan review transaksi.
					</p>
				</div>
				{transactions.length ? (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[920px] text-left text-sm">
							<thead className="bg-slate-50 text-muted-foreground text-xs">
								<tr>
									<th className="px-4 py-3 font-medium">Tanggal</th>
									<th className="px-4 py-3 font-medium">Deskripsi</th>
									<th className="px-4 py-3 font-medium">Merchant</th>
									<th className="px-4 py-3 font-medium">Kategori</th>
									<th className="px-4 py-3 text-right font-medium">Debit</th>
									<th className="px-4 py-3 text-right font-medium">Kredit</th>
									<th className="px-4 py-3 text-right font-medium">Saldo</th>
									<th className="px-4 py-3 text-right font-medium">
										Confidence
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{transactions.map((transaction) => (
									<tr key={transaction.id} className="align-top">
										<td className="px-4 py-3">
											{new Date(transaction.transactionDate).toLocaleDateString(
												"id-ID",
											)}
										</td>
										<td className="max-w-md px-4 py-3">
											{transaction.descriptionOriginal}
										</td>
										<td className="px-4 py-3">
											{transaction.merchantName ?? "-"}
										</td>
										<td className="px-4 py-3">{transaction.categoryName}</td>
										<td className="px-4 py-3 text-right">
											{transaction.direction === "debit"
												? formatRupiah(transaction.amountCents)
												: "-"}
										</td>
										<td className="px-4 py-3 text-right">
											{transaction.direction === "credit"
												? formatRupiah(transaction.amountCents)
												: "-"}
										</td>
										<td className="px-4 py-3 text-right">
											{transaction.balanceAfterCents === null
												? "-"
												: formatRupiah(transaction.balanceAfterCents)}
										</td>
										<td className="px-4 py-3 text-right">
											{transaction.confidence}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-10 text-center">
						<FileText className="mx-auto mb-4 size-8 text-muted-foreground" />
						<h3 className="font-semibold">Belum ada transaksi terbaca.</h3>
						<p className="mx-auto mt-2 max-w-lg text-muted-foreground text-sm leading-6">
							Jika status membutuhkan password atau text layer tidak ditemukan,
							upload sudah tersimpan tetapi parser belum bisa mengambil
							transaksi dari PDF ini.
						</p>
					</div>
				)}
			</section>
		</main>
	);
}

function downloadTransactionsCsv(
	transactions: Array<{
		transactionDate: Date | string | number;
		descriptionOriginal: string;
		merchantName: string | null;
		categoryName: string;
		direction: string;
		amountCents: number;
		balanceAfterCents: number | null;
		confidence: number;
	}>,
) {
	const header = [
		"tanggal",
		"deskripsi",
		"merchant",
		"kategori",
		"arah",
		"amount",
		"saldo",
		"confidence",
	];
	const rows = transactions.map((transaction) => [
		new Date(transaction.transactionDate).toISOString().slice(0, 10),
		transaction.descriptionOriginal,
		transaction.merchantName ?? "",
		transaction.categoryName,
		transaction.direction,
		String(transaction.amountCents / 100),
		transaction.balanceAfterCents === null
			? ""
			: String(transaction.balanceAfterCents / 100),
		String(transaction.confidence),
	]);
	const csv = [header, ...rows]
		.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "kasflow-transaksi-bca.csv";
	link.click();
	URL.revokeObjectURL(url);
}

function formatRupiah(amountCents: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amountCents / 100);
}
