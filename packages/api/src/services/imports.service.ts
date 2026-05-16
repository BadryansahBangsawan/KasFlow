import { db } from "@KasFlow/db";
import {
	rawTransactionRows,
	statementFiles,
	statementImports,
	transactions,
} from "@KasFlow/db/schema/imports";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { and, desc, eq } from "drizzle-orm";

import { parseBcaStatementPdf, parserVersion } from "../parsers/bca";

const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export type ProcessUploadResult = {
	importId: string;
	status: string;
	message: string;
	totalTransactions: number;
};

export async function processBcaStatementUpload({
	userId,
	file,
}: {
	userId: string;
	file: File;
}): Promise<ProcessUploadResult> {
	validateUploadFile(file);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const fileHash = createHash("sha256")
		.update(new Uint8Array(buffer))
		.digest("hex");
	const importId = randomUUID();
	const fileId = randomUUID();
	const storageKey = await storeUploadedFile({
		importId,
		fileName: file.name,
		buffer,
	});

	const [createdImport] = await db
		.insert(statementImports)
		.values({
			id: importId,
			userId,
			bankCode: "bca",
			status: "validating",
			parserVersion,
		})
		.returning();

	if (!createdImport) {
		throw new Error("Gagal membuat import statement.");
	}

	await db.insert(statementFiles).values({
		id: fileId,
		importId,
		userId,
		originalName: file.name,
		mimeType: file.type || "application/pdf",
		sizeBytes: file.size,
		sha256: fileHash,
		storageKey,
	});

	await db
		.update(statementImports)
		.set({
			status: "parsing",
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(statementImports.id, importId),
				eq(statementImports.userId, userId),
			),
		);

	const result = await parseBcaStatementPdf(buffer);
	const totalDebitCents = result.transactions
		.filter((transaction) => transaction.direction === "debit")
		.reduce((total, transaction) => total + transaction.amountCents, 0);
	const totalCreditCents = result.transactions
		.filter((transaction) => transaction.direction === "credit")
		.reduce((total, transaction) => total + transaction.amountCents, 0);

	if (result.rawRows.length > 0) {
		await db.insert(rawTransactionRows).values(
			result.rawRows.map((row) => ({
				id: randomUUID(),
				importId,
				userId,
				pageNumber: row.pageNumber,
				rowNumber: row.rowNumber,
				rawText: row.rawText,
				parsedJson: row.parsedJson,
				warningCode: row.warningCode,
				confidence: row.confidence,
			})),
		);
	}

	if (result.transactions.length > 0) {
		await db.insert(transactions).values(
			result.transactions.map((transaction) => ({
				id: randomUUID(),
				importId,
				userId,
				bankCode: "bca",
				transactionDate: transaction.transactionDate,
				descriptionOriginal: transaction.descriptionOriginal,
				descriptionClean: transaction.descriptionClean,
				merchantName: transaction.merchantName,
				transactionType: transaction.transactionType,
				direction: transaction.direction,
				amountCents: transaction.amountCents,
				currency: "IDR",
				balanceAfterCents: transaction.balanceAfterCents,
				categoryName: transaction.categoryName,
				confidence: transaction.confidence,
				sourcePage: transaction.sourcePage,
				sourceRow: transaction.sourceRow,
				duplicateHash: transaction.duplicateHash,
			})),
		);
	}

	await db
		.update(statementFiles)
		.set({
			pageCount: result.pageCount,
			isEncrypted: result.isEncrypted,
			hasTextLayer: result.hasTextLayer,
		})
		.where(
			and(eq(statementFiles.id, fileId), eq(statementFiles.userId, userId)),
		);

	await db
		.update(statementImports)
		.set({
			status: result.status,
			parserMode: result.parserMode,
			importConfidence: result.importConfidence,
			totalTransactions: result.transactions.length,
			totalDebitCents,
			totalCreditCents,
			errorCode: result.errorCode,
			errorMessage: result.errorMessage,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(statementImports.id, importId),
				eq(statementImports.userId, userId),
			),
		);

	return {
		importId,
		status: result.status,
		message: buildUploadMessage(
			result.status,
			result.errorMessage,
			result.transactions.length,
		),
		totalTransactions: result.transactions.length,
	};
}

export async function listUserImports(userId: string) {
	return db
		.select()
		.from(statementImports)
		.where(eq(statementImports.userId, userId))
		.orderBy(desc(statementImports.createdAt));
}

export async function getUserImportDetail(userId: string, importId: string) {
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
		return null;
	}

	const rows = await db
		.select()
		.from(transactions)
		.where(
			and(eq(transactions.importId, importId), eq(transactions.userId, userId)),
		)
		.orderBy(transactions.transactionDate, transactions.sourceRow);

	const [file] = await db
		.select()
		.from(statementFiles)
		.where(
			and(
				eq(statementFiles.importId, importId),
				eq(statementFiles.userId, userId),
			),
		)
		.limit(1);

	return {
		import: statementImport,
		file: file ?? null,
		transactions: rows,
	};
}

function validateUploadFile(file: File) {
	const fileName = file.name.toLowerCase();
	const mimeType = file.type || "application/pdf";

	if (!fileName.endsWith(".pdf") && mimeType !== "application/pdf") {
		throw new Error(
			"MVP KasFlow saat ini hanya menerima file PDF laporan BCA.",
		);
	}

	if (file.size <= 0) {
		throw new Error("File kosong atau rusak.");
	}

	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		throw new Error("Ukuran file maksimal 15 MB.");
	}
}

async function storeUploadedFile({
	importId,
	fileName,
	buffer,
}: {
	importId: string;
	fileName: string;
	buffer: Buffer;
}) {
	const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
	const uploadDir = join(process.cwd(), "storage", "imports", importId);
	const storageKey = join(uploadDir, safeFileName);
	await mkdir(uploadDir, { recursive: true });
	await writeFile(storageKey, new Uint8Array(buffer));
	return storageKey;
}

function buildUploadMessage(
	status: string,
	errorMessage: string | null,
	totalTransactions: number,
) {
	if (status === "parsed") {
		return `${totalTransactions} transaksi BCA berhasil diproses.`;
	}
	if (status === "needs_password") {
		return "PDF BCA membutuhkan password sebelum bisa diparsing.";
	}
	return (
		errorMessage ??
		"File tersimpan, tetapi parser belum bisa membaca transaksi dari file ini."
	);
}
