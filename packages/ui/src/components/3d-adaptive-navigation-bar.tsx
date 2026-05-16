"use client";

import { cn } from "@KasFlow/ui/lib/utils";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	useSpring,
} from "framer-motion";
import * as React from "react";

export type AdaptiveNavItem = {
	id: string;
	label: string;
	active?: boolean;
	onSelect?: () => void;
};

export type AdaptiveNavigationPillProps = {
	items: AdaptiveNavItem[];
	activeId?: string;
	className?: string;
	collapsedWidth?: number;
	expandedWidth?: number;
};

const surfaceShadow = {
	collapsed:
		"0 3px 6px rgba(15, 23, 42, 0.12), 0 12px 28px rgba(15, 23, 42, 0.10), inset 0 2px 1px rgba(255, 255, 255, 0.78), inset 0 -2px 8px rgba(15, 23, 42, 0.10)",
	expanded:
		"0 4px 8px rgba(15, 23, 42, 0.10), 0 18px 44px rgba(15, 23, 42, 0.12), inset 0 2px 2px rgba(255, 255, 255, 0.9), inset 0 -3px 10px rgba(15, 23, 42, 0.12)",
};

export function AdaptiveNavigationPill({
	items,
	activeId,
	className,
	collapsedWidth = 144,
	expandedWidth = 548,
}: AdaptiveNavigationPillProps) {
	const reduceMotion = useReducedMotion();
	const firstId = items[0]?.id ?? "home";
	const controlledActiveId = activeId ?? items.find((item) => item.active)?.id;
	const [internalActiveId, setInternalActiveId] = React.useState(
		controlledActiveId ?? firstId,
	);
	const [expanded, setExpanded] = React.useState(false);
	const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const pillWidth = useSpring(collapsedWidth, {
		stiffness: reduceMotion ? 1000 : 260,
		damping: reduceMotion ? 100 : 30,
		mass: 0.9,
	});

	React.useEffect(() => {
		if (controlledActiveId) {
			setInternalActiveId(controlledActiveId);
		}
	}, [controlledActiveId]);

	React.useEffect(() => {
		pillWidth.set(expanded ? expandedWidth : collapsedWidth);
	}, [collapsedWidth, expanded, expandedWidth, pillWidth]);

	React.useEffect(() => {
		return () => {
			if (closeTimerRef.current) {
				clearTimeout(closeTimerRef.current);
			}
		};
	}, []);

	const active = controlledActiveId ?? internalActiveId;
	const activeItem = items.find((item) => item.id === active) ?? items[0];

	const open = () => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
		}
		setExpanded(true);
	};

	const close = () => {
		closeTimerRef.current = setTimeout(() => {
			setExpanded(false);
		}, 260);
	};

	const handleSelect = (item: AdaptiveNavItem) => {
		setInternalActiveId(item.id);
		item.onSelect?.();
		setExpanded(false);
	};

	if (items.length === 0) {
		return null;
	}

	return (
		<motion.nav
			aria-label="Navigasi utama"
			className={cn("relative h-14 overflow-hidden rounded-full", className)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					close();
				}
			}}
			onFocus={open}
			onMouseEnter={open}
			onMouseLeave={close}
			style={{
				width: pillWidth,
				background:
					"linear-gradient(135deg, #ffffff 0%, #fafafa 18%, #f4f4f5 38%, #eceef0 64%, #f7f7f8 100%)",
				boxShadow: expanded ? surfaceShadow.expanded : surfaceShadow.collapsed,
				transition: "box-shadow 220ms cubic-bezier(0.23, 1, 0.32, 1)",
			}}
		>
			<div className="pointer-events-none absolute inset-x-3 top-0 h-px rounded-full bg-white/95" />
			<div className="pointer-events-none absolute inset-x-8 top-2 h-3 rounded-full bg-white/55 blur-sm" />
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-gradient-to-t from-slate-950/12 to-transparent" />
			<div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-slate-950/10" />

			<div className="relative z-10 flex h-full items-center justify-center px-5">
				<AnimatePresence mode="wait">
					{!expanded && activeItem ? (
						<motion.span
							key={activeItem.id}
							animate={{
								opacity: 1,
								transform: "translateY(0px)",
								filter: "blur(0px)",
							}}
							className="max-w-[120px] truncate font-semibold text-[15px] text-slate-950"
							exit={{
								opacity: 0,
								transform: "translateY(-8px)",
								filter: "blur(3px)",
							}}
							initial={{
								opacity: 0,
								transform: "translateY(8px)",
								filter: "blur(3px)",
							}}
							transition={{
								duration: reduceMotion ? 0 : 0.2,
								ease: [0.23, 1, 0.32, 1],
							}}
						>
							{activeItem.label}
						</motion.span>
					) : null}
				</AnimatePresence>

				{expanded ? (
					<motion.div
						animate={{ opacity: 1 }}
						className="flex w-full items-center justify-evenly gap-1"
						initial={{ opacity: 0 }}
						transition={{
							duration: reduceMotion ? 0 : 0.16,
							ease: [0.23, 1, 0.32, 1],
						}}
					>
						{items.map((item, index) => {
							const isActive = item.id === active;

							return (
								<motion.button
									key={item.id}
									animate={{
										opacity: 1,
										transform: isActive ? "translateY(-1px)" : "translateY(0)",
									}}
									className={cn(
										"rounded-full px-4 py-2 font-medium text-[15px] text-slate-500 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97]",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/20",
										isActive &&
											"bg-white/70 font-semibold text-slate-950 shadow-sm",
									)}
									initial={{ opacity: 0, transform: "translateX(-8px)" }}
									onClick={() => handleSelect(item)}
									transition={{
										delay: reduceMotion ? 0 : index * 0.035,
										duration: reduceMotion ? 0 : 0.18,
										ease: [0.23, 1, 0.32, 1],
									}}
									type="button"
								>
									{item.label}
								</motion.button>
							);
						})}
					</motion.div>
				) : null}
			</div>
		</motion.nav>
	);
}
