"use client";

import { isDefinedError } from "@orpc/client";
import {
	type ClassificationType,
	canRoleTransition,
	type DecisionType,
	type DocumentListItem,
	formatDateTimeInPHT,
	getNextStatuses,
	type PurposeType,
	ROLE_PERMISSIONS,
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
	Send,
	Trash2,
	Upload,
} from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AssignInvitationToCallerSlipDialog } from "@/components/caller-slips/assign-invitation-to-caller-slip-dialog";
import { GenerateCallerSlipDialog } from "@/components/caller-slips/generate-caller-slip-dialog";
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
			return "bg-blue-600 hover:bg-blue-700 text-white";
		case "returned":
			return "bg-red-600 hover:bg-red-700 text-white";
		default:
			return "bg-blue-600 hover:bg-blue-700 text-white";
	}
}

const INVITATION_DECISION_LABELS: Record<DecisionType, string> = {
	attend: "Attend",
	decline: "Decline",
	assign_representative: "Assign Representative",
};

const PUBLISHED_ARCHIVE_REMARK_PREFIX = "Published to archive as ";
const HTTP_URL_REGEX = /^https?:\/\/\S+$/i;

function formatInvitationDecision(
	decision: DecisionType | null,
	representativeName: string | null,
): string {
	if (!decision) {
		return "Pending Vice Mayor decision";
	}

	const label = INVITATION_DECISION_LABELS[decision] ?? decision;

	if (decision === "assign_representative" && representativeName) {
		return `${label} (${representativeName})`;
	}

	return label;
}

function getPublishedArchiveUrlFromRemark(remarks: string): string | null {
	if (!remarks.startsWith(PUBLISHED_ARCHIVE_REMARK_PREFIX)) {
		return null;
	}

	const url = remarks.slice(PUBLISHED_ARCHIVE_REMARK_PREFIX.length).trim();

	if (!HTTP_URL_REGEX.test(url)) {
		return null;
	}

	return url;
}

