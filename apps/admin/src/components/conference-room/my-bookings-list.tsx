"use client";

import { CONFERENCE_ROOM_LABELS, formatFullDate } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { PaginationControl } from "@repo/ui/components/pagination-control";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { usePagination } from "@repo/ui/hooks/use-pagination";
import { CONFERENCE_ROOM_COLORS } from "@repo/ui/lib/conference-room-colors";
import {
	BOOKING_PRIMARY_LINK_CLASS,
	BOOKING_TABLE_ROW_HOVER_CLASS,
} from "@repo/ui/lib/conference-room-ui";
import {
	CalendarClock,
	CalendarX,
	ExternalLink,
	Eye,
	FileText,
	Loader2,
	Paperclip,
	Pencil,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBookingListModals, useMyBookings } from "@/hooks/room-booking";
import { useAuthStore } from "@/stores/auth-store";
import {
	type CalendarBooking,
	type EditBookingData,
	getBookingDisplayStatus,
	mapApiBookings,
	mapBookingToEditBookingData,
} from "@/utils/booking-helpers";
import { BookingStatusBadge } from "./booking-status-badge";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import { EditBookingModal } from "./edit-booking-modal";
import { ViewBookingModal } from "./view-booking-modal";

export function MyBookingsList() {
	const BOOKINGS_PER_PAGE = 10;

	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;
	const userRole = userProfile?.role.name;
	const isCouncilor = userRole === "councilor";

	const { data, isLoading } = useMyBookings(userId);

	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending" | "confirmed" | "done" | "expired"
	>("all");

	const availableStatusFilters = useMemo(
		() =>
			isCouncilor
				? (["all", "pending", "confirmed", "done", "expired"] as const)
				: (["all", "confirmed", "done"] as const),
		[isCouncilor],
	);

	const statusFilterLabels: Record<
		"all" | "pending" | "confirmed" | "done" | "expired",
		string
	> = {
		all: "All",
		pending: "Pending",
		confirmed: "Approved",
		done: "Completed",
		expired: "Expired",
	};

	useEffect(() => {
		const isStatusAllowed = availableStatusFilters.some(
			(availableStatus) => availableStatus === statusFilter,
		);

		if (!isStatusAllowed) {
			setStatusFilter(availableStatusFilters[0]);
		}
	}, [availableStatusFilters, statusFilter]);

	const bookings = useMemo((): CalendarBooking[] => {
		if (!data?.bookings) return [];
		let mapped = mapApiBookings(data.bookings);

		if (statusFilter !== "all") {
			mapped = mapped.filter((b) => {
				const displayStatus = getBookingDisplayStatus(b);
				if (statusFilter === "done") return displayStatus === "done";
				if (statusFilter === "expired") return displayStatus === "expired";
				return displayStatus === statusFilter;
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

	const { currentPage, setCurrentPage, paginatedItems, pagination } =
		usePagination({
			items: bookings,
			itemsPerPage: BOOKINGS_PER_PAGE,
		});

	const {
		viewingBooking,
		editingBooking,
		deletingBooking,
		openView,
		closeView,
		openEdit,
		closeEdit,
		openDelete,
		closeDelete,
		openEditFromView,
		openDeleteFromView,
	} = useBookingListModals<CalendarBooking, EditBookingData>();

	const handleEditFromView = (booking: CalendarBooking) => {
		openEditFromView(mapBookingToEditBookingData(booking));
	};

	const handleDeleteFromView = (booking: CalendarBooking) => {
		openDeleteFromView({ id: booking.id, title: booking.purpose });
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
			<div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm mb-4">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
					<div className="flex bg-gray-100/80 p-1 rounded-lg w-max shrink-0 border border-gray-200/60 shadow-inner">
						{availableStatusFilters.map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => setStatusFilter(status)}
								className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
									statusFilter === status
										? status === "pending"
											? "bg-white text-yellow-700 shadow-sm ring-1 ring-gray-200"
											: status === "confirmed"
												? "bg-white text-green-700 shadow-sm ring-1 ring-gray-200"
												: status === "expired"
													? "bg-white text-red-600 shadow-sm ring-1 ring-gray-200"
													: "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								{statusFilterLabels[status]}
							</button>
						))}
					</div>

					{pagination.totalPages > 1 && (
						<PaginationControl
							totalItems={bookings.length}
							itemsPerPage={BOOKINGS_PER_PAGE}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							showCount
							className="mx-0"
						/>
					)}
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
						<Table className="table-fixed min-w-245">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-8 text-xs font-semibold w-[22%]">
										Booking Details
									</TableHead>
									<TableHead className="h-8 text-xs font-semibold w-[22%]">
										Schedule
									</TableHead>
									<TableHead className="h-8 text-xs font-semibold w-[30%]">
										Attachments
									</TableHead>
									<TableHead className="h-8 text-xs font-semibold w-[12%]">
										Status
									</TableHead>
									<TableHead className="h-8 text-xs font-semibold text-right w-[10%]">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedItems.map((booking) => {
									const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];
									const meetingTypeDisplay =
										booking.meetingType === "others" &&
										booking.meetingTypeOthers
											? `Others: ${booking.meetingTypeOthers}`
											: booking.meetingTypeLabel;

									return (
										<TableRow
											key={booking.id}
											className={BOOKING_TABLE_ROW_HOVER_CLASS}
										>
											<TableCell className="max-w-60 align-top py-4">
												<div className="flex flex-col gap-2">
													<div>
														<p
															className="text-sm font-semibold text-gray-900 leading-5 truncate"
															title={booking.purpose}
														>
															{booking.purpose}
														</p>
														<p
															className="text-xs text-gray-500 truncate"
															title={`Type: ${meetingTypeDisplay}`}
														>
															{meetingTypeDisplay}
														</p>
													</div>
													<div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 max-w-full">
														<Users className="h-3.5 w-3.5 shrink-0 text-gray-500" />
														<span
															className="truncate"
															title={`Booked For: ${booking.requestedFor}`}
														>
															Booked For: {booking.requestedFor}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="align-top py-4">
												<div className="flex flex-col items-start gap-2">
													<span
														className={`inline-flex items-center gap-1.5 text-[11px] leading-none font-medium px-2 py-0.5 rounded-full ${roomColors.label}`}
													>
														{CONFERENCE_ROOM_LABELS[booking.roomKey]}
													</span>
													<div className="inline-flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
														<CalendarClock className="h-3.5 w-3.5 text-gray-500 mt-0.5" />
														<div className="flex flex-col text-xs text-gray-700 leading-4">
															<span className="font-medium">
																{formatFullDate(booking.date)}
															</span>
															<span>
																{booking.startTime} – {booking.endTime}
															</span>
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell className="align-top py-4">
												{booking.attachments.length > 0 ? (
													<div className="flex flex-col items-start gap-1.5">
														{booking.attachments.map((attachment) => {
															const attachmentContent = (
																<span className="flex items-start gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 w-full max-w-80">
																	<Paperclip className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500" />
																	<span className="min-w-0">
																		<span className="truncate block text-xs font-medium text-gray-700 max-w-72">
																			{attachment.fileName}
																		</span>
																		{attachment.reason ? (
																			<span
																				className="text-[10px] text-gray-500 block truncate max-w-72"
																				title={attachment.reason}
																			>
																				Reason: {attachment.reason}
																			</span>
																		) : null}
																	</span>
																</span>
															);

															if (!attachment.url) {
																return (
																	<span
																		key={attachment.path}
																		className="text-xs text-gray-400 w-full max-w-80"
																		title={attachment.fileName}
																	>
																		{attachmentContent}
																	</span>
																);
															}

															return (
																<a
																	key={attachment.path}
																	href={attachment.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className={BOOKING_PRIMARY_LINK_CLASS}
																	title={attachment.fileName}
																>
																	<span className="relative">
																		{attachmentContent}
																		<ExternalLink className="w-3 h-3 absolute right-2 top-2 text-blue-600" />
																	</span>
																</a>
															);
														})}
													</div>
												) : (
													<span className="text-gray-400 text-xs">None</span>
												)}
											</TableCell>
											<TableCell className="py-4">
												<BookingStatusBadge
													status={booking.status}
													roomKey={booking.roomKey}
													isPast={booking.isPast}
												/>
											</TableCell>
											<TableCell className="py-4">
												<div className="flex items-center justify-end gap-1.5">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 px-2 text-gray-600 hover:text-gray-900"
														onClick={() => openView(booking)}
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
																openEdit(mapBookingToEditBookingData(booking))
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
															openDelete({
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
				onClose={closeView}
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
				onClose={closeEdit}
				booking={editingBooking}
			/>

			<DeleteBookingDialog
				isOpen={!!deletingBooking}
				onClose={closeDelete}
				booking={deletingBooking}
			/>
		</>
	);
}
