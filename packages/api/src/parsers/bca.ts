import { createHash } from "node:crypto";
import { PasswordException, PDFParse } from "pdf-parse";

export type TransactionDirection = "debit" | "credit";

export type ParsedBcaTransaction = {
	transactionDate: Date;
	descriptionOriginal: string;
	descriptionClean: string;
	merchantName: string | null;
	transactionType: string;
	direction: TransactionDirection;
	amountCents: number;
	balanceAfterCents: number | null;
	categoryName: string;
	confidence: number;
	sourcePage: number | null;
	sourceRow: number;
	rawText: string;
	duplicateHash: string;
};

export type ParsedBcaRawRow = {
	pageNumber: number | null;
	rowNumber: number;
	rawText: string;
	parsedJson: string;
	warningCode: string | null;
	confidence: number;
};

export type BcaParseResult = {
	status: "parsed" | "needs_password" | "failed";
	parserMode: "text_pdf" | "encrypted_pdf" | "scanned_pdf" | "unsupported";
	detectedBank: "bca" | null;
	pageCount: number | null;
	hasTextLayer: boolean;
	isEncrypted: boolean;
	importConfidence: number;
	transactions: ParsedBcaTransaction[];
	rawRows: ParsedBcaRawRow[];
	errorCode: string | null;
	errorMessage: string | null;
	warnings: string[];
};

type PdfTextExtraction = {
	text: string;
	pageCount: number | null;
};

const BCA_PARSER_VERSION = "bca-parser-v1";
const MONTHS: Record<string, number> = {
	JAN: 0,
	JANUARI: 0,
	FEB: 1,
	FEBRUARI: 1,
	MAR: 2,
	MARET: 2,
	APR: 3,
	APRIL: 3,
	MEI: 4,
	MAY: 4,
	JUN: 5,
	JUNI: 5,
	JUL: 6,
	JULI: 6,
	AGU: 7,
	AGUSTUS: 7,
	AUG: 7,
	SEP: 8,
	SEPTEMBER: 8,
	OKT: 9,
	OKTOBER: 9,
	OCT: 9,
	NOV: 10,
	NOVEMBER: 10,
	DES: 11,
	DESEMBER: 11,
	DEC: 11,
};

const CATEGORY_RULES: Array<{
	category: string;
	type: string;
	keywords: string[];
}> = [
	{
		category: "Food and drink",
		type: "qris_payment",
		keywords: [
			"QRIS",
			"RESTO",
			"CAFE",
			"KOPI",
			"COFFEE",
			"MCD",
			"KFC",
			"BURGER",
			"FOOD",
		],
	},
	{
		category: "Transportation",
		type: "transportation",
		keywords: ["GRAB", "GOJEK", "GOTO", "MAXIM", "TAXI", "KAI", "TRAVELOKA"],
	},
	{
		category: "Bills and utilities",
		type: "bill_payment",
		keywords: ["PLN", "PDAM", "TELKOM", "INDIHOME", "PULSA", "BPJS", "LISTRIK"],
	},
	{
		category: "Bank fees",
		type: "admin_fee",
		keywords: ["ADMIN", "BIAYA", "FEE", "ADM"],
	},
	{
		category: "Income",
		type: "salary_income",
		keywords: ["GAJI", "PAYROLL", "SALARY", "HONOR", "UPAH"],
	},
	{
		category: "Cash withdrawal",
		type: "cash_withdrawal",
		keywords: ["TARIK TUNAI", "ATM WD", "CASH WITHDRAWAL"],
	},
	{
		category: "Transfer",
		type: "bank_transfer",
		keywords: ["TRSF", "TRANSFER", "BI-FAST", "BIFAST", "RTGS", "LLG"],
	},
	{
		category: "Shopping",
		type: "shopping",
		keywords: [
			"TOKOPEDIA",
			"SHOPEE",
			"LAZADA",
			"BUKALAPAK",
			"BLIBLI",
			"ALFAMART",
			"INDOMARET",
		],
	},
];

export const parserVersion = BCA_PARSER_VERSION;

