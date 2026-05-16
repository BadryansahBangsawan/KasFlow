import { cn } from "@KasFlow/ui/lib/utils";

export default function TetrisLoading({
	size = "md",
	showLoadingText = true,
	loadingText = "Loading...",
	className,
}: {
	size?: "sm" | "md" | "lg";
	showLoadingText?: boolean;
	loadingText?: string;
	className?: string;
}) {
	const blockSize = {
		sm: "size-2",
		md: "size-3",
		lg: "size-4",
	}[size];

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3",
				className,
			)}
		>
			<div className="grid grid-cols-4 gap-1">
				{Array.from({ length: 16 }).map((_, index) => (
					<span
						key={index}
						className={cn(
							blockSize,
							"animate-pulse rounded-[3px] bg-slate-950",
							index % 3 === 0 && "animation-delay-200",
							index % 4 === 0 && "opacity-40",
							index % 5 === 0 && "opacity-70",
						)}
					/>
				))}
			</div>
			{showLoadingText && (
				<p className="font-medium text-muted-foreground text-xs">
					{loadingText}
				</p>
			)}
		</div>
	);
}
