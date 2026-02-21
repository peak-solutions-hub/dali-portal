"use client";

import { CONFERENCE_ROOM_COLORS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	CheckCircle,
	ExternalLink,
	FileText,
	Loader2,
	Pencil,
	Trash2,
	X,
	XCircle,
} from "lucide-react";
import { useUpdateBookingStatus } from "@/hooks/room-booking";
import type { CalendarBooking } from "@/utils/booking-helpers";
import { formatFullDate } from "@/utils/date-utils";
import { BookingStatusBadge } from "./booking-status-badge";

interface ViewBookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	booking: CalendarBooking | null;
	onEdit: (booking: CalendarBooking) => void;
	onDelete: (booking: CalendarBooking) => void;
	canEdit: boolean;
	canApprove: boolean;
}

export function ViewBookingModal({
	isOpen,
	onClose,
	booking,
	onEdit,
	onDelete,
	canEdit,
	canApprove,
}: ViewBookingModalProps) {
	const { updateStatus, isUpdating } = useUpdateBookingStatus(() => {
		onClose();
	});

	if (!isOpen || !booking) return null;

	const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];
	const isPending = booking.status === "pending";
	const isRejected = booking.status === "rejected";

	const handleApprove = () => updateStatus(booking.id, "confirmed");
	const handleReject = () => updateStatus(booking.id, "rejected");

	const urlPath = (
		(booking.attachmentUrl ?? "").split("?")[0] ?? ""
	).toLowerCase();
	const isPdf = urlPath.endsWith(".pdf");
	const isImage = /\.(jpe?g|png|gif|webp)$/.test(urlPath);
	const attachmentFileName = booking.attachmentUrl
		? decodeURIComponent(
				(booking.attachmentUrl.split("?")[0] ?? "").split("/").pop() ??
					"attachment",
			)
		: null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div
				className={`bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-lg`}
			>
				{/* Header */}
				<div className="bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between shrink-0">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<h2 className="text-xl font-bold text-gray-900 truncate">
								{booking.purpose}
							</h2>
							<BookingStatusBadge
								status={booking.status}
								roomKey={booking.roomKey}
							/>
						</div>
						<p className={`text-sm font-medium ${roomColors.text}`}>
							{booking.room}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-md transition-colors ml-2 shrink-0"
						disabled={isUpdating}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Body (scrollable only) */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
					{/* Date & Time */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
								Date
							</p>
							<p className="text-sm text-gray-900">
								{formatFullDate(booking.date)}
							</p>
						</div>
						<div>
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
								Time
							</p>
							<p className="text-sm text-gray-900">
								{booking.startTime} - {booking.endTime}
							</p>
						</div>
					</div>

					{/* Requested For */}
					<div>
						<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Requested For
						</p>
						<p className="text-sm text-gray-900">{booking.requestedFor}</p>
					</div>

					{/* Attachment — file card */}
					{booking.attachmentUrl && attachmentFileName && (
						<div>
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Attachment
							</p>
							<a
								href={booking.attachmentUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
								title={`View ${attachmentFileName}`}
							>
								<div className="p-2 rounded-lg bg-gray-100">
									<FileText className="h-5 w-5 text-gray-600" />
								</div>
								<div className="flex flex-col min-w-0 flex-1">
									<span className="text-sm font-medium text-gray-900 truncate">
										{attachmentFileName}
									</span>
									<span className="text-xs text-gray-500">
										{isPdf ? "PDF Document" : isImage ? "Image" : "File"} —
										Click to view
									</span>
								</div>
								<ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
							</a>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-2 justify-between shrink-0 bg-white">
					<div className="flex gap-2">
						{canEdit && !isRejected && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onEdit(booking)}
								disabled={isUpdating}
							>
								<Pencil className="w-4 h-4 mr-1" />
								Edit
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
							onClick={() => onDelete(booking)}
							disabled={isUpdating}
						>
							<Trash2 className="w-4 h-4 mr-1" />
							Delete
						</Button>
					</div>

					{isPending && canApprove && (
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
								onClick={handleReject}
								disabled={isUpdating}
							>
								{isUpdating ? (
									<Loader2 className="w-4 h-4 mr-1 animate-spin" />
								) : (
									<XCircle className="w-4 h-4 mr-1" />
								)}
								Reject
							</Button>
							<Button
								size="sm"
								className="bg-green-600 hover:bg-green-700 text-white"
								onClick={handleApprove}
								disabled={isUpdating}
							>
								{isUpdating ? (
									<Loader2 className="w-4 h-4 mr-1 animate-spin" />
								) : (
									<CheckCircle className="w-4 h-4 mr-1" />
								)}
								Approve
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