export async function parseBcaStatementPdf(
	buffer: Buffer,
	password?: string,
): Promise<BcaParseResult> {
	const rawPreview = buffer
		.subarray(0, Math.min(buffer.length, 100_000))
		.toString("latin1");
	const pdfLooksEncrypted = rawPreview.includes("/Encrypt");

	try {
		const extracted = await extractPdfText(buffer, password);
		const text = cleanText(extracted.text);
		const detectedBank =
			detectBca(text) || detectBca(rawPreview) ? "bca" : null;
		const transactions = parseBcaTransactions(text);
		const rawRows = transactions.map((transaction) => ({
			pageNumber: transaction.sourcePage,
			rowNumber: transaction.sourceRow,
			rawText: transaction.rawText,
			parsedJson: JSON.stringify(transaction),
			warningCode: transaction.confidence < 70 ? "LOW_CONFIDENCE" : null,
			confidence: transaction.confidence,
		}));
		const importConfidence = calculateImportConfidence(
			transactions,
			detectedBank,
		);

		if (!detectedBank) {
			return buildFailedResult({
				parserMode: "unsupported",
				pageCount: extracted.pageCount,
				hasTextLayer: text.length > 0,
				isEncrypted: pdfLooksEncrypted,
				errorCode: "BANK_NOT_BCA",
				errorMessage:
					"File berhasil dibaca, tetapi tidak terdeteksi sebagai laporan BCA.",
			});
		}

		if (transactions.length === 0) {
			return buildFailedResult({
				parserMode: text.length > 0 ? "text_pdf" : "scanned_pdf",
				pageCount: extracted.pageCount,
				hasTextLayer: text.length > 0,
				isEncrypted: pdfLooksEncrypted,
				errorCode:
					text.length > 0 ? "NO_TRANSACTIONS_FOUND" : "TEXT_LAYER_NOT_FOUND",
				errorMessage:
					text.length > 0
						? "Laporan BCA terbaca, tetapi transaksi belum ditemukan oleh parser awal."
						: "PDF tidak memiliki text layer yang bisa dibaca. OCR belum tersedia di MVP.",
			});
		}

		return {
			status: importConfidence >= 70 ? "parsed" : "parsed",
			parserMode: "text_pdf",
			detectedBank,
			pageCount: extracted.pageCount,
			hasTextLayer: text.length > 0,
			isEncrypted: pdfLooksEncrypted,
			importConfidence,
			transactions,
			rawRows,
			errorCode: null,
			errorMessage: null,
			warnings:
				importConfidence < 70
					? ["Parser confidence rendah, review transaksi disarankan."]
					: [],
		};
	} catch (error) {
		if (error instanceof PasswordException || pdfLooksEncrypted) {
			return buildFailedResult({
				parserMode: "encrypted_pdf",
				pageCount: null,
				hasTextLayer: false,
				isEncrypted: true,
				status: "needs_password",
				errorCode: "PDF_ENCRYPTED",
				errorMessage:
					"PDF BCA terenkripsi atau membutuhkan password. Masukkan password statement untuk retry.",
			});
		}

		return buildFailedResult({
			parserMode: "unsupported",
			pageCount: null,
			hasTextLayer: false,
			isEncrypted: pdfLooksEncrypted,
			errorCode: "PDF_PARSE_FAILED",
			errorMessage:
				error instanceof Error ? error.message : "PDF gagal diproses.",
		});
	}
}

async function extractPdfText(
	buffer: Buffer,
	password?: string,
): Promise<PdfTextExtraction> {
	const parser = new PDFParse({
		data: new Uint8Array(buffer),
		password,
	});

	try {
		const result = await parser.getText();
		return {
			text: result.text,
			pageCount: result.total || null,
		};
	} finally {
		await parser.destroy();
	}
}

function buildFailedResult({
	parserMode,
	pageCount,
	hasTextLayer,
	isEncrypted,
	errorCode,
	errorMessage,
	status = "failed",
}: {
	parserMode: BcaParseResult["parserMode"];
	pageCount: number | null;
	hasTextLayer: boolean;
	isEncrypted: boolean;
	errorCode: string;
	errorMessage: string;
	status?: BcaParseResult["status"];
}): BcaParseResult {
	return {
		status,
		parserMode,
		detectedBank: null,
		pageCount,
		hasTextLayer,
		isEncrypted,
		importConfidence: 0,
		transactions: [],
		rawRows: [],
		errorCode,
		errorMessage,
		warnings: [],
	};
}

function cleanText(text: string) {
	return text
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
		.replace(/[ \t]+/g, " ")
		.trim();
}

function detectBca(text: string) {
	const upper = text.toUpperCase();
	return (
		upper.includes("BANK CENTRAL ASIA") ||
		upper.includes("BCA") ||
		upper.includes("MYBCA")
	);
}

