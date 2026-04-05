"use client";

import {
	type ClassificationType,
	getNextStatuses,
	type PurposeType,
	type RoleType,
	type StatusType,
	TEXT_LIMITS,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import {
	Archive,
	ChevronDown,
	ChevronUp,
	Download,
	Expand,
	FileText,
	Loader2,
	Printer,
	Send,
	Upload,
} from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentStatusBadge } from "@/components/document-tracker/document-status-badge";
import { DocumentStatusStepper } from "@/components/document-tracker/document-status-stepper";
import { DocumentTypeIndicator } from "@/components/document-tracker/document-type-indicator";
import { EditDocumentDialog } from "@/components/document-tracker/edit-document-dialog";
import { PublishToArchiveDialog } from "@/components/document-tracker/publish-to-archive-dialog";
import { UploadNewVersionDialog } from "@/components/document-tracker/upload-new-version-dialog";
import { useDocumentDetail } from "@/hooks/document-tracker/use-document-detail";
import { api } from "@/lib/api.client";
import { useAuthStore } from "@/stores/auth-store";
import {
	formatDocumentClassification,
	formatDocumentPurpose,
	formatDocumentSource,
	formatDocumentStatus,
} from "@/utils/document-helpers";

const TRANSITION_ROLE_MAP: Record<string, RoleType[]> = {
	"received->for_initial": ["admin_staff", "head_admin", "vice_mayor"],
	"for_initial->for_signature": ["head_admin", "vice_mayor"],
	"for_signature->approved": ["vice_mayor"],
	"approved->released": ["admin_staff", "head_admin"],
	"approved->calendared": ["legislative_staff", "head_admin"],
	"calendared->published": ["legislative_staff", "head_admin"],
	"returned->received": ["admin_staff", "head_admin", "vice_mayor"],
};

function canRoleTransition(
	currentStatus: StatusType,
	nextStatus: StatusType,
	role: RoleType | null,
): boolean {
	if (!role) {
		return false;
	}

	if (nextStatus === "returned") {
		return role === "head_admin" || role === "vice_mayor";
	}

	const key = `${currentStatus}->${nextStatus}`;
	const allowedRoles = TRANSITION_ROLE_MAP[key];

	if (!allowedRoles) {
		return true;
	}

	return allowedRoles.includes(role);
}

function getTransitionLabel(nextStatus: StatusType): string {
	switch (nextStatus) {
		case "for_initial":
			return "Mark as For Initial";
		case "for_signature":
			return "Mark as For Signature";
		case "approved":
			return "Approve Document";
		case "released":
			return "Release Document";
		case "calendared":
			return "Mark as Calendared";
		case "published":
			return "Mark as Published";
		case "returned":
			return "Return / Revert";
		case "received":
			return "Revert to Received";
		default:
			return `Mark as ${formatDocumentStatus(nextStatus)}`;
	}
}

/**
 * Returns Tailwind classes for transition buttons based on design:
 * - blue = forward progression
 * - amber/gold = initial-related
 * - red = reject/return
 */
function getTransitionButtonClasses(nextStatus: StatusType): string {
	switch (nextStatus) {
		case "for_initial":
			return "bg-blue-600 hover:bg-blue-700 text-white";
		case "for_signature":
			return "bg-amber-500 hover:bg-amber-600 text-white";
		case "approved":
			return "bg-blue-600 hover:bg-blue-700 text-white";
		case "released":
		case "calendared":
		case "published":
			return "bg-blue-600 hover:bg-blue-700 text-white";
		case "returned":
			return "bg-red-600 hover:bg-red-700 text-white";
		default:
			return "bg-blue-600 hover:bg-blue-700 text-white";
	}
}

