"use client";

import { CONFERENCE_ROOM_LABELS } from "@repo/shared";
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
import { CONFERENCE_ROOM_COLORS } from "@/utils/booking-color-utils";
import { type CalendarBooking, mapApiBookings } from "@/utils/booking-helpers";
import { formatFullDate } from "@/utils/date-utils";
import { BookingStatusBadge } from "./booking-status-badge";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import type { EditBookingData } from "./edit-booking-modal";
import { EditBookingModal } from "./edit-booking-modal";
import { ViewBookingModal } from "./view-booking-modal";

export function MyBookingsList() {
	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;

	const { data, isLoading } = useMyBookings(userId);

	const bookings = useMemo(
		(): CalendarBooking[] =>
			data?.bookings ? mapApiBookings(data.bookings) : [],
		[data],
	);

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
			room: booking.roomKey,
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

	if (bookings.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<CalendarX className="w-12 h-12 text-gray-300 mb-3" />
				<p className="text-lg font-medium text-gray-700">No bookings yet</p>
				<p className="text-sm text-gray-500 mt-1">
					You haven&apos;t created any booking requests yet.
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
									Title
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Room
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Date
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Time
								</TableHead>
								<TableHead className="h-8 text-xs font-semibold">
									Requested For
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
										<TableCell className="font-medium text-gray-900 max-w-50 truncate">
											{booking.purpose}
										</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${roomColors.label}`}
											>
												<span
													className={`w-2 h-2 rounded-full ${roomColors.dot}`}
												/>
												{CONFERENCE_ROOM_LABELS[booking.roomKey]}
											</span>
										</TableCell>
										<TableCell className="text-gray-700 whitespace-nowrap">
											{formatFullDate(booking.date)}
										</TableCell>
										<TableCell className="text-gray-700 whitespace-nowrap">
											{booking.startTime} – {booking.endTime}
										</TableCell>
										<TableCell className="text-gray-700 max-w-40 truncate">
											{booking.requestedFor}
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
												{booking.status === "pending" && (
													<>
														<Button
															variant="ghost"
															size="sm"
															className="h-8 px-2 text-blue-600 hover:text-blue-700"
															onClick={() =>
																setEditingBooking({
																	id: booking.id,
																	title: booking.purpose,
																	requestedFor: booking.requestedFor,
																	room: booking.roomKey,
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
				canEdit={viewingBooking?.status === "pending"}
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
