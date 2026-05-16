import { cn } from "@KasFlow/ui/lib/utils";
import { CheckCircle2 } from "lucide-react";

export type ProgressStep = {
	label: string;
	description?: string;
};

export function ProgressIndicator({
	steps,
	currentStep,
	className,
}: {
	steps: ProgressStep[];
	currentStep: number;
	className?: string;
}) {
	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-start gap-3 overflow-x-auto pb-1">
				{steps.map((step, index) => {
					const stepNumber = index + 1;
					const isComplete = stepNumber < currentStep;
					const isActive = stepNumber === currentStep;

					return (
						<div
							key={step.label}
							className="flex min-w-32 flex-1 items-start gap-3"
						>
							<div
								className={cn(
									"relative flex size-8 shrink-0 items-center justify-center rounded-full border font-semibold text-xs transition-colors",
									isComplete && "border-emerald-600 bg-emerald-600 text-white",
									isActive && "border-slate-950 bg-slate-950 text-white",
									!isComplete &&
										!isActive &&
										"border-slate-200 bg-white text-muted-foreground",
								)}
							>
								{isComplete ? <CheckCircle2 className="size-4" /> : stepNumber}
							</div>
							<div className="min-w-0">
								<p
									className={cn(
										"font-medium text-sm",
										isActive && "text-slate-950",
									)}
								>
									{step.label}
								</p>
								{step.description && (
									<p className="mt-1 text-muted-foreground text-xs leading-5">
										{step.description}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