export default function DocumentDetailPage() {
	const params = useParams<{ id: string }>();
	const documentId = params.id ?? "";
	const userRole = useAuthStore(
		(state) => state.userProfile?.role.name ?? null,
	);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
		null,
	);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
	const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<StatusType | null>(null);
	const [transitionRemarks, setTransitionRemarks] = useState("");
	const [showMoreDetails, setShowMoreDetails] = useState(false);

	const { data, isLoading, error, refetch } = useDocumentDetail(documentId);

	useEffect(() => {
		const latestVersion = data?.versions?.[0];

		if (latestVersion) {
			setSelectedVersionId((currentValue) => currentValue ?? latestVersion.id);
		}
	}, [data]);

	const selectedVersion = useMemo(() => {
		if (!data?.versions.length) {
			return null;
		}

		return (
			data.versions.find((version) => version.id === selectedVersionId) ??
			data.versions[0]
		);
	}, [data, selectedVersionId]);

	const nextStatuses = useMemo(() => {
		if (!data) {
			return [];
		}

		return getNextStatuses(
			data.purpose as PurposeType,
			data.status as StatusType,
		)
			.filter((nextStatus) => nextStatus !== "published")
			.filter((nextStatus) =>
				canRoleTransition(data.status as StatusType, nextStatus, userRole),
			);
	}, [data, userRole]);

	const canPublishToArchive = useMemo(() => {
		if (!data || !userRole) {
			return false;
		}

		const isCalendaredLegislative =
			data.purpose === "for_agenda" && data.status === "calendared";

		const isPublishableType =
			data.type === "proposed_ordinance" || data.type === "proposed_resolution";

		const hasRole =
			userRole === "head_admin" || userRole === "legislative_staff";

		return isCalendaredLegislative && isPublishableType && hasRole;
	}, [data, userRole]);

	const isDestructiveTransition = pendingStatus === "returned";

	const handleOpenStatusTransition = (nextStatus: StatusType) => {
		setPendingStatus(nextStatus);
		setTransitionRemarks("");
		setIsStatusDialogOpen(true);
	};

	const handleStatusTransition = async () => {
		if (!data || !pendingStatus) {
			return;
		}

		setIsUpdatingStatus(true);

		try {
			const [updateError] = await api.documents.updateStatus({
				id: data.id,
				status: pendingStatus,
				remarks: transitionRemarks.trim() || undefined,
			});

			if (updateError) {
				throw updateError;
			}

			toast.success(`Status updated to ${formatDocumentStatus(pendingStatus)}`);
			setIsStatusDialogOpen(false);
			setPendingStatus(null);
			await refetch();
		} catch (transitionError) {
			const message =
				typeof transitionError === "object" &&
				transitionError !== null &&
				"message" in transitionError
					? String(transitionError.message)
					: "Failed to update status";

			toast.error(message);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				<span>Loading document...</span>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-destructive">Document not found.</p>
				<Button asChild variant="outline">
					<Link href="/document-tracker">Back to Document Tracker</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-sm text-muted-foreground">
					<Link href="/document-tracker" className="hover:underline">
						Document Tracker
					</Link>{" "}
					/ {data.title}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-2xl font-semibold">{data.title}</h1>
					<DocumentTypeIndicator type={data.type} />
					<DocumentStatusBadge status={data.status} />
					<div className="ml-auto flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.print()}
							title="Print"
						>
							<Printer className="mr-1 h-3.5 w-3.5" />
							Print
						</Button>
						{canPublishToArchive && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsPublishDialogOpen(true)}
								title="Archive"
							>
								<Archive className="mr-1 h-3.5 w-3.5" />
								Archive
							</Button>
						)}
						{data.status === "approved" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									handleOpenStatusTransition("released" as StatusType)
								}
								title="Release"
							>
								<Send className="mr-1 h-3.5 w-3.5" />
								Release
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditDialogOpen(true)}
						>
							Edit Document
						</Button>
					</div>
				</div>
			</div>

			<DocumentStatusStepper
				purpose={data.purpose as PurposeType}
				status={data.status as StatusType}
			/>

			<div className="grid gap-4 xl:grid-cols-5">
				<Card className="space-y-4 p-4 xl:col-span-3">
					<div className="flex items-center gap-2 text-sm">
						<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
						<span className="truncate font-medium">{data.codeNumber}</span>

						{data.versions.length > 0 && selectedVersion ? (
							<>
								<span className="text-muted-foreground">·</span>
								<Select
									value={selectedVersion.id}
									onValueChange={setSelectedVersionId}
								>
									<SelectTrigger size="sm" className="h-7 w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{data.versions.map((version, index) => (
											<SelectItem key={version.id} value={version.id}>
												v{version.versionNumber}
												{index === 0 ? " (current)" : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						) : (
							<span className="text-muted-foreground">· No version</span>
						)}

						<div className="ml-auto flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1 px-2 text-xs"
								onClick={() => setIsVersionDialogOpen(true)}
							>
								<Upload className="h-3.5 w-3.5" />
								Upload
							</Button>

							{selectedVersion && (
								<>
									<Button
										asChild
										variant="ghost"
										size="sm"
										className="h-7 gap-1 px-2 text-xs"
									>
										<a
											href={selectedVersion.signedUrl}
											target="_blank"
											rel="noreferrer"
										>
											<Download className="h-3.5 w-3.5" />
											Download
										</a>
									</Button>

									<Button
										variant="ghost"
										size="sm"
										className="h-7 gap-1 px-2 text-xs"
										onClick={() =>
											window.open(
												selectedVersion.signedUrl,
												"_blank",
												"noopener,noreferrer",
											)
										}
									>
										<Expand className="h-3.5 w-3.5" />
										Fullscreen
									</Button>
								</>
							)}
						</div>
					</div>

					{selectedVersion ? (
						<iframe
							title={`Document ${data.codeNumber}`}
							src={selectedVersion.signedUrl}
							className="h-175 w-full rounded-md border"
						/>
					) : (
						<div className="flex h-100 items-center justify-center rounded-md border text-sm text-muted-foreground">
							No version file is available.
						</div>
					)}
				</Card>

				<div className="space-y-4 xl:col-span-2">
					<Card className="space-y-3 p-4">
						<h2 className="text-sm font-semibold">Metadata</h2>
						<dl className="space-y-2 text-sm">
							<div className="grid grid-cols-2 gap-2">
								<dt className="text-muted-foreground">Source</dt>
								<dd>{formatDocumentSource(data.source)}</dd>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<dt className="text-muted-foreground">Date Received</dt>
								<dd>
									{new Date(data.receivedAt).toLocaleString("en-PH", {
										year: "numeric",
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</dd>
							</div>

							{showMoreDetails && (
								<>
									<div className="grid grid-cols-2 gap-2">
										<dt className="text-muted-foreground">Tracking No.</dt>
										<dd className="font-medium">{data.codeNumber}</dd>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<dt className="text-muted-foreground">Purpose</dt>
										<dd>{formatDocumentPurpose(data.purpose)}</dd>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<dt className="text-muted-foreground">Classification</dt>
										<dd>
											{data.classification
												? formatDocumentClassification(data.classification)
												: "—"}
										</dd>
									</div>
									<div className="space-y-1">
										<dt className="text-muted-foreground">Remarks</dt>
										<dd>{data.remarks ?? "—"}</dd>
									</div>
								</>
							)}
						</dl>

						<button
							type="button"
							onClick={() => setShowMoreDetails((prev) => !prev)}
							className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							{showMoreDetails ? (
								<>
									Show Less <ChevronUp className="h-3 w-3" />
								</>
							) : (
								<>
									Show More Details <ChevronDown className="h-3 w-3" />
								</>
							)}
						</button>
					</Card>

					<Card className="space-y-3 border-red-200 bg-red-50/30 p-4">
						<h2 className="text-sm font-semibold">Required Action</h2>
						{nextStatuses.length === 0 && !canPublishToArchive ? (
							<p className="text-sm text-muted-foreground">
								No available actions for your current role.
							</p>
						) : (
							<div className="flex flex-wrap items-center gap-2">
								{canPublishToArchive ? (
									<Button
										size="sm"
										onClick={() => setIsPublishDialogOpen(true)}
									>
										Publish to Archive
									</Button>
								) : null}

								{nextStatuses
									.filter((s) => s !== "returned" && s !== "received")
									.map((nextStatus) => (
										<Button
											key={nextStatus}
											size="sm"
											className={getTransitionButtonClasses(nextStatus)}
											disabled={isUpdatingStatus}
											onClick={() => handleOpenStatusTransition(nextStatus)}
										>
											{getTransitionLabel(nextStatus)}
										</Button>
									))}

								{nextStatuses.some(
									(s) => s === "returned" || s === "received",
								) && (
									<>
										<div className="mx-1 h-6 w-px bg-border" />
										{nextStatuses
											.filter((s) => s === "returned" || s === "received")
											.map((nextStatus) => (
												<Button
													key={nextStatus}
													size="sm"
													variant="outline"
													className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
													disabled={isUpdatingStatus}
													onClick={() => handleOpenStatusTransition(nextStatus)}
												>
													{getTransitionLabel(nextStatus)}
												</Button>
											))}
									</>
								)}
							</div>
						)}
					</Card>

					<Card className="space-y-3 p-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-semibold">Audit Trail</h2>
							<Badge variant="outline">{data.auditTrail.length}</Badge>
						</div>

						{data.auditTrail.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No audit entries yet.
							</p>
						) : (
							<ScrollArea className="h-70 pr-3">
								<ol className="relative ml-3 border-l border-border">
									{data.auditTrail.map((entry, index) => (
										<li key={entry.id} className="relative mb-4 ml-4 last:mb-0">
											<span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground" />
											<p className="text-sm font-medium leading-tight">
												{entry.action}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{entry.actorName} ·{" "}
												{new Date(entry.createdAt).toLocaleString("en-PH", {
													year: "numeric",
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
											{entry.remarks && (
												<p className="mt-1 text-xs italic text-muted-foreground">
													&ldquo;{entry.remarks}&rdquo;
												</p>
											)}
										</li>
									))}
								</ol>
							</ScrollArea>
						)}
					</Card>
				</div>
			</div>

			<UploadNewVersionDialog
				documentId={documentId}
				open={isVersionDialogOpen}
				onOpenChange={setIsVersionDialogOpen}
				onUploaded={async () => {
					setSelectedVersionId(null);
					await refetch();
				}}
			/>

			<PublishToArchiveDialog
				documentId={documentId}
				open={isPublishDialogOpen}
				onOpenChange={setIsPublishDialogOpen}
				defaultCategory={data.classification as ClassificationType | null}
				onPublished={async () => {
					await refetch();
				}}
			/>

			<EditDocumentDialog
				document={{
					id: data.id,
					title: data.title,
					remarks: data.remarks,
					source: data.source,
					type: data.type,
					purpose: data.purpose,
					classification: data.classification,
					status: data.status,
				}}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				onUpdated={async () => {
					await refetch();
				}}
			/>

			<Dialog
				open={isStatusDialogOpen}
				onOpenChange={(open) => {
					setIsStatusDialogOpen(open);

					if (!open) {
						setPendingStatus(null);
						setTransitionRemarks("");
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Confirm Status Change</DialogTitle>
						<DialogDescription>
							{pendingStatus
								? `Are you sure you want to mark this document as ${formatDocumentStatus(pendingStatus)}?`
								: "Select a status transition."}
						</DialogDescription>
						{isDestructiveTransition ? (
							<p className="text-xs text-destructive">
								This will return the document for revisions.
							</p>
						) : null}
					</DialogHeader>

					<div className="space-y-2">
						<label htmlFor="transition-remarks" className="text-sm font-medium">
							Remarks{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</label>
						<Textarea
							id="transition-remarks"
							placeholder="Add an optional note for this status change..."
							value={transitionRemarks}
							onChange={(event) => setTransitionRemarks(event.target.value)}
							maxLength={TEXT_LIMITS.MD}
							rows={3}
						/>
						<p className="text-xs text-muted-foreground text-right">
							{transitionRemarks.length}/{TEXT_LIMITS.MD}
						</p>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsStatusDialogOpen(false);
								setPendingStatus(null);
								setTransitionRemarks("");
							}}
							disabled={isUpdatingStatus}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant={isDestructiveTransition ? "destructive" : "default"}
							onClick={handleStatusTransition}
							disabled={isUpdatingStatus || !pendingStatus}
						>
							{isUpdatingStatus ? "Updating..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
