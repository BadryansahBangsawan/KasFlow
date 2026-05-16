import { cn } from "@KasFlow/ui/lib/utils";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";

type IconComponentType = React.ElementType<{ className?: string }>;

export type InteractiveMenuItem = {
	label: string;
	icon: IconComponentType;
	active?: boolean;
	onClick?: () => void;
};

export function InteractiveMenu({
	items,
	className,
	accentColor = "var(--component-active-color-default)",
}: {
	items: InteractiveMenuItem[];
	className?: string;
	accentColor?: string;
}) {
	const finalItems = useMemo(() => items.slice(0, 5), [items]);
	const activeIndex = Math.max(
		0,
		finalItems.findIndex((item) => item.active),
	);
	const textRefs = useRef<(HTMLElement | null)[]>([]);
	const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		const setLineWidth = () => {
			const activeItemElement = itemRefs.current[activeIndex];
			const activeTextElement = textRefs.current[activeIndex];

			if (activeItemElement && activeTextElement) {
				activeItemElement.style.setProperty(
					"--lineWidth",
					`${activeTextElement.offsetWidth}px`,
				);
			}
		};

		setLineWidth();
		window.addEventListener("resize", setLineWidth);

		return () => window.removeEventListener("resize", setLineWidth);
	}, [activeIndex, finalItems]);

	if (finalItems.length < 2) {
		return null;
	}

	return (
		<nav
			className={cn("interactive-menu md:hidden", className)}
			role="navigation"
			style={{ "--component-active-color": accentColor } as React.CSSProperties}
		>
			{finalItems.map((item, index) => {
				const Icon = item.icon;
				const isActive = index === activeIndex;

				return (
					<button
						key={item.label}
						type="button"
						onClick={item.onClick}
						ref={(element) => {
							itemRefs.current[index] = element;
						}}
						style={{ "--lineWidth": "0px" } as React.CSSProperties}
						className={cn("interactive-menu__item", isActive && "is-active")}
					>
						<span className="interactive-menu__icon">
							<Icon className="interactive-menu__icon-svg" />
						</span>
						<strong
							className={cn("interactive-menu__text", isActive && "is-active")}
							ref={(element) => {
								textRefs.current[index] = element;
							}}
						>
							{item.label}
						</strong>
					</button>
				);
			})}
		</nav>
	);
}
