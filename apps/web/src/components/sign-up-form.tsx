import { Button } from "@KasFlow/ui/components/button";
import { Checkbox } from "@KasFlow/ui/components/checkbox";
import { Input } from "@KasFlow/ui/components/input";
import { Label } from "@KasFlow/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({
	redirectTo = "/dashboard",
	showPassword,
	onShowPasswordChange,
	onPasswordActivity,
	onTypingChange,
	onSwitchToSignIn,
}: {
	redirectTo?: "/dashboard" | "/imports/new";
	showPassword: boolean;
	onShowPasswordChange: (showPassword: boolean) => void;
	onPasswordActivity: (password: string) => void;
	onTypingChange: (isTyping: boolean) => void;
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({
		from: "/login",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: redirectTo,
						});
						toast.success("Akun berhasil dibuat");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="w-full">
			<div className="mb-10 space-y-2 text-center">
				<h1 className="font-bold text-3xl tracking-tight">Buat akun KasFlow</h1>
				<p className="text-muted-foreground text-sm">
					Akun diperlukan sebelum upload laporan bank.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Nama
								</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="Nama kamu"
									value={field.state.value}
									onFocus={() => onTypingChange(true)}
									onBlur={() => {
										field.handleBlur();
										onTypingChange(false);
									}}
									onChange={(e) => {
										field.handleChange(e.target.value);
										onTypingChange(true);
									}}
									className="h-12 rounded-xl border-border/70 bg-background px-3"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Email
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder="nama@email.com"
									autoComplete="email"
									value={field.state.value}
									onFocus={() => onTypingChange(true)}
									onBlur={() => {
										field.handleBlur();
										onTypingChange(false);
									}}
									onChange={(e) => {
										field.handleChange(e.target.value);
										onTypingChange(true);
									}}
									className="h-12 rounded-xl border-border/70 bg-background px-3"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name} className="font-medium text-sm">
									Password
								</Label>
								<div className="relative">
									<Input
										id={field.name}
										name={field.name}
										type={showPassword ? "text" : "password"}
										placeholder="Minimal 8 karakter"
										autoComplete="new-password"
										value={field.state.value}
										onFocus={() => onTypingChange(true)}
										onBlur={() => {
											field.handleBlur();
											onTypingChange(false);
										}}
										onChange={(e) => {
											field.handleChange(e.target.value);
											onPasswordActivity(e.target.value);
											onTypingChange(true);
										}}
										className="h-12 rounded-xl border-border/70 bg-background px-3 pr-11"
									/>
									<button
										type="button"
										onClick={() => onShowPasswordChange(!showPassword)}
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
										aria-label={
											showPassword
												? "Sembunyikan password"
												: "Tampilkan password"
										}
									>
										{showPassword ? (
											<EyeOff className="size-5" />
										) : (
											<Eye className="size-5" />
										)}
									</button>
								</div>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div className="flex items-center gap-2">
					<Checkbox id="accept-scope" />
					<Label
						htmlFor="accept-scope"
						className="cursor-pointer font-normal text-sm"
					>
						Saya paham KasFlow MVP fokus pada laporan BCA.
					</Label>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="h-12 w-full rounded-xl text-base"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Memproses..." : "Daftar"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-6">
				<Button
					variant="outline"
					className="h-12 w-full rounded-xl"
					type="button"
					disabled
				>
					<Mail className="size-5" />
					Daftar Google nanti
				</Button>
			</div>

			<div className="mt-8 text-center text-muted-foreground text-sm">
				Sudah punya akun?{" "}
				<Button
					variant="link"
					onClick={onSwitchToSignIn}
					className="h-auto p-0 font-semibold text-foreground"
				>
					Masuk
				</Button>
			</div>
		</div>
	);
}
