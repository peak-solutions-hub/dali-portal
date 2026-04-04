"use client";

import { CONFERENCE_ROOM_LABELS, formatFullDate } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { CONFERENCE_ROOM_COLORS } from "@repo/ui/lib/conference-room-colors";
import {
	CalendarX,
	ExternalLink,
	Eye,
	FileText,
	Loader2,
	Pencil,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMyBookings } from "@/hooks/room-booking";
import { useAuthStore } from "@/stores/auth-store";
import {
	type CalendarBooking,
	mapApiBookings,
	resolveConferenceRoom,
} from "@/utils/booking-helpers";
import { BookingStatusBadge } from "./booking-status-badge";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import type { EditBookingData } from "./edit-booking-modal";
import { EditBookingModal } from "./edit-booking-modal";
import { ViewBookingModal } from "./view-booking-modal";

export function MyBookingsList() {
	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;

	const { data, isLoading } = useMyBookings(userId);

	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending" | "confirmed" | "done" | "expired"
	>("all");

	const bookings = useMemo((): CalendarBooking[] => {
		if (!data?.bookings) return [];
		let mapped = mapApiBookings(data.bookings);

		if (statusFilter !== "all") {
			mapped = mapped.filter((b) => {
				const isDone = b.isPast && b.status === "confirmed";
				const isExpired = b.isPast && b.status === "pending";
				if (statusFilter === "done") return isDone;
				if (statusFilter === "expired") return isExpired;
				return !isDone && !isExpired && b.status === statusFilter;
			});
		}

		mapped.sort((a, b) => {
			const aIsPast =
				a.isPast && (a.status === "confirmed" || a.status === "pending");
			const bIsPast =
				b.isPast && (b.status === "confirmed" || b.status === "pending");
			if (aIsPast && !bIsPast) return 1;
			if (!aIsPast && bIsPast) return -1;
			return b.date.getTime() - a.date.getTime();
		});

		return mapped;
	}, [data, statusFilter]);

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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
				<span className="ml-2 text-sm text-gray-500">
					Loading your bookings…
				</span>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
				<div className="flex bg-gray-100/80 p-1 rounded-lg w-max shrink-0 border border-gray-200/60 shadow-inner">
					<button
						type="button"
						onClick={() => setStatusFilter("all")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
							statusFilter === "all"
								? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						All
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("pending")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
							statusFilter === "pending"
								? "bg-white text-yellow-700 shadow-sm ring-1 ring-gray-200"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Pending
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("confirmed")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
							statusFilter === "confirmed"
								? "bg-white text-green-700 shadow-sm ring-1 ring-gray-200"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Confirmed
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("done")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
							statusFilter === "done"
								? "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Done
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("expired")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
							statusFilter === "expired"
								? "bg-white text-red-600 shadow-sm ring-1 ring-gray-200"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Expired
					</button>
				</div>
			</div>

			{bookings.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
					<CalendarX className="w-12 h-12 text-gray-300 mb-3" />
					<p className="text-lg font-medium text-gray-700">No bookings found</p>
					<p className="text-sm text-gray-500 mt-1">
						{statusFilter === "all"
							? "You haven't created any booking requests yet."
							: `There are no bookings matching the "${statusFilter}" status.`}
					</p>
				</div>
			) : (
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
													<span
														className="text-xs text-gray-500 truncate"
														title={`For: ${booking.requestedFor}`}
													>
														For: {booking.requestedFor}
													</span>
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
														title="View booking"
													>
														<Eye className="w-4 h-4" />
													</Button>
													{!(
														booking.isPast && booking.status === "confirmed"
													) && (
														<Button
															variant="ghost"
															size="sm"
															className="h-8 px-2 text-blue-600 hover:text-blue-700"
															onClick={() =>
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
																})
															}
															title="Edit booking"
														>
															<Pencil className="w-4 h-4" />
														</Button>
													)}
													<Button
														variant="ghost"
														size="sm"
														className="h-8 px-2 text-red-600 hover:text-red-700"
														onClick={() =>
															setDeletingBooking({
																id: booking.id,
																title: booking.purpose,
															})
														}
														title="Delete booking"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</div>
			)}

			{/* Modals */}
			<ViewBookingModal
				isOpen={!!viewingBooking}
				onClose={() => setViewingBooking(null)}
				booking={viewingBooking}
				onEdit={handleEditFromView}
				onDelete={handleDeleteFromView}
				canEdit={
					viewingBooking
						? !(viewingBooking.isPast && viewingBooking.status === "confirmed")
						: false
				}
				canDelete={!!viewingBooking}
				canApprove={false}
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
