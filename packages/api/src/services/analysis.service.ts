import { db } from "@KasFlow/db";
import { analysisInsights, analysisReports } from "@KasFlow/db/schema/analysis";
import { statementImports, transactions } from "@KasFlow/db/schema/imports";
import { env } from "@KasFlow/env/server";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";

const AI_MODEL = "claude-sonnet-4-6";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Transaction = typeof transactions.$inferSelect;

type CategorySummary = {
	category: string;
	totalCents: number;
	count: number;
	percent: number;
};

type MerchantSummary = {
	merchant: string;
	totalCents: number;
	count: number;
};

type RecurringItem = {
	merchant: string;
	totalCents: number;
	count: number;
	transactionIds: string[];
};

type AnomalyItem = {
	transactionId: string;
	description: string;
	amountCents: number;
	date: string;
	reason: string;
};

type AggregateData = {
	period: string;
	totalIncomeCents: number;
	totalExpenseCents: number;
	netCashflowCents: number;
	expenseRatio: number;
	transactionCount: number;
	categoryBreakdown: CategorySummary[];
	topMerchants: MerchantSummary[];
	recurringItems: RecurringItem[];
	anomalies: AnomalyItem[];
	largeTransactions: AnomalyItem[];
};

type CandidateInsight = {
	type:
		| "overspending"
		| "recurring"
		| "anomaly"
		| "saving_opportunity"
		| "category_pattern";
	severity: "low" | "medium" | "high";
	title: string;
	description: string;
	amountCents: number;
	transactionIds: string[];
};

type AiInsight = {
	type: string;
	severity: string;
	title: string;
	description: string;
	amount: number;
	evidenceTransactionIds: string[];
	suggestedAction: string;
};

type AiOutput = {
	summary: string;
	cashflowHealth: {
		score: number;
		label: "good" | "watch" | "risky";
		reason: string;
	};
	insights: AiInsight[];
	categoryNotes: Array<{ category: string; total: number; note: string }>;
	nextMonthSuggestions: string[];
	disclaimer: string;
};

// ─────────────────────────────────────────────
// Aggregate Builder
// ─────────────────────────────────────────────

function buildAggregates(
	txns: Transaction[],
	periodLabel: string,
): AggregateData {
	const income = txns.filter((t) => t.direction === "credit");
	const expense = txns.filter((t) => t.direction === "debit");

	const totalIncomeCents = income.reduce((s, t) => s + t.amountCents, 0);
	const totalExpenseCents = expense.reduce((s, t) => s + t.amountCents, 0);
	const netCashflowCents = totalIncomeCents - totalExpenseCents;
	const expenseRatio =
		totalIncomeCents > 0
			? totalExpenseCents / totalIncomeCents
			: totalExpenseCents > 0
				? 2
				: 0;

	// Category breakdown (expense only)
	const categoryMap = new Map<string, { total: number; count: number }>();
	for (const t of expense) {
		const cat = t.categoryName ?? "Other";
		const existing = categoryMap.get(cat) ?? { total: 0, count: 0 };
		categoryMap.set(cat, {
			total: existing.total + t.amountCents,
			count: existing.count + 1,
		});
	}

	const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries())
		.map(([category, { total, count }]) => ({
			category,
			totalCents: total,
			count,
			percent:
				totalExpenseCents > 0
					? Math.round((total / totalExpenseCents) * 100)
					: 0,
		}))
		.sort((a, b) => b.totalCents - a.totalCents);

	// Top merchants (expense)
	const merchantMap = new Map<string, { total: number; count: number }>();
	for (const t of expense) {
		const merchant =
			t.merchantName ?? t.descriptionClean.slice(0, 30) ?? "Unknown";
		const existing = merchantMap.get(merchant) ?? { total: 0, count: 0 };
		merchantMap.set(merchant, {
			total: existing.total + t.amountCents,
			count: existing.count + 1,
		});
	}
	const topMerchants: MerchantSummary[] = Array.from(merchantMap.entries())
		.map(([merchant, { total, count }]) => ({
			merchant,
			totalCents: total,
			count,
		}))
		.sort((a, b) => b.totalCents - a.totalCents)
		.slice(0, 10);

	// Recurring (same merchant, 2+ occurrences)
	const recurringItems: RecurringItem[] = Array.from(merchantMap.entries())
		.filter(([, { count }]) => count >= 2)
		.map(([merchant, { total, count }]) => {
			const ids = expense
				.filter(
					(t) =>
						(t.merchantName ?? t.descriptionClean.slice(0, 30)) === merchant,
				)
				.map((t) => t.id);
			return { merchant, totalCents: total, count, transactionIds: ids };
		})
		.sort((a, b) => b.totalCents - a.totalCents)
		.slice(0, 8);

	// Anomalies: amount > 3x median expense or single very large transaction
	const expenseAmounts = expense
		.map((t) => t.amountCents)
		.sort((a, b) => a - b);
	const median =
		expenseAmounts.length > 0
			? (expenseAmounts[Math.floor(expenseAmounts.length / 2)] ?? 0)
			: 0;
	const anomalyThreshold = Math.max(median * 3, 500_000_000); // 3x median or >Rp 5jt

	const anomalies: AnomalyItem[] = expense
		.filter((t) => t.amountCents >= anomalyThreshold)
		.map((t) => ({
			transactionId: t.id,
			description: t.descriptionOriginal,
			amountCents: t.amountCents,
			date: new Date(t.transactionDate).toISOString().slice(0, 10),
			reason: `Nominal besar: ${formatRupiah(t.amountCents)}`,
		}))
		.sort((a, b) => b.amountCents - a.amountCents)
		.slice(0, 5);

	const largeTransactions = expense
		.sort((a, b) => b.amountCents - a.amountCents)
		.slice(0, 5)
		.map((t) => ({
			transactionId: t.id,
			description: t.descriptionOriginal,
			amountCents: t.amountCents,
			date: new Date(t.transactionDate).toISOString().slice(0, 10),
			reason: "Transaksi terbesar bulan ini",
		}));

	return {
		period: periodLabel,
		totalIncomeCents,
		totalExpenseCents,
		netCashflowCents,
		expenseRatio,
		transactionCount: txns.length,
		categoryBreakdown,
		topMerchants,
		recurringItems,
		anomalies,
		largeTransactions,
	};
}