function parseBcaTransactions(text: string): ParsedBcaTransaction[] {
	const year = detectStatementYear(text) ?? new Date().getFullYear();
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const rows: string[] = [];
	let currentRow = "";

	for (const line of lines) {
		if (startsWithDate(line)) {
			if (currentRow) {
				rows.push(currentRow.trim());
			}
			currentRow = line;
		} else if (currentRow && shouldAppendContinuation(line)) {
			currentRow = `${currentRow} ${line}`;
		}
	}

	if (currentRow) {
		rows.push(currentRow.trim());
	}

	return rows
		.map((row, index) => parseTransactionRow(row, index + 1, year))
		.filter(
			(transaction): transaction is ParsedBcaTransaction =>
				transaction !== null,
		);
}

function startsWithDate(line: string) {
	return /^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3,9})(\s|$)/.test(
		line,
	);
}

function shouldAppendContinuation(line: string) {
	const upper = line.toUpperCase();
	if (upper.includes("SALDO AWAL") || upper.includes("SALDO AKHIR")) {
		return false;
	}
	if (
		upper.includes("MUTASI") ||
		upper.includes("TANGGAL") ||
		upper.includes("KETERANGAN")
	) {
		return false;
	}
	return true;
}

function parseTransactionRow(
	row: string,
	sourceRow: number,
	fallbackYear: number,
): ParsedBcaTransaction | null {
	const date = parseDateFromRow(row, fallbackYear);
	if (!date) {
		return null;
	}

	const moneyMatches = findMoneyTokens(row);
	if (moneyMatches.length === 0) {
		return null;
	}

	const balanceAfterCents =
		moneyMatches.length >= 2 ? (moneyMatches.at(-1)?.valueCents ?? null) : null;
	const amountToken =
		moneyMatches.length >= 2 ? moneyMatches.at(-2) : moneyMatches.at(-1);
	if (!amountToken || amountToken.valueCents <= 0) {
		return null;
	}

	const descriptionOriginal = extractDescription(row, amountToken.raw);
	const descriptionClean = normalizeDescription(descriptionOriginal);
	const direction = detectDirection(row, descriptionClean);
	const merchantName = detectMerchant(descriptionClean);
	const classification = classifyTransaction(descriptionClean, direction);
	const confidence = calculateTransactionConfidence({
		row,
		descriptionClean,
		direction,
		hasBalance: balanceAfterCents !== null,
		amountCount: moneyMatches.length,
	});
	const duplicateHash = createTransactionHash({
		date,
		descriptionClean,
		direction,
		amountCents: amountToken.valueCents,
		balanceAfterCents,
	});

	return {
		transactionDate: date,
		descriptionOriginal,
		descriptionClean,
		merchantName,
		transactionType: classification.type,
		direction,
		amountCents: amountToken.valueCents,
		balanceAfterCents,
		categoryName: classification.category,
		confidence,
		sourcePage: null,
		sourceRow,
		rawText: row,
		duplicateHash,
	} satisfies ParsedBcaTransaction;
}

function parseDateFromRow(row: string, fallbackYear: number) {
	const numeric = row.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
	if (numeric) {
		const day = Number(numeric[1]);
		const month = Number(numeric[2]) - 1;
		const rawYear = numeric[3] ? Number(numeric[3]) : fallbackYear;
		const year = rawYear < 100 ? 2000 + rawYear : rawYear;
		return buildDate(year, month, day);
	}

	const named = row.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{2,4}))?/);
	if (named) {
		const day = Number(named[1]);
		const month = MONTHS[named[2]?.toUpperCase() ?? ""];
		const rawYear = named[3] ? Number(named[3]) : fallbackYear;
		const year = rawYear < 100 ? 2000 + rawYear : rawYear;
		if (month !== undefined) {
			return buildDate(year, month, day);
		}
	}

	return null;
}

