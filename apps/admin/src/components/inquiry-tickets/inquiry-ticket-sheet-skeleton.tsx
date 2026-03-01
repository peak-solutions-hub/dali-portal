import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";

export function InquiryTicketSheetSkeleton() {
	return (
		<div className="flex h-full flex-col">
			{/* Header Skeleton - matches InquiryTicketHeader */}
			<div className="border-b bg-muted/30 p-4 pl-6 space-y-4">
				<div className="flex items-start gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 py-2">
							<Skeleton className="h-7 w-64" /> {/* Title */}
							<Skeleton className="h-5 w-20 rounded-full" />{" "}
							{/* Status Badge */}
						</div>
						<Skeleton className="mt-1 h-3 w-36" /> {/* Reference Number */}
					</div>
				</div>

				<Separator />

				{/* Collapsed Citizen Info Header */}
				<div className="p-2 -mx-2 space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-40" /> {/* "Citizen Information..." */}
						<Skeleton className="h-4 w-4 rounded-full" />{" "}
						{/* ChevronDown icon */}
					</div>
				</div>
			</div>

			{/* Content Skeleton - matches ChatMessageList */}
			<div className="flex-1 min-h-0 overflow-hidden p-6">
				<div className="space-y-4">
					{/* Initial message skeleton (citizen) */}
					<div className="max-w-[80%] rounded-lg p-3 bg-muted/30 border border-muted">
						<div className="mb-2 flex items-center gap-2">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4 mt-1" />
					</div>

					{/* Staff reply skeleton */}
					<div className="max-w-[80%] ml-auto rounded-lg p-3 bg-primary/5 border border-primary/20">
						<div className="mb-2 flex items-center gap-2">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-24" />
						</div>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3 mt-1" />
					</div>
				</div>
			</div>

			{/* Footer Skeleton - matches message composer + actions */}
			<div className="border-t bg-background p-6 shrink-0">
				<div className="space-y-3">
					{/* Message composer */}
					<Skeleton className="h-24 w-full rounded-md" />
					<div className="flex justify-between items-center">
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-24 rounded-md" />
					</div>
				</div>

				{/* Action buttons skeleton */}
				<div className="space-y-3 mt-6">
					<Skeleton className="h-4 w-16" /> {/* "Actions" label */}
					<div className="grid grid-cols-3 gap-2">
						<Skeleton className="h-9 w-full rounded-md" />
						<Skeleton className="h-9 w-full rounded-md" />
						<Skeleton className="h-9 w-full rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
}

export function InquiryTicketSheetError({ message }: { message: string }) {
	return (
		<div className="flex items-center justify-center h-full p-6">
			<div className="text-center space-y-2">
				<div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
					<span className="text-destructive text-xl">!</span>
				</div>
				<p className="text-sm font-medium text-foreground">
					Failed to load ticket
				</p>
				<p className="text-xs text-muted-foreground">{message}</p>
			</div>
		</div>
	);
}
