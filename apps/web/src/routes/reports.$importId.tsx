import { Button } from "@KasFlow/ui/components/button";
import DownloadButton, {
	type DownloadStatus,
} from "@KasFlow/ui/components/button-download";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	FileText,
	RefreshCw,
	RepeatIcon,
	Sparkles,
	TrendingDown,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/reports/$importId")({
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
	const { importId } = Route.useParams();
	const queryClient = useQueryClient();

	const importDetail = useQuery(
		trpc.imports.byId.queryOptions({ id: importId }),
	);
	const analysis = useQuery(
		trpc.analysis.byImportId.queryOptions({ importId }),
	);
	const triggerMutation = useMutation(
		trpc.analysis.trigger.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries();
				toast.success("Analisis selesai.");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

	const imp = importDetail.data?.import;
	const txns = importDetail.data?.transactions ?? [];
	const report = analysis.data?.report;
	const insights = analysis.data?.insights ?? [];
	const suggestions = analysis.data?.nextMonthSuggestions ?? [];

	const isLoading = importDetail.isLoading || analysis.isLoading;
	const isAnalyzing = triggerMutation.isPending;
	const hasReport =
		report && (report.status === "done" || report.status === "fallback");

	if (isLoading) {
		return (
			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-24 animate-pulse rounded-2xl bg-slate-100"
						/>
					))}
				</div>
			</main>
		);
	}

	if (!imp) {
		return (
			<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
				<div className="rounded-2xl border bg-white p-10 text-center">
					<FileText className="mx-auto mb-4 size-8 text-muted-foreground" />
					<h3 className="font-semibold">Import tidak ditemukan.</h3>
					<Link to="/dashboard" className="mt-4 inline-flex">
						<Button variant="outline" className="rounded-full">
							Kembali ke dashboard
						</Button>
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
			{/* Header */}
			<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<Link
						to="/imports/$importId"
						params={{ importId }}
						className="mb-3 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
					>
						<ArrowLeft className="size-3.5" />
						Review transaksi
					</Link>
					<p className="font-semibold text-blue-700 text-sm">AI Analysis</p>
					<h1 className="mt-1 font-bold text-3xl tracking-tight">
						Laporan KasFlow
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{imp.totalTransactions} transaksi BCA •{" "}
						{new Date(imp.createdAt).toLocaleDateString("id-ID", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{txns.length > 0 && (
						<DownloadButton
							label="CSV"
							downloadStatus={downloadStatus}
							progress={downloadProgress}
							onClick={() => {
								setDownloadStatus("downloading");
								setDownloadProgress(65);
								downloadTransactionsCsv(txns);
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
					<Button
						variant="outline"
						className="rounded-full"
						disabled={isAnalyzing || imp.totalTransactions === 0}
						onClick={() => triggerMutation.mutate({ importId })}
					>
						{isAnalyzing ? (
							<>
								<RefreshCw className="size-4 animate-spin" />
								Menganalisis...
							</>
						) : (
							<>
								<Sparkles className="size-4" />
								{hasReport ? "Analisis ulang" : "Mulai analisis AI"}
							</>
						)}
					</Button>
				</div>
			</div>

			{/* No transactions state */}
			{imp.totalTransactions === 0 && (
				<div className="rounded-2xl border border-dashed bg-white p-10 text-center">
					<FileText className="mx-auto mb-4 size-8 text-muted-foreground" />
					<h3 className="font-semibold">Belum ada transaksi terbaca.</h3>
					<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
						Parser belum berhasil mengambil transaksi dari file ini. AI analysis
						membutuhkan data transaksi.
					</p>
					<Link to="/imports/new" className="mt-5 inline-flex">
						<Button className="rounded-full">Upload laporan lain</Button>
					</Link>
				</div>
			)}

			{/* No analysis yet */}
			{imp.totalTransactions > 0 && !hasReport && !isAnalyzing && (
				<div className="mb-6 rounded-2xl border border-dashed bg-white p-10 text-center">
					<Sparkles className="mx-auto mb-4 size-8 text-blue-600" />
					<h3 className="font-semibold">Analisis AI belum dijalankan.</h3>
					<p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
						KasFlow akan membaca {imp.totalTransactions} transaksi dan
						menghasilkan insight pengeluaran, pemborosan, biaya berulang, dan
						anomali.
					</p>
					<Button
						className="mt-5 rounded-full"
						disabled={isAnalyzing}
						onClick={() => triggerMutation.mutate({ importId })}
					>
						<Sparkles className="size-4" />
						Mulai analisis AI
					</Button>
				</div>
			)}

			{/* Analyzing state */}
			{isAnalyzing && (
				<div className="mb-6 rounded-2xl border bg-blue-50 p-6 text-center">
					<RefreshCw className="mx-auto mb-3 size-6 animate-spin text-blue-600" />
					<p className="font-semibold text-blue-800">
						KasFlow sedang menganalisis...
					</p>
					<p className="mt-1 text-blue-600 text-sm">
						Membaca pola transaksi dan menyusun insight. Ini mungkin membutuhkan
						beberapa detik.
					</p>
				</div>
			)}

			{/* Fallback notice */}
			{hasReport && report.status === "fallback" && (
				<div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
					<AlertCircle className="mt-0.5 size-4 shrink-0" />
					<p>
						Analisis ini dibuat otomatis berdasarkan aturan statistik. AI Claude
						belum aktif karena API key belum dikonfigurasi.
					</p>
				</div>
			)}

			{/* Report content */}
			{hasReport && (
				<>
					{/* KPI Cards */}
					<section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<KpiCard
							label="Total pemasukan"
							value={formatRupiah(imp.totalCreditCents)}
							icon={<TrendingUp className="size-4 text-emerald-600" />}
							color="emerald"
						/>
						<KpiCard
							label="Total pengeluaran"
							value={formatRupiah(imp.totalDebitCents)}
							icon={<TrendingDown className="size-4 text-red-600" />}
							color="red"
						/>
						<KpiCard
							label="Net cashflow"
							value={formatRupiah(imp.totalCreditCents - imp.totalDebitCents)}
							icon={<BarChart3 className="size-4 text-blue-600" />}
							color="blue"
						/>
						<CashflowHealthCard
							label={report.cashflowHealthLabel ?? "watch"}
							score={report.cashflowHealthScore ?? 50}
							reason={report.cashflowHealthReason ?? ""}
						/>
					</section>

					{/* Summary */}
					{report.summaryText && (
						<section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
							<div className="mb-3 flex items-center gap-2">
								<Sparkles className="size-4 text-blue-600" />
								<h2 className="font-semibold">Ringkasan bulanan</h2>
							</div>
							<p className="text-slate-700 text-sm leading-7">
								{report.summaryText}
							</p>
						</section>
					)}

					{/* Insights */}
					{insights.length > 0 && (
						<section className="mb-6">
							<h2 className="mb-4 font-semibold text-lg">Insight</h2>
							<div className="space-y-3">
								{insights.map((insight) => (
									<InsightCard
										key={insight.id}
										insight={insight}
										transactions={txns}
										expanded={expandedInsight === insight.id}
										onToggle={() =>
											setExpandedInsight(
												expandedInsight === insight.id ? null : insight.id,
											)
										}
									/>
								))}
							</div>
						</section>
					)}

					{/* Category breakdown from input summary */}
					<CategoryBreakdown report={report} />

					{/* Suggestions */}
					{suggestions.length > 0 && (
						<section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
							<h2 className="mb-4 font-semibold">Saran bulan depan</h2>
							<ul className="space-y-3">
								{suggestions.map((suggestion, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: suggestions list is static post-generation
									<li key={i} className="flex items-start gap-3">
										<div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-xs">
											{i + 1}
										</div>
										<p className="text-slate-700 text-sm leading-6">
											{suggestion}
										</p>
									</li>
								))}
							</ul>
						</section>
					)}

					{/* Disclaimer */}
					{report.disclaimer && (
						<p className="mt-6 text-center text-muted-foreground text-xs leading-5">
							{report.disclaimer}
						</p>
					)}
				</>
			)}
		</main>
	);
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function KpiCard({
	label,
	value,
	icon,
	color,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
	color: "emerald" | "red" | "blue";
}) {
	const bg: Record<string, string> = {
		emerald: "bg-emerald-50",
		red: "bg-red-50",
		blue: "bg-blue-50",
	};
	return (
		<div className="rounded-2xl border bg-white p-5 shadow-sm">
			<div className="mb-3 flex items-center gap-2">
				<div className={`rounded-lg p-1.5 ${bg[color]}`}>{icon}</div>
				<p className="text-muted-foreground text-xs">{label}</p>
			</div>
			<p className="font-semibold text-xl">{value}</p>
		</div>
	);
}

function CashflowHealthCard({
	label,
	score,
	reason,
}: {
	label: string;
	score: number;
	reason: string;
}) {
	const config: Record<
		string,
		{ color: string; bg: string; icon: React.ReactNode; text: string }
	> = {
		good: {
			color: "text-emerald-700",
			bg: "bg-emerald-50",
			icon: <CheckCircle className="size-4 text-emerald-600" />,
			text: "Sehat",
		},
		watch: {
			color: "text-amber-700",
			bg: "bg-amber-50",
			icon: <AlertTriangle className="size-4 text-amber-600" />,
			text: "Perhatian",
		},
		risky: {
			color: "text-red-700",
			bg: "bg-red-50",
			icon: <AlertCircle className="size-4 text-red-600" />,
			text: "Berisiko",
		},
	};
	const watchFallback = {
		color: "text-amber-700",
		bg: "bg-amber-50",
		icon: <AlertTriangle className="size-4 text-amber-600" />,
		text: "Perhatian",
	};
	const cfg = config[label] ?? watchFallback;

	return (
		<div className="rounded-2xl border bg-white p-5 shadow-sm">
			<div className="mb-3 flex items-center gap-2">
				<div className={`rounded-lg p-1.5 ${cfg.bg}`}>{cfg.icon}</div>
				<p className="text-muted-foreground text-xs">Cashflow health</p>
			</div>
			<p className={`font-semibold text-xl ${cfg.color}`}>
				{cfg.text} ({score})
			</p>
			{reason && (
				<p className="mt-1 text-muted-foreground text-xs leading-5">{reason}</p>
			)}
		</div>
	);
}

type InsightRow = {
	id: string;
	type: string;
	severity: string;
	title: string;
	description: string;
	amountCents: number | null;
	evidenceTransactionIds: string[];
	suggestedAction: string | null;
};

type TxnRow = {
	id: string;
	transactionDate: Date | string | number;
	descriptionOriginal: string;
	direction: string;
	amountCents: number;
};

function InsightCard({
	insight,
	transactions,
	expanded,
	onToggle,
}: {
	insight: InsightRow;
	transactions: TxnRow[];
	expanded: boolean;
	onToggle: () => void;
}) {
	const severityConfig: Record<
		string,
		{ border: string; bg: string; dot: string }
	> = {
		high: {
			border: "border-red-200",
			bg: "bg-red-50",
			dot: "bg-red-500",
		},
		medium: {
			border: "border-amber-200",
			bg: "bg-amber-50",
			dot: "bg-amber-500",
		},
		low: {
			border: "border-blue-200",
			bg: "bg-blue-50",
			dot: "bg-blue-400",
		},
	};

	const typeIcon: Record<string, React.ReactNode> = {
		overspending: <Zap className="size-4 text-amber-600" />,
		recurring: <RepeatIcon className="size-4 text-blue-600" />,
		anomaly: <AlertTriangle className="size-4 text-red-600" />,
		saving_opportunity: <TrendingUp className="size-4 text-emerald-600" />,
		category_pattern: <BarChart3 className="size-4 text-blue-600" />,
	};

	const mediumFallback = {
		border: "border-amber-200",
		bg: "bg-amber-50",
		dot: "bg-amber-500",
	};
	const cfg = severityConfig[insight.severity] ?? mediumFallback;
	const evidenceTxns = transactions.filter((t) =>
		insight.evidenceTransactionIds.includes(t.id),
	);

	return (
		<div className={`rounded-2xl border bg-white shadow-sm ${cfg.border}`}>
			<button
				type="button"
				className="flex w-full items-start gap-4 p-5 text-left"
				onClick={onToggle}
			>
				<div className={`mt-0.5 rounded-lg p-1.5 ${cfg.bg}`}>
					{typeIcon[insight.type] ?? <Sparkles className="size-4" />}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className={`size-2 shrink-0 rounded-full ${cfg.dot}`} />
						<p className="font-semibold text-sm">{insight.title}</p>
					</div>
					<p className="mt-1 text-muted-foreground text-sm leading-5">
						{insight.description}
					</p>
					{insight.amountCents && (
						<p className="mt-2 font-medium text-slate-800 text-sm">
							{formatRupiah(insight.amountCents)}
						</p>
					)}
				</div>
				<div className="shrink-0 text-muted-foreground">
					{expanded ? (
						<ChevronUp className="size-4" />
					) : (
						<ChevronDown className="size-4" />
					)}
				</div>
			</button>

			{expanded && (
				<div className="border-t px-5 pt-4 pb-5">
					{insight.suggestedAction && (
						<div className={`mb-4 rounded-xl p-3 text-sm ${cfg.bg}`}>
							<span className="font-medium">Saran: </span>
							{insight.suggestedAction}
						</div>
					)}
					{evidenceTxns.length > 0 && (
						<div>
							<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Transaksi terkait ({evidenceTxns.length})
							</p>
							<div className="divide-y rounded-xl border">
								{evidenceTxns.slice(0, 5).map((t) => (
									<div
										key={t.id}
										className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">
												{t.descriptionOriginal}
											</p>
											<p className="text-muted-foreground text-xs">
												{new Date(t.transactionDate).toLocaleDateString(
													"id-ID",
												)}
											</p>
										</div>
										<p
											className={
												t.direction === "credit"
													? "shrink-0 font-medium text-emerald-700"
													: "shrink-0 font-medium text-red-700"
											}
										>
											{t.direction === "credit" ? "+" : "-"}
											{formatRupiah(t.amountCents)}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function CategoryBreakdown({
	report,
}: {
	report: { inputSummaryJson: string | null };
}) {
	if (!report.inputSummaryJson) return null;

	let categories: Array<{
		category: string;
		totalCents: number;
		count: number;
		percent: number;
	}> = [];

	try {
		const parsed = JSON.parse(report.inputSummaryJson) as {
			categoryBreakdown?: typeof categories;
		};
		categories = parsed.categoryBreakdown?.slice(0, 8) ?? [];
	} catch {
		return null;
	}

	if (categories.length === 0) return null;

	const maxTotal = Math.max(...categories.map((c) => c.totalCents));

	return (
		<section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
			<h2 className="mb-4 font-semibold">Kategori pengeluaran</h2>
			<div className="space-y-3">
				{categories.map((cat) => (
					<div key={cat.category}>
						<div className="mb-1 flex items-center justify-between text-sm">
							<span className="font-medium">{cat.category}</span>
							<span className="text-muted-foreground">
								{formatRupiah(cat.totalCents)}{" "}
								<span className="text-muted-foreground text-xs">
									({cat.percent}%)
								</span>
							</span>
						</div>
						<div className="h-2 rounded-full bg-slate-100">
							<div
								className="h-2 rounded-full bg-slate-800 transition-all"
								style={{
									width: `${Math.round((cat.totalCents / maxTotal) * 100)}%`,
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatRupiah(amountCents: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amountCents / 100);
}

function downloadTransactionsCsv(
	transactions: Array<{
		transactionDate: Date | string | number;
		descriptionOriginal: string;
		merchantName?: string | null;
		categoryName: string;
		direction: string;
		amountCents: number;
		balanceAfterCents?: number | null;
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
	const rows = transactions.map((t) => [
		new Date(t.transactionDate).toISOString().slice(0, 10),
		t.descriptionOriginal,
		t.merchantName ?? "",
		t.categoryName,
		t.direction,
		String(t.amountCents / 100),
		t.balanceAfterCents == null ? "" : String(t.balanceAfterCents / 100),
		String(t.confidence),
	]);
	const csv = [header, ...rows]
		.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "kasflow-transaksi-bca.csv";
	a.click();
	URL.revokeObjectURL(url);
}