function buildDate(year: number, month: number, day: number) {
	const date = new Date(Date.UTC(year, month, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return date;
}

function detectStatementYear(text: string) {
	const match = text.match(/\b(20\d{2})\b/);
	return match ? Number(match[1]) : null;
}

function findMoneyTokens(row: string) {
	const matches = Array.from(
		row.matchAll(
			/(?:Rp\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,})(?:\s*(?:CR|DB))?/gi,
		),
	);

	return matches
		.map((match) => {
			const raw = match[0].trim();
			return {
				raw,
				valueCents: parseMoneyToCents(raw),
			};
		})
		.filter((token) => token.valueCents > 0);
}

function parseMoneyToCents(value: string) {
	const numeric = value.replace(/Rp/gi, "").replace(/[^\d.,-]/g, "");
	if (!numeric) {
		return 0;
	}

	const hasComma = numeric.includes(",");
	const hasDot = numeric.includes(".");
	let normalized = numeric;

	if (hasComma && hasDot) {
		const lastComma = numeric.lastIndexOf(",");
		const lastDot = numeric.lastIndexOf(".");
		if (lastComma > lastDot) {
			normalized = numeric.replace(/\./g, "").replace(",", ".");
		} else {
			normalized = numeric.replace(/,/g, "");
		}
	} else if (hasComma) {
		normalized = numeric.replace(/\./g, "").replace(",", ".");
	} else if (hasDot) {
		const segments = numeric.split(".");
		normalized =
			segments.at(-1)?.length === 2
				? numeric.replace(/,/g, "")
				: numeric.replace(/\./g, "");
	}

	const amount = Number(normalized);
	if (!Number.isFinite(amount)) {
		return 0;
	}

	return Math.round(amount * 100);
}

function extractDescription(row: string, amountRaw: string) {
	const withoutDate = row.replace(
		/^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{2,4})?)\s*/,
		"",
	);
	const amountIndex = withoutDate.indexOf(amountRaw);
	const description =
		amountIndex >= 0 ? withoutDate.slice(0, amountIndex) : withoutDate;
	return description.replace(/\s+(CR|DB)\b/gi, "").trim() || withoutDate.trim();
}

function normalizeDescription(description: string) {
	return description
		.replace(/\s+/g, " ")
		.replace(/\bREF(?:ERENSI)?[:\s-]*\w+/gi, "")
		.trim();
}

function detectDirection(
	row: string,
	description: string,
): TransactionDirection {
	const upper = `${row} ${description}`.toUpperCase();
	if (/\b(CR|KREDIT|CREDIT)\b/.test(upper)) {
		return "credit";
	}
	if (
		CATEGORY_RULES.find((rule) => rule.category === "Income")?.keywords.some(
			(keyword) => upper.includes(keyword),
		)
	) {
		return "credit";
	}
	return "debit";
}

function detectMerchant(description: string) {
	const upper = description.toUpperCase();
	const cleaned = upper
		.replace(
			/\b(QRIS|TRSF|TRANSFER|BI-FAST|BIFAST|EDC|VA|MBANKING|M-BCA|DB|CR)\b/g,
			" ",
		)
		.replace(/\d{4,}/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return cleaned ? toTitleCase(cleaned.split(" ").slice(0, 5).join(" ")) : null;
}

function classifyTransaction(
	description: string,
	direction: TransactionDirection,
) {
	const upper = description.toUpperCase();
	if (direction === "credit") {
		const incomeRule = CATEGORY_RULES.find(
			(rule) => rule.category === "Income",
		);
		return {
			category: incomeRule?.category ?? "Income",
			type: incomeRule?.type ?? "salary_income",
		};
	}

	const matchedRule = CATEGORY_RULES.find((rule) =>
		rule.keywords.some((keyword) => upper.includes(keyword)),
	);

	return {
		category: matchedRule?.category ?? "Other",
		type: matchedRule?.type ?? "unknown",
	};
}

function calculateTransactionConfidence({
	row,
	descriptionClean,
	direction,
	hasBalance,
	amountCount,
}: {
	row: string;
	descriptionClean: string;
	direction: TransactionDirection;
	hasBalance: boolean;
	amountCount: number;
}) {
	let confidence = 40;
	if (startsWithDate(row)) {
		confidence += 20;
	}
	if (descriptionClean.length >= 4) {
		confidence += 15;
	}
	if (direction) {
		confidence += 10;
	}
	if (hasBalance) {
		confidence += 10;
	}
	if (amountCount >= 1) {
		confidence += 10;
	}
	return Math.min(confidence, 100);
}

function calculateImportConfidence(
	transactions: ParsedBcaTransaction[],
	detectedBank: "bca" | null,
) {
	if (transactions.length === 0 || !detectedBank) {
		return 0;
	}

	const average =
		transactions.reduce(
			(total, transaction) => total + transaction.confidence,
			0,
		) / transactions.length;
	return Math.round(Math.min(average + 5, 100));
}

function createTransactionHash({
	date,
	descriptionClean,
	direction,
	amountCents,
	balanceAfterCents,
}: {
	date: Date;
	descriptionClean: string;
	direction: TransactionDirection;
	amountCents: number;
	balanceAfterCents: number | null;
}) {
	return createHash("sha256")
		.update(
			[
				"bca",
				date.toISOString().slice(0, 10),
				descriptionClean.toUpperCase(),
				direction,
				amountCents,
				balanceAfterCents ?? "",
			].join("|"),
		)
		.digest("hex");
}

function toTitleCase(value: string) {
	return value
		.toLowerCase()
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
		.trim();
}
