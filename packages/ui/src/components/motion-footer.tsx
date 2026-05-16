"use client";

import { cn } from "@KasFlow/ui/lib/utils";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowUp,
	Banknote,
	Heart,
	type LucideIcon,
	ShieldCheck,
	Sparkles,
	UploadCloud,
} from "lucide-react";
import * as React from "react";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

const footerStyles = `
.cinematic-footer-wrapper {
  -webkit-font-smoothing: antialiased;
  --footer-pill-bg-1: color-mix(in oklch, var(--foreground) 4%, transparent);
  --footer-pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --footer-pill-border: color-mix(in oklch, var(--foreground) 9%, transparent);
  --footer-pill-border-hover: color-mix(in oklch, var(--foreground) 22%, transparent);
  --footer-pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --footer-pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
}

@keyframes footer-breathe {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.55;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.08);
    opacity: 0.92;
  }
}

@keyframes footer-scroll-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes footer-heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  18%,
  44% {
    transform: scale(1.16);
  }
  30% {
    transform: scale(1);
  }
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--chart-2) 18%, transparent) 0%,
    color-mix(in oklch, var(--primary) 10%, transparent) 42%,
    transparent 72%
  );
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-glass-pill {
  border: 1px solid var(--footer-pill-border);
  background: linear-gradient(145deg, var(--footer-pill-bg-1), var(--footer-pill-bg-2));
  box-shadow:
    0 10px 30px -10px var(--footer-pill-shadow),
    inset 0 1px 1px var(--footer-pill-highlight),
    inset 0 -1px 2px color-mix(in oklch, var(--background) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.footer-glass-pill:active {
  transform: scale(0.97);
}

@media (hover: hover) and (pointer: fine) {
  .footer-glass-pill:hover {
    border-color: var(--footer-pill-border-hover);
    color: var(--foreground);
  }
}

.footer-giant-bg-text {
  font-size: clamp(5rem, 22vw, 18rem);
  line-height: 0.78;
  font-weight: 900;
  letter-spacing: 0;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 7%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 13%, transparent), transparent 64%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground), color-mix(in oklch, var(--foreground) 46%, transparent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 20px color-mix(in oklch, var(--foreground) 12%, transparent));
}

.footer-marquee-track {
  animation: footer-scroll-marquee 34s linear infinite;
}

.footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .footer-aurora,
  .footer-marquee-track,
  .footer-heartbeat {
    animation: none;
  }

  .footer-glass-pill {
    transition-duration: 0ms;
  }
}
`;

type MagneticButtonProps = React.HTMLAttributes<HTMLElement> & {
	as?: React.ElementType;
	href?: string;
	rel?: string;
	target?: string;
	type?: "button" | "submit" | "reset";
};

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
	(
		{ as: Component = "button", className, children, ...props },
		forwardedRef,
	) => {
		const localRef = React.useRef<HTMLElement | null>(null);

		React.useEffect(() => {
			const element = localRef.current;
			if (!element || typeof window === "undefined") {
				return;
			}

			const reduceMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (reduceMotion) {
				return;
			}

			const handleMouseMove = (event: MouseEvent) => {
				const rect = element.getBoundingClientRect();
				const x = event.clientX - rect.left - rect.width / 2;
				const y = event.clientY - rect.top - rect.height / 2;

				gsap.to(element, {
					x: x * 0.28,
					y: y * 0.28,
					rotationX: -y * 0.08,
					rotationY: x * 0.08,
					scale: 1.03,
					ease: "power2.out",
					duration: 0.25,
				});
			};

			const handleMouseLeave = () => {
				gsap.to(element, {
					x: 0,
					y: 0,
					rotationX: 0,
					rotationY: 0,
					scale: 1,
					ease: "power3.out",
					duration: 0.35,
				});
			};

			element.addEventListener("mousemove", handleMouseMove);
			element.addEventListener("mouseleave", handleMouseLeave);

			return () => {
				element.removeEventListener("mousemove", handleMouseMove);
				element.removeEventListener("mouseleave", handleMouseLeave);
			};
		}, []);

		return (
			<Component
				ref={(node: HTMLElement | null) => {
					localRef.current = node;
					if (typeof forwardedRef === "function") {
						forwardedRef(node);
					} else if (forwardedRef) {
						forwardedRef.current = node;
					}
				}}
				className={cn("transform-gpu cursor-pointer", className)}
				{...props}
			>
				{children}
			</Component>
		);
	},
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
	<div className="flex items-center gap-8 px-5">
		<span>Upload BCA</span>
		<span className="text-primary/50">/</span>
		<span>Rapikan Transaksi</span>
		<span className="text-primary/50">/</span>
		<span>Deteksi Boros</span>
		<span className="text-primary/50">/</span>
		<span>Cashflow Bulanan</span>
		<span className="text-primary/50">/</span>
	</div>
);

const footerBadges: Array<{ icon: LucideIcon; label: string }> = [
	{ icon: UploadCloud, label: "BCA first" },
	{ icon: Sparkles, label: "Insight AI" },
	{ icon: ShieldCheck, label: "Login aman" },
	{ icon: Banknote, label: "Cashflow bulanan" },
];