// ─────────────────────────────────────────────
// Candidate Insight Rule Engine
// ─────────────────────────────────────────────

function buildCandidateInsights(data: AggregateData): CandidateInsight[] {
	const candidates: CandidateInsight[] = [];

	// Overspending: top category > 40% of expense
	const topCat = data.categoryBreakdown[0];
	if (topCat && topCat.percent >= 40 && topCat.category !== "Income") {
		candidates.push({
			type: "category_pattern",
			severity: topCat.percent >= 55 ? "high" : "medium",
			title: `${topCat.category} mendominasi pengeluaran`,
			description: `${topCat.category} mengambil ${topCat.percent}% dari total pengeluaran bulan ini (${formatRupiah(topCat.totalCents)}).`,
			amountCents: topCat.totalCents,
			transactionIds: [],
		});
	}

	// Recurring: 3+ recurring items detected
	if (data.recurringItems.length >= 3) {
		const total = data.recurringItems.reduce((s, r) => s + r.totalCents, 0);
		candidates.push({
			type: "recurring",
			severity: "medium",
			title: `${data.recurringItems.length} biaya berulang terdeteksi`,
			description: `Total ${formatRupiah(total)} dari biaya yang muncul lebih dari sekali. Perlu dicek mana yang bisa dioptimalkan.`,
			amountCents: total,
			transactionIds: data.recurringItems.flatMap((r) => r.transactionIds),
		});
	}

	// Anomaly: large transactions
	if (data.anomalies.length > 0) {
		candidates.push({
			type: "anomaly",
			severity: "high",
			title: `${data.anomalies.length} transaksi nominal besar perlu dicek`,
			description:
				"Ada transaksi dengan nominal jauh di atas rata-rata pengeluaran. Pastikan transaksi ini sesuai harapan.",
			amountCents: data.anomalies[0]?.amountCents ?? 0,
			transactionIds: data.anomalies.map((a) => a.transactionId),
		});
	}

	// Saving opportunity: expense ratio > 80%
	if (data.expenseRatio > 0.8 && data.totalIncomeCents > 0) {
		candidates.push({
			type: "saving_opportunity",
			severity: data.expenseRatio > 1 ? "high" : "medium",
			title:
				data.expenseRatio > 1
					? "Pengeluaran melebihi pemasukan"
					: "Rasio pengeluaran tinggi",
			description:
				data.expenseRatio > 1
					? `Pengeluaran ${formatRupiah(data.totalExpenseCents)} melebihi pemasukan ${formatRupiah(data.totalIncomeCents)} bulan ini.`
					: `${Math.round(data.expenseRatio * 100)}% pemasukan habis untuk pengeluaran. Hanya tersisa ${formatRupiah(data.netCashflowCents)}.`,
			amountCents: Math.abs(data.netCashflowCents),
			transactionIds: [],
		});
	}

	// High frequency merchant
	const highFreq = data.topMerchants.find((m) => m.count >= 8);
	if (highFreq) {
		candidates.push({
			type: "overspending",
			severity: highFreq.count >= 15 ? "high" : "medium",
			title: `${highFreq.merchant} dikunjungi ${highFreq.count}x bulan ini`,
			description: `Total ${formatRupiah(highFreq.totalCents)} untuk merchant ini. Frekuensi tinggi bisa jadi pola yang perlu direview.`,
			amountCents: highFreq.totalCents,
			transactionIds: [],
		});
	}

	return candidates;
}

