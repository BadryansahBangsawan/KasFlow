import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import { statementImports } from "./imports";

export const analysisReports = sqliteTable(
	"analysis_reports",
	{
		id: text("id").primaryKey(),
		importId: text("import_id")
			.notNull()
			.references(() => statementImports.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// pending | processing | done | failed | fallback
		status: text("status").default("pending").notNull(),
		summaryText: text("summary_text"),
		cashflowHealthScore: integer("cashflow_health_score"),
		// good | watch | risky
		cashflowHealthLabel: text("cashflow_health_label"),
		cashflowHealthReason: text("cashflow_health_reason"),
		// JSON array string[]
		nextMonthSuggestions: text("next_month_suggestions"),
		disclaimer: text("disclaimer"),
		// JSON: the full AI output for debug
		rawAiResponse: text("raw_ai_response"),
		// JSON: the aggregate summary sent to AI
		inputSummaryJson: text("input_summary_json"),
		errorMessage: text("error_message"),
		aiModel: text("ai_model"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("analysis_reports_import_idx").on(table.importId),
		index("analysis_reports_user_idx").on(table.userId),
	],
);

export const analysisInsights = sqliteTable(
	"analysis_insights",
	{
		id: text("id").primaryKey(),
		reportId: text("report_id")
			.notNull()
			.references(() => analysisReports.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// overspending | recurring | anomaly | saving_opportunity | category_pattern
		type: text("type").notNull(),
		// low | medium | high
		severity: text("severity").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull(),
		amountCents: integer("amount_cents"),
		// JSON array of transaction id strings
		evidenceTransactionIds: text("evidence_transaction_ids"),
		suggestedAction: text("suggested_action"),
		sortOrder: integer("sort_order").default(0).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("analysis_insights_report_idx").on(table.reportId),
		index("analysis_insights_user_idx").on(table.userId),
	],
);

export const analysisReportsRelations = relations(
	analysisReports,
	({ one, many }) => ({
		import: one(statementImports, {
			fields: [analysisReports.importId],
			references: [statementImports.id],
		}),
		user: one(user, {
			fields: [analysisReports.userId],
			references: [user.id],
		}),
		insights: many(analysisInsights),
	}),
);

export const analysisInsightsRelations = relations(
	analysisInsights,
	({ one }) => ({
		report: one(analysisReports, {
			fields: [analysisInsights.reportId],
			references: [analysisReports.id],
		}),
		user: one(user, {
			fields: [analysisInsights.userId],
			references: [user.id],
		}),
	}),
);
