import { Button } from "@KasFlow/ui/components/button";
import { cn } from "@KasFlow/ui/lib/utils";
import { CheckCircle, Download, Loader2 } from "lucide-react";

export type DownloadStatus = "idle" | "downloading" | "downloaded" | "complete";

export default function DownloadButton({
	downloadStatus,
	progress,
	onClick,
	className,
	label = "Download",
}: {
	downloadStatus: DownloadStatus;
	progress: number;
	onClick: () => void;
	className?: string;
	label?: string;
}) {
	return (
		<Button
			onClick={onClick}
			className={cn(
				"relative w-40 select-none overflow-hidden rounded-xl",
				downloadStatus === "downloading" && "bg-primary/60 hover:bg-primary/60",
				downloadStatus !== "idle" && "pointer-events-none",
				className,
			)}
		>
			<span className="relative z-10 flex items-center gap-2">
				{downloadStatus === "idle" && (
					<>
						<Download className="size-4" />
						{label}
					</>
				)}
				{downloadStatus === "downloading" && (
					<>
						<Loader2 className="size-4 animate-spin" />
						{progress}%
					</>
				)}
				{downloadStatus === "downloaded" && (
					<>
						<CheckCircle className="size-4" />
						Selesai
					</>
				)}
				{downloadStatus === "complete" && label}
			</span>
			{downloadStatus === "downloading" && (
				<span
					className="absolute inset-y-0 left-0 z-0 bg-primary transition-all duration-200"
					style={{ width: `${progress}%` }}
				/>
			)}
		</Button>
	);
}
