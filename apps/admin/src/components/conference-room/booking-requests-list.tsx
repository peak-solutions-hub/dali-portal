"use client";

import {
	CONFERENCE_ROOM_COLORS,
	CONFERENCE_ROOM_LABELS,
	isAdminBookingRole,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	CheckCircle,
	ExternalLink,
	Eye,
	FileText,
	Loader2,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	usePendingRoomBookings,
	useUpdateBookingStatus,
} from "@/hooks/room-booking";
import { useAuthStore } from "@/stores/auth-store";
import {
	type CalendarBooking,
	mapApiBookings,
	resolveConferenceRoom,
} from "@/utils/booking-helpers";
import { formatFullDate } from "@/utils/date-utils";
import { BookingStatusBadge } from "./booking-status-badge";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import type { EditBookingData } from "./edit-booking-modal";
import { EditBookingModal } from "./edit-booking-modal";
import { ViewBookingModal } from "./view-booking-modal";

export function BookingRequestsList() {
	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;
	const userRole = userProfile?.role.name;
	const canApprove = userRole ? isAdminBookingRole(userRole) : false;

	const { data, isLoading } = usePendingRoomBookings(true);

	const bookings = useMemo((): CalendarBooking[] => {
		if (!data?.bookings) return [];
		const mapped = mapApiBookings(data.bookings);

		mapped.sort((a, b) => {
			const aIsDone = a.isPast && a.status === "confirmed";
			const bIsDone = b.isPast && b.status === "confirmed";
			if (aIsDone && !bIsDone) return 1;
			if (!aIsDone && bIsDone) return -1;
			return b.date.getTime() - a.date.getTime();
		});

		return mapped;
	}, [data]);

	// Modal states
	const [viewingBooking, setViewingBooking] = useState<CalendarBooking | null>(
		null,
	);
	const [editingBooking, setEditingBooking] = useState<EditBookingData | null>(
		null,
	);
	const [deletingBooking, setDeletingBooking] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const { updateStatus, isUpdating } = useUpdateBookingStatus();

	const handleEditFromView = (booking: CalendarBooking) => {
		setViewingBooking(null);
		setEditingBooking({
			id: booking.id,
			title: booking.purpose,
			requestedFor: booking.requestedFor,
			room: resolveConferenceRoom(
				booking.roomKey || booking.room,
				booking.room,
			),
			date: booking.date,
			startTime: booking.startTime24,
			endTime: booking.endTime24,
			attachmentUrl: booking.attachmentUrl,
		});
	};

	const handleDeleteFromView = (booking: CalendarBooking) => {
		setViewingBooking(null);
		setDeletingBooking({ id: booking.id, title: booking.purpose });
	};

	const canEditViewedBooking =
		viewingBooking !== null &&
		userId !== null &&
		viewingBooking.bookedBy === userId &&
		!(viewingBooking.isPast && viewingBooking.status === "confirmed");

	const canDeleteViewedBooking =
		viewingBooking !== null &&
		userId !== null &&
		(viewingBooking.bookedBy === userId || canApprove);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
				<span className="ml-2 text-sm text-gray-500">
					Loading booking requests…
				</span>
			</div>
		);
	}

	if (bookings.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<CheckCircle className="w-12 h-12 text-green-300 mb-3" />
				<p className="text-lg font-medium text-gray-700">All caught up!</p>
				<p className="text-sm text-gray-500 mt-1">
					There are no pending booking requests at this time.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 text-xs font-semibold">
									Details
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Schedule & Room
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Attachment
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Status
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bookings.map((booking) => {
								const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];

								return (
									<TableRow
										key={booking.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<TableCell className="max-w-50 align-top">
											<div className="flex flex-col gap-0.5">
												<span
													className="font-medium text-gray-900 truncate"
													title={booking.purpose}
												>
													{booking.purpose}
												</span>
												<div className="flex flex-col text-xs text-gray-500 mt-0.5">
													<span
														className="truncate"
														title={`For: ${booking.requestedFor}`}
													>
														For: {booking.requestedFor}
													</span>
													<span
														className="truncate"
														title={`By: ${booking.bookedByName ?? "—"}`}
													>
														By: {booking.bookedByName ?? "—"}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell className="align-top">
											<div className="flex flex-col items-start gap-1">
												<span
													className={`inline-flex items-center gap-1.5 text-[11px] leading-none font-medium px-2 py-0.5 rounded-full ${roomColors.label}`}
												>
													{CONFERENCE_ROOM_LABELS[booking.roomKey]}
												</span>
												<div className="flex flex-col text-xs text-gray-600 mt-0.5">
													<span className="font-medium">
														{formatFullDate(booking.date)}
													</span>
													<span>
														{booking.startTime} – {booking.endTime}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{booking.attachmentUrl ? (
												<a
													href={booking.attachmentUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
													title="View attachment"
												>
													<FileText className="w-3.5 h-3.5" />
													View
													<ExternalLink className="w-3 h-3" />
												</a>
											) : (
												<span className="text-gray-400 text-xs">None</span>
											)}
										</TableCell>
										<TableCell>
											<BookingStatusBadge
												status={booking.status}
												roomKey={booking.roomKey}
												isPast={booking.isPast}
											/>
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 px-2 text-gray-600 hover:text-gray-900"
													onClick={() => setViewingBooking(booking)}
												>
													<Eye className="w-4 h-4" />
												</Button>
												{canApprove &&
													booking.status === "pending" &&
													!booking.isPast && (
														<>
															<Button
																size="sm"
																className="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white"
																onClick={() =>
																	updateStatus(booking.id, "confirmed")
																}
																disabled={isUpdating}
															>
																{isUpdating ? (
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																) : (
																	<CheckCircle className="w-3.5 h-3.5" />
																)}
															</Button>
															<Button
																variant="outline"
																size="sm"
																className="h-8 px-2.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
																onClick={() =>
																	updateStatus(booking.id, "rejected")
																}
																disabled={isUpdating}
															>
																{isUpdating ? (
																	<Loader2 className="w-3.5 h-3.5 animate-spin" />
																) : (
																	<XCircle className="w-3.5 h-3.5" />
																)}
															</Button>
														</>
													)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Modals */}
			<ViewBookingModal
				isOpen={!!viewingBooking}
				onClose={() => setViewingBooking(null)}
				booking={viewingBooking}
				onEdit={handleEditFromView}
				onDelete={handleDeleteFromView}
				canEdit={canEditViewedBooking}
				canDelete={canDeleteViewedBooking}
				canApprove={canApprove}
			/>

			<EditBookingModal
				isOpen={!!editingBooking}
				onClose={() => setEditingBooking(null)}
				booking={editingBooking}
			/>

			<DeleteBookingDialog
				isOpen={!!deletingBooking}
				onClose={() => setDeletingBooking(null)}
				booking={deletingBooking}
			/>
		</>
	);
}
