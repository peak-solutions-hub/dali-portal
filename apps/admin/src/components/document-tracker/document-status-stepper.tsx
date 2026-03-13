import type { PurposeType, StatusType } from "@repo/shared";
import { Check } from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { formatDocumentStatus } from "@/utils/document-helpers";

interface DocumentStatusStepperProps {
	purpose: PurposeType;
	status: StatusType;
}

const FLOW_STEPS: Record<PurposeType, StatusType[]> = {
	for_agenda: [
		"received",
		"for_initial",
		"for_signature",
		"approved",
		"calendared",
		"published",
	],
	for_action: [
		"received",
		"for_initial",
		"for_signature",
		"approved",
		"released",
	],
	for_filing: ["received", "released"],
	for_caller_slip: ["received", "for_initial", "for_signature", "released"],
};

export function DocumentStatusStepper({
	purpose,
	status,
}: DocumentStatusStepperProps) {
	const steps = FLOW_STEPS[purpose] ?? FLOW_STEPS.for_action;
	const currentStepIndex = steps.indexOf(status);

	return (
		<div className="rounded-lg border p-4">
			<p className="mb-3 text-sm font-medium text-muted-foreground">
				Workflow Status
			</p>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
				{steps.map((step, index) => {
					const isCompleted = currentStepIndex > index;
					const isCurrent = currentStepIndex === index;

					return (
						<div key={step} className="flex items-center gap-2">
							<div
								className={cn(
									"flex size-6 items-center justify-center rounded-full border text-xs",
									isCompleted && "border-green-600 bg-green-600 text-white",
									isCurrent &&
										"border-primary bg-primary text-primary-foreground",
									!isCompleted &&
										!isCurrent &&
										"border-muted-foreground/40 text-muted-foreground",
								)}
							>
								{isCompleted ? <Check className="size-3.5" /> : index + 1}
							</div>
							<span
								className={cn(
									"text-xs",
									isCurrent
										? "font-medium text-foreground"
										: "text-muted-foreground",
								)}
							>
								{formatDocumentStatus(step)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
