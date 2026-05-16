import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const bankAccounts = sqliteTable(
	"bank_accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bankCode: text("bank_code").notNull(),
		accountMask: text("account_mask"),
		accountName: text("account_name"),
		currency: text("currency").default("IDR").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("bank_accounts_user_idx").on(table.userId),
		uniqueIndex("bank_accounts_user_bank_account_idx").on(
			table.userId,
			table.bankCode,
			table.accountMask,
		),
	],
);

export const statementImports = sqliteTable(
	"statement_imports",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bankAccountId: text("bank_account_id").references(() => bankAccounts.id, {
			onDelete: "set null",
		}),
		bankCode: text("bank_code").default("bca").notNull(),
		periodStart: integer("period_start", { mode: "timestamp_ms" }),
		periodEnd: integer("period_end", { mode: "timestamp_ms" }),
		status: text("status").default("uploaded").notNull(),
		parserMode: text("parser_mode"),
		parserVersion: text("parser_version").default("bca-parser-v1").notNull(),
		importConfidence: integer("import_confidence").default(0).notNull(),
		totalTransactions: integer("total_transactions").default(0).notNull(),
		totalDebitCents: integer("total_debit_cents").default(0).notNull(),
		totalCreditCents: integer("total_credit_cents").default(0).notNull(),
		openingBalanceCents: integer("opening_balance_cents"),
		closingBalanceCents: integer("closing_balance_cents"),
		errorCode: text("error_code"),
		errorMessage: text("error_message"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("statement_imports_user_idx").on(table.userId),
		index("statement_imports_user_status_idx").on(table.userId, table.status),
	],
);

export const statementFiles = sqliteTable(
	"statement_files",
	{
		id: text("id").primaryKey(),
		importId: text("import_id")
			.notNull()
			.references(() => statementImports.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		originalName: text("original_name").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		sha256: text("sha256").notNull(),
		storageKey: text("storage_key").notNull(),
		pageCount: integer("page_count"),
		isEncrypted: integer("is_encrypted", { mode: "boolean" })
			.default(false)
			.notNull(),
		hasTextLayer: integer("has_text_layer", { mode: "boolean" })
			.default(false)
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("statement_files_import_idx").on(table.importId),
		index("statement_files_user_hash_idx").on(table.userId, table.sha256),
	],
);

export const rawTransactionRows = sqliteTable(
	"raw_transaction_rows",
	{
		id: text("id").primaryKey(),
		importId: text("import_id")
			.notNull()
			.references(() => statementImports.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		pageNumber: integer("page_number"),
		rowNumber: integer("row_number").notNull(),
		rawText: text("raw_text").notNull(),
		parsedJson: text("parsed_json"),
		warningCode: text("warning_code"),
		confidence: integer("confidence").default(0).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("raw_transaction_rows_import_idx").on(table.importId)],
);

export const transactions = sqliteTable(
	"transactions",
	{
		id: text("id").primaryKey(),
		importId: text("import_id")
			.notNull()
			.references(() => statementImports.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bankAccountId: text("bank_account_id").references(() => bankAccounts.id, {
			onDelete: "set null",
		}),
		bankCode: text("bank_code").default("bca").notNull(),
		transactionDate: integer("transaction_date", {
			mode: "timestamp_ms",
		}).notNull(),
		postingDate: integer("posting_date", { mode: "timestamp_ms" }),
		descriptionOriginal: text("description_original").notNull(),
		descriptionClean: text("description_clean").notNull(),
		merchantName: text("merchant_name"),
		transactionType: text("transaction_type").default("unknown").notNull(),
		direction: text("direction").notNull(),
		amountCents: integer("amount_cents").notNull(),
		currency: text("currency").default("IDR").notNull(),
		balanceAfterCents: integer("balance_after_cents"),
		categoryName: text("category_name").default("Other").notNull(),
		confidence: integer("confidence").default(0).notNull(),
		sourcePage: integer("source_page"),
		sourceRow: integer("source_row"),
		duplicateHash: text("duplicate_hash").notNull(),
		userReviewed: integer("user_reviewed", { mode: "boolean" })
			.default(false)
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("transactions_import_idx").on(table.importId),
		index("transactions_user_date_idx").on(table.userId, table.transactionDate),
		uniqueIndex("transactions_import_duplicate_hash_idx").on(
			table.importId,
			table.duplicateHash,
		),
	],
);

export const bankAccountsRelations = relations(
	bankAccounts,
	({ many, one }) => ({
		user: one(user, {
			fields: [bankAccounts.userId],
			references: [user.id],
		}),
		imports: many(statementImports),
		transactions: many(transactions),
	}),
);

export const statementImportsRelations = relations(
	statementImports,
	({ many, one }) => ({
		user: one(user, {
			fields: [statementImports.userId],
			references: [user.id],
		}),
		bankAccount: one(bankAccounts, {
			fields: [statementImports.bankAccountId],
			references: [bankAccounts.id],
		}),
		files: many(statementFiles),
		rawRows: many(rawTransactionRows),
		transactions: many(transactions),
	}),
);

export const statementFilesRelations = relations(statementFiles, ({ one }) => ({
	import: one(statementImports, {
		fields: [statementFiles.importId],
		references: [statementImports.id],
	}),
	user: one(user, {
		fields: [statementFiles.userId],
		references: [user.id],
	}),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
	import: one(statementImports, {
		fields: [transactions.importId],
		references: [statementImports.id],
	}),
	user: one(user, {
		fields: [transactions.userId],
		references: [user.id],
	}),
	bankAccount: one(bankAccounts, {
		fields: [transactions.bankAccountId],
		references: [bankAccounts.id],
	}),
}));
