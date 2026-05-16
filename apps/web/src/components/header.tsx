import {
	type AdaptiveNavItem,
	AdaptiveNavigationPill,
} from "@KasFlow/ui/components/3d-adaptive-navigation-bar";
import { Button } from "@KasFlow/ui/components/button";
import {
	InteractiveMenu,
	type InteractiveMenuItem,
} from "@KasFlow/ui/components/modern-mobile-menu";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	ArrowRight,
	Home,
	LayoutDashboard,
	LogIn,
	ShieldCheck,
	Sparkles,
	UploadCloud,
	Workflow,
} from "lucide-react";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const publicSections = [
	{ id: "home", label: "Home", icon: Home },
	{ id: "cara-kerja", label: "Cara kerja", icon: Workflow },
	{ id: "contoh-insight", label: "Insight", icon: Sparkles },
	{ id: "keamanan", label: "Keamanan", icon: ShieldCheck },
] as const;

export default function Header() {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { data: session } = authClient.useSession();
	const [activePublicSection, setActivePublicSection] = React.useState("home");
	const isLoginPage = pathname === "/login";

	React.useEffect(() => {
		if (session || pathname !== "/") {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

				if (visible?.target.id) {
					setActivePublicSection(visible.target.id);
				}
			},
			{ rootMargin: "-35% 0px -50% 0px", threshold: [0.2, 0.45, 0.7] },
		);

		for (const section of publicSections) {
			const element = document.getElementById(section.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [pathname, session]);

	const scrollToSection = React.useCallback(
		(sectionId: string) => {
			setActivePublicSection(sectionId);

			const runScroll = () => {
				const element = document.getElementById(sectionId);
				if (!element) {
					return;
				}

				element.scrollIntoView({ behavior: "smooth", block: "start" });
				window.history.replaceState(
					null,
					"",
					sectionId === "home" ? "/" : `/#${sectionId}`,
				);
			};

			if (pathname !== "/") {
				Promise.resolve(navigate({ to: "/" })).then(() => {
					window.setTimeout(runScroll, 60);
				});
				return;
			}

			runScroll();
		},
		[navigate, pathname],
	);

	const goTo = React.useCallback(
		(to: "/" | "/dashboard" | "/imports/new") => {
			void navigate({ to });
		},
		[navigate],
	);

	const goToLogin = React.useCallback(() => {
		void navigate({ to: "/login", search: { next: "/imports/new" } });
	}, [navigate]);

	const desktopItems: AdaptiveNavItem[] = session
		? [
				{
					id: "dashboard",
					label: "Dashboard",
					active: pathname === "/dashboard",
					onSelect: () => goTo("/dashboard"),
				},
				{
					id: "upload",
					label: "Upload",
					active: pathname.startsWith("/imports"),
					onSelect: () => goTo("/imports/new"),
				},
				{
					id: "landing",
					label: "Landing",
					active: pathname === "/",
					onSelect: () => goTo("/"),
				},
			]
		: publicSections.map((section) => ({
				id: section.id,
				label: section.label,
				active: pathname === "/" && activePublicSection === section.id,
				onSelect: () => scrollToSection(section.id),
			}));

	const activeDesktopId =
		desktopItems.find((item) => item.active)?.id ??
		(session ? "dashboard" : activePublicSection);

	const mobileItems: InteractiveMenuItem[] = session
		? [
				{
					label: "Home",
					icon: Home,
					active: pathname === "/",
					onClick: () => goTo("/"),
				},
				{
					label: "Dashboard",
					icon: LayoutDashboard,
					active: pathname === "/dashboard",
					onClick: () => goTo("/dashboard"),
				},
				{
					label: "Upload",
					icon: UploadCloud,
					active: pathname.startsWith("/imports"),
					onClick: () => goTo("/imports/new"),
				},
			]
		: [
				...publicSections.slice(0, 3).map((section) => ({
					label: section.id === "cara-kerja" ? "Cara" : section.label,
					icon: section.icon,
					active: pathname === "/" && activePublicSection === section.id,
					onClick: () => scrollToSection(section.id),
				})),
				{
					label: "Login",
					icon: LogIn,
					active: pathname === "/login",
					onClick: goToLogin,
				},
			];

	return (
		<>
			<header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl">
				<div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
					<Link
						to="/"
						className="inline-flex items-center gap-2 font-bold text-foreground"
					>
						<span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm shadow-sm">
							K
						</span>
						<span>KasFlow</span>
					</Link>

					{!isLoginPage ? (
						<div className="hidden justify-center lg:flex">
							<AdaptiveNavigationPill
								activeId={activeDesktopId}
								expandedWidth={session ? 390 : 548}
								items={desktopItems}
							/>
						</div>
					) : null}

					<div className="flex items-center justify-end gap-2">
						{!session && !isLoginPage ? (
							<Link to="/login" search={{ next: "/imports/new" }}>
								<Button className="hidden rounded-full sm:inline-flex">
									Coba KasFlow
									<ArrowRight data-icon="inline-end" />
								</Button>
							</Link>
						) : null}
						<ModeToggle />
						<UserMenu />
					</div>
				</div>
			</header>

			{!isLoginPage ? <InteractiveMenu items={mobileItems} /> : null}
		</>
	);
}