export function CinematicFooter({ className }: { className?: string }) {
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const giantTextRef = React.useRef<HTMLDivElement>(null);
	const headingRef = React.useRef<HTMLHeadingElement>(null);
	const linksRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (typeof window === "undefined" || !wrapperRef.current) {
			return;
		}

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduceMotion) {
			return;
		}

		const ctx = gsap.context(() => {
			gsap.fromTo(
				giantTextRef.current,
				{ y: "8vh", scale: 0.94, opacity: 0 },
				{
					y: "0vh",
					scale: 1,
					opacity: 1,
					ease: "power2.out",
					scrollTrigger: {
						trigger: wrapperRef.current,
						start: "top 82%",
						end: "bottom bottom",
						scrub: 1,
					},
				},
			);

			gsap.fromTo(
				[headingRef.current, linksRef.current],
				{ y: 32, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					stagger: 0.12,
					ease: "power3.out",
					scrollTrigger: {
						trigger: wrapperRef.current,
						start: "top 55%",
						end: "bottom bottom",
						scrub: 1,
					},
				},
			);
		}, wrapperRef);

		return () => ctx.revert();
	}, []);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: footerStyles }} />
			<div
				className={cn("relative h-[92svh] w-full", className)}
				ref={wrapperRef}
				style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
			>
				<footer className="cinematic-footer-wrapper fixed bottom-0 left-0 flex h-[92svh] w-full flex-col justify-between overflow-hidden bg-background text-foreground">
					<div className="footer-aurora pointer-events-none absolute top-1/2 left-1/2 h-[58vh] w-[82vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]" />
					<div className="footer-bg-grid pointer-events-none absolute inset-0" />

					<div
						className="footer-giant-bg-text pointer-events-none absolute -bottom-[3vh] left-1/2 select-none whitespace-nowrap"
						ref={giantTextRef}
						style={{ transform: "translateX(-50%)" }}
					>
						KASFLOW
					</div>

					<div className="absolute top-10 left-0 w-full -rotate-2 scale-110 overflow-hidden border-border/60 border-y bg-background/70 py-4 shadow-2xl backdrop-blur-md">
						<div className="footer-marquee-track flex w-max font-bold text-muted-foreground text-xs uppercase md:text-sm">
							<MarqueeItem />
							<MarqueeItem />
							<MarqueeItem />
							<MarqueeItem />
						</div>
					</div>

					<div className="relative z-10 mx-auto mt-16 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
						<div className="mb-7 flex flex-wrap justify-center gap-2">
							{footerBadges.map(({ icon: Icon, label }) => (
								<span
									className="footer-glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-muted-foreground text-xs"
									key={label}
								>
									<Icon className="size-3.5" />
									{label}
								</span>
							))}
						</div>

						<h2
							className="footer-text-glow max-w-4xl font-black text-5xl leading-none tracking-normal md:text-8xl"
							ref={headingRef}
						>
							Mulai baca arus uangmu.
						</h2>

						<div
							className="mt-10 flex w-full flex-col items-center gap-5"
							ref={linksRef}
						>
							<div className="flex w-full flex-wrap justify-center gap-3">
								<MagneticButton
									as="a"
									className="footer-glass-pill inline-flex rounded-full px-8 py-4 font-bold text-foreground text-sm md:px-10"
									href="/login?next=%2Fimports%2Fnew"
								>
									Upload laporan BCA
								</MagneticButton>
								<MagneticButton
									as="a"
									className="footer-glass-pill inline-flex rounded-full px-8 py-4 font-bold text-muted-foreground text-sm md:px-10"
									href="/#cara-kerja"
								>
									Lihat cara kerja
								</MagneticButton>
							</div>

							<div className="flex flex-wrap justify-center gap-3">
								{[
									["Keamanan data", "/#keamanan"],
									["Contoh insight", "/#contoh-insight"],
									["Dashboard", "/login?next=%2Fdashboard"],
								].map(([label, href]) => (
									<MagneticButton
										as="a"
										className="footer-glass-pill rounded-full px-5 py-3 font-semibold text-muted-foreground text-xs"
										href={href}
										key={label}
									>
										{label}
									</MagneticButton>
								))}
							</div>
						</div>
					</div>

					<div className="relative z-20 flex w-full flex-col items-center justify-between gap-5 px-5 pb-7 md:flex-row md:px-10">
						<div className="order-2 font-semibold text-[10px] text-muted-foreground uppercase md:order-1">
							(c) 2026 KasFlow. MVP analisis laporan BCA.
						</div>

						<div className="footer-glass-pill order-1 flex cursor-default items-center gap-2 rounded-full px-5 py-3 md:order-2">
							<span className="font-bold text-[10px] text-muted-foreground uppercase">
								Dibuat untuk
							</span>
							<Heart className="footer-heartbeat size-4 text-destructive" />
							<span className="font-bold text-[10px] text-muted-foreground uppercase">
								uang yang lebih jelas
							</span>
						</div>

						<MagneticButton
							aria-label="Kembali ke atas"
							className="footer-glass-pill order-3 flex size-12 items-center justify-center rounded-full text-muted-foreground"
							onClick={scrollToTop}
							type="button"
						>
							<ArrowUp className="size-5" />
						</MagneticButton>
					</div>
				</footer>
			</div>
		</>
	);
}
