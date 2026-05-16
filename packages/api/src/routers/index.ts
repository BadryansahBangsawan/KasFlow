import { protectedProcedure, publicProcedure, router } from "../index";
import { importsRouter } from "./imports.router";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	imports: importsRouter,
});
export type AppRouter = typeof appRouter;
