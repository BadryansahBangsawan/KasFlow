import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	getUserImportDetail,
	listUserImports,
} from "../services/imports.service";

export const importsRouter = router({
	list: protectedProcedure.query(({ ctx }) => {
		return listUserImports(ctx.session.user.id);
	}),
	byId: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const detail = await getUserImportDetail(ctx.session.user.id, input.id);
			if (!detail) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Import tidak ditemukan.",
				});
			}
			return detail;
		}),
});