// ─────────────────────────────────────────────
// Claude AI Call
// ─────────────────────────────────────────────

async function callClaudeAnalysis(
	data: AggregateData,
	candidates: CandidateInsight[],
): Promise<AiOutput> {
	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	const systemPrompt = `Kamu adalah analis arus kas personal yang membantu user memahami laporan keuangan bulanan mereka.

Aturan:
- Gunakan HANYA data yang diberikan. Jangan mengarang transaksi atau angka.
- Setiap insight HARUS merujuk ke data yang ada.
- Bahasa: Bahasa Indonesia, sopan, jelas, dan praktis.
- Saran harus bisa dilakukan, bukan generik.
- Jangan memberi nasihat investasi.
- Jangan menghakimi pengeluaran user.
- Output HARUS berupa JSON valid sesuai format yang diminta.`;

	const userPrompt = `Analisis laporan keuangan bulan ${data.period}:

RINGKASAN:
- Total Pemasukan: ${formatRupiah(data.totalIncomeCents)}
- Total Pengeluaran: ${formatRupiah(data.totalExpenseCents)}
- Net Cashflow: ${formatRupiah(data.netCashflowCents)}
- Rasio Pengeluaran: ${Math.round(data.expenseRatio * 100)}%
- Jumlah Transaksi: ${data.transactionCount}

KATEGORI PENGELUARAN (top):
${data.categoryBreakdown
	.slice(0, 6)
	.map(
		(c) =>
			`- ${c.category}: ${formatRupiah(c.totalCents)} (${c.percent}%, ${c.count} transaksi)`,
	)
	.join("\n")}

MERCHANT TERATAS:
${data.topMerchants
	.slice(0, 5)
	.map((m) => `- ${m.merchant}: ${formatRupiah(m.totalCents)} (${m.count}x)`)
	.join("\n")}

BIAYA BERULANG:
${
	data.recurringItems.length > 0
		? data.recurringItems
				.map(
					(r) => `- ${r.merchant}: ${formatRupiah(r.totalCents)} (${r.count}x)`,
				)
				.join("\n")
		: "Tidak ada biaya berulang terdeteksi."
}

KANDIDAT INSIGHT (rule-based, perlu narasi yang jelas):
${candidates.map((c) => `- [${c.severity.toUpperCase()}] ${c.title}: ${c.description}`).join("\n")}

Tulis analisis dengan format JSON berikut (tanpa markdown, langsung JSON):
{
  "summary": "Ringkasan naratif 3-5 kalimat tentang kondisi keuangan bulan ini.",
  "cashflowHealth": {
    "score": <0-100>,
    "label": "<good|watch|risky>",
    "reason": "Alasan singkat cashflow health score ini."
  },
  "insights": [
    {
      "type": "<overspending|recurring|anomaly|saving_opportunity|category_pattern>",
      "severity": "<low|medium|high>",
      "title": "Judul insight singkat",
      "description": "Penjelasan 1-2 kalimat dengan angka spesifik.",
      "amount": <angka dalam rupiah, bukan cents>,
      "evidenceTransactionIds": [],
      "suggestedAction": "Satu aksi praktis yang bisa dilakukan."
    }
  ],
  "categoryNotes": [
    {
      "category": "Nama kategori",
      "total": <angka dalam rupiah>,
      "note": "Catatan 1 kalimat."
    }
  ],
  "nextMonthSuggestions": [
    "Saran praktis 1",
    "Saran praktis 2",
    "Saran praktis 3"
  ],
  "disclaimer": "Analisis ini bersifat informasi berdasarkan data transaksi yang diupload, bukan nasihat keuangan profesional."
}`;

	const response = await client.messages.create({
		model: AI_MODEL,
		max_tokens: 2048,
		messages: [{ role: "user", content: userPrompt }],
		system: systemPrompt,
	});

	const rawText =
		response.content[0]?.type === "text" ? response.content[0].text : "";

	// Strip markdown code block if AI wraps it
	const jsonText = rawText
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```\s*$/i, "")
		.trim();

	const parsed = JSON.parse(jsonText) as AiOutput;

	// Fill in evidence IDs from candidates for matching insight types
	for (const insight of parsed.insights) {
		if (insight.evidenceTransactionIds.length === 0) {
			const candidate = candidates.find((c) => c.type === insight.type);
			if (candidate?.transactionIds.length) {
				insight.evidenceTransactionIds = candidate.transactionIds.slice(0, 10);
			}
		}
	}

	return parsed;
}

// ─────────────────────────────────────────────
// Fallback Rule-Based Analysis
// ─────────────────────────────────────────────

function buildFallbackOutput(
	data: AggregateData,
	candidates: CandidateInsight[],
): AiOutput {
	const isGood = data.expenseRatio <= 0.7 && data.netCashflowCents > 0;
	const isRisky = data.expenseRatio > 1 || data.netCashflowCents < 0;
	const label = isGood ? "good" : isRisky ? "risky" : "watch";
	const score = isGood ? 80 : isRisky ? 30 : 55;

	const summaryParts: string[] = [];
	if (data.totalIncomeCents > 0) {
		summaryParts.push(
			`Bulan ${data.period}, pemasukan tercatat ${formatRupiah(data.totalIncomeCents)} dan pengeluaran ${formatRupiah(data.totalExpenseCents)}.`,
		);
	} else {
		summaryParts.push(
			`Bulan ${data.period}, total pengeluaran tercatat ${formatRupiah(data.totalExpenseCents)} dari ${data.transactionCount} transaksi.`,
		);
	}
	if (data.categoryBreakdown[0]) {
		summaryParts.push(
			`Pengeluaran terbesar ada di kategori ${data.categoryBreakdown[0].category} (${data.categoryBreakdown[0].percent}%).`,
		);
	}
	if (data.recurringItems.length > 0) {
		summaryParts.push(
			`Ditemukan ${data.recurringItems.length} biaya berulang yang perlu direview.`,
		);
	}
	if (isRisky) {
		summaryParts.push(
			"Pengeluaran melebihi pemasukan bulan ini, perlu perhatian lebih.",
		);
	}

	const insights: AiInsight[] = candidates.map((c) => ({
		type: c.type,
		severity: c.severity,
		title: c.title,
		description: c.description,
		amount: c.amountCents / 100,
		evidenceTransactionIds: c.transactionIds.slice(0, 10),
		suggestedAction: buildSuggestedAction(c.type),
	}));

	return {
		summary: summaryParts.join(" "),
		cashflowHealth: {
			score,
			label,
			reason:
				label === "good"
					? "Pemasukan melebihi pengeluaran dengan selisih yang sehat."
					: label === "risky"
						? "Pengeluaran melebihi atau mendekati pemasukan, perlu tindakan segera."
						: "Pengeluaran mendekati pemasukan, ada ruang untuk dioptimalkan.",
		},
		insights,
		categoryNotes: data.categoryBreakdown.slice(0, 4).map((c) => ({
			category: c.category,
			total: c.totalCents / 100,
			note: `${c.count} transaksi, ${c.percent}% dari total pengeluaran.`,
		})),
		nextMonthSuggestions: buildSuggestions(data, label),
		disclaimer:
			"Analisis ini dibuat otomatis berdasarkan data transaksi yang diupload, bukan nasihat keuangan profesional.",
	};
}

function buildSuggestedAction(type: CandidateInsight["type"]): string {
	const actions: Record<CandidateInsight["type"], string> = {
		overspending: "Review frekuensi kunjungan ke merchant ini bulan depan.",
		recurring: "Cek satu per satu apakah semua biaya berulang masih dipakai.",
		anomaly: "Konfirmasi transaksi ini di aplikasi bank Anda.",
		saving_opportunity:
			"Buat target penghematan 10-15% dari pengeluaran non-esensial.",
		category_pattern: "Tetapkan batas budget untuk kategori ini bulan depan.",
	};
	return (
		actions[type] ?? "Review transaksi terkait dan pertimbangkan penyesuaian."
	);
}

function buildSuggestions(data: AggregateData, label: string): string[] {
	const suggestions: string[] = [];
	if (label === "risky") {
		suggestions.push(
			"Prioritaskan mengurangi pengeluaran yang bisa ditunda bulan depan.",
		);
	}
	if (data.recurringItems.length > 0) {
		suggestions.push(
			`Review ${data.recurringItems.length} biaya berulang, hapus yang tidak dipakai.`,
		);
	}
	if (data.categoryBreakdown[0]) {
		suggestions.push(
			`Tetapkan budget untuk ${data.categoryBreakdown[0].category} agar pengeluaran lebih terkontrol.`,
		);
	}
	suggestions.push(
		"Upload laporan bulan depan untuk memantau tren pengeluaran dari waktu ke waktu.",
	);
	return suggestions.slice(0, 4);
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

function buildPeriodLabel(txns: Transaction[]): string {
	if (txns.length === 0) {
		return new Date().toLocaleDateString("id-ID", {
			month: "long",
			year: "numeric",
		});
	}
	const dates = txns.map((t) => new Date(t.transactionDate).getTime());
	const earliest = new Date(Math.min(...dates));
	return earliest.toLocaleDateString("id-ID", {
		month: "long",
		year: "numeric",
	});
}

// ─────────────────────────────────────────────
// Main service function
// ─────────────────────────────────────────────

export async function triggerAnalysis({
	userId,
	importId,
}: {
	userId: string;
	importId: string;
}): Promise<{ reportId: string; status: string }> {
	// Verify import ownership
	const [statementImport] = await db
		.select()
		.from(statementImports)
		.where(
			and(
				eq(statementImports.id, importId),
				eq(statementImports.userId, userId),
			),
		)
		.limit(1);

	if (!statementImport) {
		throw new Error("Import tidak ditemukan.");
	}

	if (
		statementImport.status !== "parsed" &&
		statementImport.totalTransactions === 0
	) {
		throw new Error(
			"Import belum selesai diparse atau tidak memiliki transaksi.",
		);
	}

	// Check if report already exists and is done
	const existing = await db
		.select()
		.from(analysisReports)
		.where(
			and(
				eq(analysisReports.importId, importId),
				eq(analysisReports.userId, userId),
			),
		)
		.limit(1);

	if (existing[0] && existing[0].status === "done") {
		return { reportId: existing[0].id, status: "done" };
	}

	// Create or reset report record
	const reportId = existing[0]?.id ?? randomUUID();
	if (!existing[0]) {
		await db.insert(analysisReports).values({
			id: reportId,
			importId,
			userId,
			status: "processing",
		});
	} else {
		await db
			.update(analysisReports)
			.set({ status: "processing", errorMessage: null, updatedAt: new Date() })
			.where(eq(analysisReports.id, reportId));

		// Remove old insights so we can regenerate
		await db
			.delete(analysisInsights)
			.where(eq(analysisInsights.reportId, reportId));
	}

	try {
		// Load transactions
		const txns = await db
			.select()
			.from(transactions)
			.where(
				and(
					eq(transactions.importId, importId),
					eq(transactions.userId, userId),
				),
			);

		const periodLabel = buildPeriodLabel(txns);
		const aggregates = buildAggregates(txns, periodLabel);
		const candidates = buildCandidateInsights(aggregates);

		let aiOutput: AiOutput;
		let usedFallback = false;
		let aiModel: string | null = null;

		if (env.ANTHROPIC_API_KEY) {
			try {
				aiOutput = await callClaudeAnalysis(aggregates, candidates);
				aiModel = AI_MODEL;
			} catch {
				aiOutput = buildFallbackOutput(aggregates, candidates);
				usedFallback = true;
			}
		} else {
			aiOutput = buildFallbackOutput(aggregates, candidates);
			usedFallback = true;
		}

		// Validate cashflow health label
		const validLabels = ["good", "watch", "risky"] as const;
		const healthLabel = validLabels.includes(
			aiOutput.cashflowHealth.label as (typeof validLabels)[number],
		)
			? aiOutput.cashflowHealth.label
			: "watch";

		// Save report
		await db
			.update(analysisReports)
			.set({
				status: usedFallback ? "fallback" : "done",
				summaryText: aiOutput.summary,
				cashflowHealthScore: Math.min(
					100,
					Math.max(0, Math.round(aiOutput.cashflowHealth.score)),
				),
				cashflowHealthLabel: healthLabel,
				cashflowHealthReason: aiOutput.cashflowHealth.reason,
				nextMonthSuggestions: JSON.stringify(aiOutput.nextMonthSuggestions),
				disclaimer: aiOutput.disclaimer,
				rawAiResponse: JSON.stringify(aiOutput),
				inputSummaryJson: JSON.stringify(aggregates),
				aiModel,
				errorMessage: null,
				updatedAt: new Date(),
			})
			.where(eq(analysisReports.id, reportId));

		// Save insights
		if (aiOutput.insights.length > 0) {
			const validTypes = [
				"overspending",
				"recurring",
				"anomaly",
				"saving_opportunity",
				"category_pattern",
			];
			const validSeverities = ["low", "medium", "high"];

			await db.insert(analysisInsights).values(
				aiOutput.insights.slice(0, 10).map((insight, idx) => ({
					id: randomUUID(),
					reportId,
					userId,
					type: validTypes.includes(insight.type)
						? insight.type
						: "category_pattern",
					severity: validSeverities.includes(insight.severity)
						? insight.severity
						: "medium",
					title: String(insight.title ?? "").slice(0, 200),
					description: String(insight.description ?? "").slice(0, 1000),
					amountCents: insight.amount
						? Math.round(Number(insight.amount) * 100)
						: null,
					evidenceTransactionIds: JSON.stringify(
						Array.isArray(insight.evidenceTransactionIds)
							? insight.evidenceTransactionIds.slice(0, 10)
							: [],
					),
					suggestedAction: insight.suggestedAction
						? String(insight.suggestedAction).slice(0, 500)
						: null,
					sortOrder: idx,
				})),
			);
		}

		// Update import status to completed
		await db
			.update(statementImports)
			.set({ status: "completed", updatedAt: new Date() })
			.where(
				and(
					eq(statementImports.id, importId),
					eq(statementImports.userId, userId),
				),
			);

		return { reportId, status: usedFallback ? "fallback" : "done" };
	} catch (err) {
		// Crash recovery: mark report as failed so it's not stuck in "processing"
		await db
			.update(analysisReports)
			.set({
				status: "failed",
				errorMessage:
					err instanceof Error
						? err.message
						: "Terjadi kesalahan tidak terduga.",
				updatedAt: new Date(),
			})
			.where(eq(analysisReports.id, reportId));
		throw err;
	}
}

export async function getAnalysisByImportId(userId: string, importId: string) {
	const [report] = await db
		.select()
		.from(analysisReports)
		.where(
			and(
				eq(analysisReports.importId, importId),
				eq(analysisReports.userId, userId),
			),
		)
		.limit(1);

	if (!report) {
		return null;
	}

	const insights = await db
		.select()
		.from(analysisInsights)
		.where(eq(analysisInsights.reportId, report.id))
		.orderBy(analysisInsights.sortOrder);

	const suggestions = report.nextMonthSuggestions
		? (JSON.parse(report.nextMonthSuggestions) as string[])
		: [];

	return {
		report,
		insights: insights.map((ins) => ({
			...ins,
			evidenceTransactionIds: ins.evidenceTransactionIds
				? (JSON.parse(ins.evidenceTransactionIds) as string[])
				: [],
		})),
		nextMonthSuggestions: suggestions,
	};
}