export default function DocumentDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
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
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isAssignSlipDialogOpen, setIsAssignSlipDialogOpen] = useState(false);
	const [isGenerateSlipOpen, setIsGenerateSlipOpen] = useState(false);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<StatusType | null>(null);
	const [transitionRemarks, setTransitionRemarks] = useState("");
	const [showMoreDetails, setShowMoreDetails] = useState(false);
	const statusMutationLockRef = useRef(false);

	const { data, isLoading, error, refetch } = useDocumentDetail(documentId);

	useEffect(() => {
		if (!isStatusDialogOpen) {
			setPendingStatus(null);
			setTransitionRemarks("");
		}
	}, [isStatusDialogOpen]);

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

		if (data.type === "invitation") {
			return [];
		}

		if (!userRole) {
			return [];
		}

		return getNextStatuses(
			data.purpose as PurposeType,
			data.status as StatusType,
		)
			.filter((nextStatus) => nextStatus !== "published")
			.filter((nextStatus) =>
				canRoleTransition(
					data.status as StatusType,
					nextStatus,
					userRole as RoleType,
				),
			);
	}, [data, userRole]);

	const canPublishToArchive = useMemo(() => {
		if (!data || !userRole) {
			return false;
		}

		const isPublishableType =
			data.type === "proposed_ordinance" || data.type === "proposed_resolution";

		const hasArchiveManagementRole =
			userRole === "head_admin" || userRole === "legislative_staff";

		const isCalendaredLegislative =
			data.purpose === "for_agenda" && data.status === "calendared";

		return (
			isCalendaredLegislative && isPublishableType && hasArchiveManagementRole
		);
	}, [data, userRole]);

	const canEditPublishedArchiveDetails = useMemo(() => {
		if (!data || !userRole) {
			return false;
		}

		const isPublishableType =
			data.type === "proposed_ordinance" || data.type === "proposed_resolution";

		const hasArchiveManagementRole =
			userRole === "head_admin" || userRole === "legislative_staff";

		const isPublishedLegislative =
			data.purpose === "for_agenda" && data.status === "published";

		return (
			isPublishedLegislative && isPublishableType && hasArchiveManagementRole
		);
	}, [data, userRole]);

	const canDeleteDocument = useMemo(() => {
		if (!data || !userRole) {
			return false;
		}

		const hasDeleteRole =
			userRole === "head_admin" ||
			userRole === "admin_staff" ||
			userRole === "legislative_staff";

		if (!hasDeleteRole) {
			return false;
		}

		if (data.status === "received" || data.status === "returned") {
			return true;
		}

		return userRole === "head_admin" && data.status === "for_initial";
	}, [data, userRole]);

	const canManageCallerSlips = useMemo(() => {
		if (!userRole) {
			return false;
		}

		return ROLE_PERMISSIONS.CALLER_SLIPS.includes(userRole as RoleType);
	}, [userRole]);

	const isInvitationDocument = data?.type === "invitation";
	const invitationContext = data?.invitation ?? null;
	const invitationCallerSlipId = invitationContext?.callerSlipId ?? null;
	const invitationDecision = formatInvitationDecision(
		(invitationContext?.vmDecision as DecisionType | null) ?? null,
		invitationContext?.representativeName ?? null,
	);
	const invitationDecisionRemarks =
		invitationContext?.vmDecisionRemarks?.trim() || null;
	const hasPublishedLegislativeHistory = useMemo(() => {
		if (!data) {
			return false;
		}

		if (data.status === "published") {
			return true;
		}

		return data.auditTrail.some((entry) =>
			Boolean(entry.remarks?.startsWith(PUBLISHED_ARCHIVE_REMARK_PREFIX)),
		);
	}, [data]);

	const selectedInvitationDocuments = useMemo<DocumentListItem[]>(() => {
		if (!data || data.type !== "invitation" || invitationCallerSlipId) {
			return [];
		}

		return [
			{
				id: data.id,
				codeNumber: data.codeNumber,
				title: data.title,
				type: data.type,
				purpose: data.purpose,
				source: data.source,
				status: data.status,
				classification: data.classification,
				remarks: data.remarks,
				receivedAt: data.receivedAt,
				callerSlipId: null,
			},
		];
	}, [data, invitationCallerSlipId]);

	const isDestructiveTransition = pendingStatus === "returned";

	const closeStatusDialog = () => {
		if (isUpdatingStatus) {
			return;
		}

		setIsStatusDialogOpen(false);
	};

	const handleOpenStatusTransition = (nextStatus: StatusType) => {
		if (isUpdatingStatus || statusMutationLockRef.current) {
			return;
		}

		setPendingStatus(nextStatus);
		setTransitionRemarks("");
		setIsStatusDialogOpen(true);
	};

	const handleStatusTransition = async () => {
		if (!data || !pendingStatus || statusMutationLockRef.current) {
			return;
		}

		statusMutationLockRef.current = true;
		setIsUpdatingStatus(true);
		const statusToApply = pendingStatus;

		try {
			const [updateError] = await api.documents.updateStatus({
				id: data.id,
				status: statusToApply,
				remarks: transitionRemarks.trim() || undefined,
			});

			if (updateError) {
				const message = isDefinedError(updateError)
					? updateError.message
					: "Failed to update status";

				toast.error(message);
				return;
			}

			toast.success(`Status updated to ${formatDocumentStatus(statusToApply)}`);
			setIsStatusDialogOpen(false);
			void refetch();
		} catch {
			toast.error("Failed to update status");
		} finally {
			statusMutationLockRef.current = false;
			setIsUpdatingStatus(false);
		}
	};

	const handleDeleteDocument = async () => {
		if (!data || isDeleting) {
			return;
		}

		setIsDeleting(true);

		try {
			const [deleteError] = await api.documents.delete({ id: data.id });

			if (deleteError) {
				const message = isDefinedError(deleteError)
					? deleteError.message
					: "Failed to delete document";

				toast.error(message);
				return;
			}

			toast.success("Document deleted successfully.");
			setIsDeleteDialogOpen(false);
			router.push("/document-tracker");
		} catch {
			toast.error("Failed to delete document");
		} finally {
			setIsDeleting(false);
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
						{canPublishToArchive && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsPublishDialogOpen(true)}
								title="Publish to Archive"
							>
								<Archive className="mr-1 h-3.5 w-3.5" />
								Publish to Archive
							</Button>
						)}
						{canEditPublishedArchiveDetails && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsPublishDialogOpen(true)}
								title="Edit Legislative Archive Details"
							>
								<Archive className="mr-1 h-3.5 w-3.5" />
								Edit Archive Details
							</Button>
						)}
						{data.status === "approved" &&
							data.purpose === "for_action" &&
							(userRole === "admin_staff" || userRole === "head_admin") && (
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										handleOpenStatusTransition("released" as StatusType)
									}
									disabled={isUpdatingStatus}
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
						{canDeleteDocument && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsDeleteDialogOpen(true)}
								disabled={isDeleting}
								className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
							>
								<Trash2 className="mr-1 h-3.5 w-3.5" />
								Delete
							</Button>
						)}
					</div>
				</div>
			</div>

			{isInvitationDocument ? (
				<Card className="space-y-3 p-4">
					<h2 className="text-sm font-semibold">Invitation Workflow</h2>
					<dl className="space-y-2 text-sm">
						<div className="grid grid-cols-2 gap-2">
							<dt className="text-muted-foreground">Logged Status</dt>
							<dd>Received</dd>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<dt className="text-muted-foreground">Caller&apos;s Slip</dt>
							<dd>
								{invitationCallerSlipId ? "Assigned" : "Not yet assigned"}
							</dd>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<dt className="text-muted-foreground">Vice Mayor Decision</dt>
							<dd>
								{invitationCallerSlipId
									? invitationDecision
									: "Awaiting caller's slip assignment"}
							</dd>
						</div>
						{invitationDecisionRemarks && (
							<div className="space-y-1">
								<dt className="text-muted-foreground">Decision Remarks</dt>
								<dd>{invitationDecisionRemarks}</dd>
							</div>
						)}
					</dl>

					{invitationCallerSlipId && (
						<div className="pt-1">
							<Button asChild size="sm" variant="outline">
								<Link href={`/caller-slips/${invitationCallerSlipId}`}>
									Open Caller&apos;s Slip
								</Link>
							</Button>
						</div>
					)}
				</Card>
			) : (
				<DocumentStatusStepper
					purpose={data.purpose as PurposeType}
					status={data.status as StatusType}
				/>
			)}

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
										<SelectValue>{`v${selectedVersion.versionNumber}`}</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{data.versions.map((version, index) => (
											<SelectItem
												key={version.id}
												value={version.id}
												className="min-h-12"
											>
												<div className="flex flex-col gap-0.5">
													<span>
														v{version.versionNumber}
														{index === 0 ? " (current)" : ""}
													</span>
													<span className="text-xs text-muted-foreground">
														Uploaded {formatDateTimeInPHT(version.createdAt)}
													</span>
												</div>
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
								Upload New Version
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

							{isInvitationDocument && (
								<>
									<div className="grid grid-cols-2 gap-2">
										<dt className="text-muted-foreground">
											Caller&apos;s Slip
										</dt>
										<dd>
											{invitationCallerSlipId ? (
												<Link
													href={`/caller-slips/${invitationCallerSlipId}`}
													className="text-primary hover:underline"
												>
													Assigned (open)
												</Link>
											) : (
												"Not yet assigned"
											)}
										</dd>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<dt className="text-muted-foreground">VM Decision</dt>
										<dd>
											{invitationCallerSlipId
												? invitationDecision
												: "Awaiting caller's slip assignment"}
										</dd>
									</div>
								</>
							)}

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
						{isInvitationDocument ? (
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>
									Invitation workflow is managed through caller's slip
									assignment and Vice Mayor decision.
								</p>
								{invitationCallerSlipId ? (
									<div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
										<p className="font-medium text-emerald-900">
											This invitation is already assigned to a Caller&apos;s
											Slip.
										</p>
										<Link
											href={`/caller-slips/${invitationCallerSlipId}`}
											className="mt-1 inline-flex text-emerald-800 underline underline-offset-2 hover:text-emerald-700"
										>
											Open assigned Caller&apos;s Slip
										</Link>
									</div>
								) : canManageCallerSlips ? (
									<div className="flex flex-wrap items-center gap-2">
										<Button
											size="sm"
											onClick={() => setIsAssignSlipDialogOpen(true)}
										>
											Assign to Existing Caller&apos;s Slip
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => setIsGenerateSlipOpen(true)}
										>
											Generate Caller&apos;s Slip
										</Button>
									</div>
								) : (
									<p className="text-xs">
										Only Vice Mayor and OVM Staff can assign invitations to
										caller&apos;s slips.
									</p>
								)}
							</div>
						) : nextStatuses.length === 0 &&
							!canPublishToArchive &&
							!canEditPublishedArchiveDetails ? (
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
								) : canEditPublishedArchiveDetails ? (
									<Button
										size="sm"
										onClick={() => setIsPublishDialogOpen(true)}
									>
										Edit Archive Details
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
									{data.auditTrail.map((entry, index) => {
										const publishedArchiveUrl = entry.remarks
											? getPublishedArchiveUrlFromRemark(entry.remarks)
											: null;

										return (
											<li
												key={entry.id}
												className="relative mb-4 ml-4 last:mb-0"
											>
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
														{publishedArchiveUrl ? (
															<>
																&ldquo;{PUBLISHED_ARCHIVE_REMARK_PREFIX}
																<a
																	href={publishedArchiveUrl}
																	target="_blank"
																	rel="noreferrer"
																	className="break-all text-primary underline underline-offset-2 hover:text-primary/80"
																>
																	{publishedArchiveUrl}
																</a>
																&rdquo;
															</>
														) : (
															<>&ldquo;{entry.remarks}&rdquo;</>
														)}
													</p>
												)}
											</li>
										);
									})}
								</ol>
							</ScrollArea>
						)}
					</Card>
				</div>
			</div>

			<AssignInvitationToCallerSlipDialog
				open={isAssignSlipDialogOpen}
				onOpenChange={setIsAssignSlipDialogOpen}
				invitationDocumentId={data.id}
				invitationTitle={data.title}
				invitationCodeNumber={data.codeNumber}
			/>

			<GenerateCallerSlipDialog
				open={isGenerateSlipOpen}
				onOpenChange={setIsGenerateSlipOpen}
				selectedDocuments={selectedInvitationDocuments}
			/>

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
				mode={canEditPublishedArchiveDetails ? "edit" : "publish"}
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
					callerSlipId: invitationCallerSlipId,
					hasPublishedLegislativeHistory,
				}}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				onUpdated={async () => {
					await refetch();
				}}
			/>

			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					if (isDeleting) {
						return;
					}

					setIsDeleteDialogOpen(open);
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Delete Document</DialogTitle>
						<DialogDescription>
							This permanently deletes the document record, versions, and audit
							entries. This action cannot be undone.
						</DialogDescription>
						<p className="text-xs text-destructive">
							Only RECEIVED and RETURNED documents are deletable. HEAD ADMIN may
							also delete FOR INITIAL documents.
						</p>
					</DialogHeader>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDeleteDocument}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isStatusDialogOpen}
				onOpenChange={(open) => {
					if (isUpdatingStatus) {
						return;
					}

					setIsStatusDialogOpen(open);
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Confirm Status Change</DialogTitle>
						{pendingStatus ? (
							<DialogDescription>
								{`Are you sure you want to mark this document as ${formatDocumentStatus(pendingStatus)}?`}
							</DialogDescription>
						) : null}
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
							onClick={closeStatusDialog}
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
