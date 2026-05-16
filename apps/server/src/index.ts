import { createContext } from "@KasFlow/api/context";
import { appRouter } from "@KasFlow/api/routers/index";
import { processBcaStatementUpload } from "@KasFlow/api/services/imports.service";
import { auth } from "@KasFlow/auth";
import { env } from "@KasFlow/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.post("/api/imports/bca", async (c) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Authentication required" }, 401);
	}

	try {
		const body = await c.req.parseBody();
		const uploadedFile = body.file;

		if (!(uploadedFile instanceof File)) {
			return c.json({ error: "File PDF BCA wajib diupload." }, 400);
		}

		const result = await processBcaStatementUpload({
			userId: session.user.id,
			file: uploadedFile,
		});

		return c.json(result);
	} catch (error) {
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "Upload gagal diproses.",
			},
			400,
		);
	}
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
