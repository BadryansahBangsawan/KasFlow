import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	getAnalysisByImportId,
	triggerAnalysis,
} from "../services/analysis.service";

export const analysisRouter = router({
	trigger: protectedProcedure
		.input(
			z.object({
				importId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const result = await triggerAnalysis({
					userId: ctx.session.user.id,
					importId: input.importId,
				});
				return result;
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Analisis gagal dijalankan.",
				});
			}
		}),

	byImportId: protectedProcedure
		.input(
			z.object({
				importId: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const result = await getAnalysisByImportId(
				ctx.session.user.id,
				input.importId,
			);
			if (!result) {
				return null;
			}
			return result;
		}),
});
