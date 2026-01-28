import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Calendar, Mail, MessageSquare, Tag, User } from "lucide-react";

export function InquiryTicketSheetSkeleton() {
	return (
		<div className="flex h-full flex-col">
			{/* Header Skeleton */}
			<div className="border-b bg-muted/30 p-4">
				<div className="flex items-start gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 py-2">
							<Skeleton className="h-7 w-48" />
							<Skeleton className="h-5 w-20 rounded-full" />
						</div>
						<Skeleton className="mt-1 h-3 w-32" />
					</div>
				</div>
			</div>

			{/* Content Skeleton */}
			<div className="flex-1 overflow-auto">
				<div className="space-y-6 p-6">
					{/* Citizen Information Skeleton */}
					<div className="space-y-3">
						<Skeleton className="h-5 w-36" />
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<User className="h-3 w-3" />
									Name
								</div>
								<Skeleton className="h-4 w-28" />
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Mail className="h-3 w-3" />
									Email
								</div>
								<Skeleton className="h-4 w-36" />
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Calendar className="h-3 w-3" />
									Date Submitted
								</div>
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Tag className="h-3 w-3" />
									Request Type
								</div>
								<Skeleton className="h-4 w-24" />
							</div>
						</div>
					</div>

					<Separator />

					{/* Conversation Skeleton */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-4 w-4" />
								<Skeleton className="h-5 w-40" />
							</div>
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>

						<div className="space-y-3">
							{/* Message skeleton 1 - citizen */}
							<div className="max-w-[80%] rounded-lg p-3 bg-muted/30 border border-muted">
								<div className="mb-2 flex items-center gap-2">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-3 w-24" />
								</div>
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4 mt-1" />
							</div>

							{/* Message skeleton 2 - staff */}
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
				</div>
			</div>

			{/* Footer Skeleton */}
			<div className="border-t bg-background p-6">
				<div className="space-y-3">
					<Skeleton className="h-30 w-full rounded-md" />
					<div className="flex justify-between items-center">
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-24 rounded-md" />
					</div>
				</div>

				<div className="space-y-3 mt-6">
					<Skeleton className="h-4 w-16" />
					<div className="grid grid-cols-3 gap-2">
						<Skeleton className="h-8 w-full rounded-md" />
						<Skeleton className="h-8 w-full rounded-md" />
						<Skeleton className="h-8 w-full rounded-md" />
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
