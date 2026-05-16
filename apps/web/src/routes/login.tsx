import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AuthCharacterPanel } from "@/components/auth-character-panel";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

type LoginSearch = {
	next: "/dashboard" | "/imports/new";
};

export const Route = createFileRoute("/login")({
	validateSearch: (search): LoginSearch => ({
		next: search.next === "/imports/new" ? "/imports/new" : "/dashboard",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { next } = Route.useSearch();
	const [showSignIn, setShowSignIn] = useState(true);
	const [isTyping, setIsTyping] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [hasPassword, setHasPassword] = useState(false);

	return (
		<main className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[1fr_0.95fr]">
			<AuthCharacterPanel
				isTyping={isTyping}
				showPassword={showPassword}
				hasPassword={hasPassword}
			/>
			<section className="flex items-center justify-center bg-background px-4 py-10 sm:px-6">
				<div className="w-full max-w-[430px]">
					<div className="mb-10 text-center lg:hidden">
						<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
							K
						</div>
						<p className="font-semibold">KasFlow</p>
					</div>
					{showSignIn ? (
						<SignInForm
							redirectTo={next}
							showPassword={showPassword}
							onShowPasswordChange={setShowPassword}
							onPasswordActivity={(password) =>
								setHasPassword(password.length > 0)
							}
							onTypingChange={setIsTyping}
							onSwitchToSignUp={() => setShowSignIn(false)}
						/>
					) : (
						<SignUpForm
							redirectTo={next}
							showPassword={showPassword}
							onShowPasswordChange={setShowPassword}
							onPasswordActivity={(password) =>
								setHasPassword(password.length > 0)
							}
							onTypingChange={setIsTyping}
							onSwitchToSignIn={() => setShowSignIn(true)}
						/>
					)}
				</div>
			</section>
		</main>
	);
}
