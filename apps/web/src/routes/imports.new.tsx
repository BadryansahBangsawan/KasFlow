import { env } from "@KasFlow/env/web";
import { Button } from "@KasFlow/ui/components/button";
import { StatementFileUpload } from "@KasFlow/ui/components/file-upload";
import { ProgressIndicator } from "@KasFlow/ui/components/progress-indicator";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/imports/new")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { next: "/imports/new" },
				throw: true,
			});
		}
		return { session };
	},
});

type UploadResult = {
	importId: string;
	status: string;
	message: string;
	totalTransactions: number;
};

function RouteComponent() {
	const queryClient = useQueryClient();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const progressStep = result ? 4 : isUploading ? 2 : selectedFile ? 1 : 1;

	async function uploadFile() {
		if (!selectedFile) {
			setError("Pilih PDF laporan BCA terlebih dahulu.");
			return;
		}

		setIsUploading(true);
		setError(null);
		setResult(null);

		const formData = new FormData();
		formData.append("file", selectedFile);

		try {
			const response = await fetch(`${env.VITE_SERVER_URL}/api/imports/bca`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.error ?? "Upload gagal diproses.");
			}

			setResult(payload);
			toast.success(payload.message);
			await queryClient.invalidateQueries();
		} catch (uploadError) {
			const message =
				uploadError instanceof Error
					? uploadError.message
					: "Upload gagal diproses.";
			setError(message);
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<div className="mb-8 max-w-2xl">
				<p className="font-semibold text-blue-700 text-sm">Upload BCA</p>
				<h1 className="mt-2 font-bold text-3xl tracking-tight">
					Upload laporan bulanan BCA.
				</h1>
				<p className="mt-3 text-muted-foreground text-sm leading-6">
					MVP KasFlow saat ini menerima satu file PDF BCA. File akan divalidasi,
					disimpan sebagai import, lalu parser mencoba membaca transaksi dari
					text layer PDF.
				</p>
			</div>

			<section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
				<div className="rounded-2xl border bg-white p-6 shadow-sm">
					<ProgressIndicator
						currentStep={progressStep}
						steps={[
							{ label: "Upload", description: "Pilih PDF BCA" },
							{ label: "Validasi", description: "Server cek file" },
							{ label: "Parsing", description: "Transaksi dibaca" },
							{ label: "Review", description: "Cek hasil" },
						]}
						className="mb-6"
					/>

					<StatementFileUpload
						selectedFile={selectedFile}
						disabled={isUploading}
						onFileSelect={(file) => {
							setSelectedFile(file);
							setResult(null);
							setError(null);
						}}
					/>

					{error && (
						<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
							{error}
						</div>
					)}

					{result && (
						<div className="mt-4 rounded-2xl border bg-slate-50 p-4">
							<p className="font-medium">{result.message}</p>
							<p className="mt-1 text-muted-foreground text-sm">
								Status: {result.status}. Transaksi terbaca:{" "}
								{result.totalTransactions}.
							</p>
							<Link
								to="/imports/$importId"
								params={{ importId: result.importId }}
								className="mt-4 inline-flex"
							>
								<Button variant="outline" className="rounded-full">
									Lihat detail import
								</Button>
							</Link>
						</div>
					)}

					<div className="mt-5 flex justify-end">
						<Button
							type="button"
							className="rounded-full"
							disabled={!selectedFile || isUploading}
							onClick={uploadFile}
						>
							{isUploading ? "Memproses..." : "Upload dan parse"}
						</Button>
					</div>
				</div>

				<aside className="space-y-4">
					{[
						[
							"1. Upload",
							"File PDF BCA dikirim ke server dan dicatat sebagai import.",
						],
						[
							"2. Validasi",
							"Server cek tipe file, ukuran, user ownership, dan metadata.",
						],
						[
							"3. Parsing",
							"Parser BCA membaca text layer, memecah row, lalu normalisasi transaksi.",
						],
						[
							"4. Review",
							"Jika transaksi terbaca, user bisa review hasilnya di tabel detail.",
						],
					].map(([title, description]) => (
						<div
							key={title}
							className="rounded-2xl border bg-white p-5 shadow-sm"
						>
							<h3 className="font-semibold">{title}</h3>
							<p className="mt-2 text-muted-foreground text-sm leading-6">
								{description}
							</p>
						</div>
					))}
				</aside>
			</section>
		</main>
	);
}
