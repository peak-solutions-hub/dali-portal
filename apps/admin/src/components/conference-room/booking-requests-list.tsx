"use client";

import {
	CONFERENCE_ROOM_LABELS,
	formatFullDate,
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
import { usePagination } from "@repo/ui/hooks/use-pagination";
import { CONFERENCE_ROOM_COLORS } from "@repo/ui/lib/conference-room-colors";
import {
	BOOKING_APPROVE_BUTTON_CLASS,
	BOOKING_PRIMARY_LINK_CLASS,
	BOOKING_REJECT_BUTTON_CLASS,
	BOOKING_TABLE_ROW_HOVER_CLASS,
} from "@repo/ui/lib/conference-room-ui";
import {
	CalendarClock,
	CheckCircle,
	ExternalLink,
	Eye,
	FileText,
	Loader2,
	Paperclip,
	Users,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	useBookingListModals,
	usePendingRoomBookings,
	useUpdateBookingStatus,
} from "@/hooks/room-booking";
import { useAuthStore } from "@/stores/auth-store";
import {
	type CalendarBooking,
	type EditBookingData,
	mapApiBookings,
	mapBookingToEditBookingData,
} from "@/utils/booking-helpers";
import { BookingRequestsFilters } from "./booking-requests-filters";
import { BookingStatusBadge } from "./booking-status-badge";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import { EditBookingModal } from "./edit-booking-modal";
import { ViewBookingModal } from "./view-booking-modal";

export function BookingRequestsList() {
	const BOOKINGS_PER_PAGE = 10;
	const today = useMemo(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	}, []);

	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;
	const userRole = userProfile?.role.name;
	const canApprove = userRole ? isAdminBookingRole(userRole) : false;

	const { data, isLoading } = usePendingRoomBookings(true);
	const [roomFilter, setRoomFilter] = useState<string>("all");
	const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>("all");
	const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
	const [draftRoomFilter, setDraftRoomFilter] = useState<string>("all");
	const [draftMeetingTypeFilter, setDraftMeetingTypeFilter] =
		useState<string>("all");
	const [draftDateFilter, setDraftDateFilter] = useState<Date | undefined>(
		undefined,
	);
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

	const bookings = useMemo((): CalendarBooking[] => {
		if (!data?.bookings) return [];
		let mapped = mapApiBookings(data.bookings).filter(
			(booking) => !(booking.isPast && booking.status === "pending"),
		);

		if (roomFilter !== "all") {
			mapped = mapped.filter((booking) => booking.roomKey === roomFilter);
		}

		if (meetingTypeFilter !== "all") {
			mapped = mapped.filter(
				(booking) => booking.meetingType === meetingTypeFilter,
			);
		}

		if (dateFilter) {
			mapped = mapped.filter(
				(booking) =>
					booking.date.getFullYear() === dateFilter.getFullYear() &&
					booking.date.getMonth() === dateFilter.getMonth() &&
					booking.date.getDate() === dateFilter.getDate(),
			);
		}

		mapped.sort((a, b) => {
			const aIsDone = a.isPast && a.status === "confirmed";
			const bIsDone = b.isPast && b.status === "confirmed";
			if (aIsDone && !bIsDone) return 1;
			if (!aIsDone && bIsDone) return -1;
			return b.date.getTime() - a.date.getTime();
		});

		return mapped;
	}, [data, roomFilter, meetingTypeFilter, dateFilter]);

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
		closeEdit,
		closeDelete,
		openEditFromView,
		openDeleteFromView,
	} = useBookingListModals<CalendarBooking, EditBookingData>();

	const { updateStatus, isUpdating } = useUpdateBookingStatus();

	const handleEditFromView = (booking: CalendarBooking) => {
		openEditFromView(mapBookingToEditBookingData(booking));
	};

	const handleDeleteFromView = (booking: CalendarBooking) => {
		openDeleteFromView({ id: booking.id, title: booking.purpose });
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

	const hasActiveFilters =
		roomFilter !== "all" ||
		meetingTypeFilter !== "all" ||
		dateFilter !== undefined;

	const handleApplyFilters = () => {
		setRoomFilter(draftRoomFilter);
		setMeetingTypeFilter(draftMeetingTypeFilter);
		setDateFilter(draftDateFilter);
		setCurrentPage(1);
		setIsFilterPopoverOpen(false);
	};

	const handleClearFilters = () => {
		setRoomFilter("all");
		setMeetingTypeFilter("all");
		setDateFilter(undefined);
		setDraftRoomFilter("all");
		setDraftMeetingTypeFilter("all");
		setDraftDateFilter(undefined);
		setCurrentPage(1);
	};

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

	return (
		<>
			<BookingRequestsFilters
				today={today}
				isFilterPopoverOpen={isFilterPopoverOpen}
				setIsFilterPopoverOpen={setIsFilterPopoverOpen}
				draftRoomFilter={draftRoomFilter}
				setDraftRoomFilter={setDraftRoomFilter}
				draftMeetingTypeFilter={draftMeetingTypeFilter}
				setDraftMeetingTypeFilter={setDraftMeetingTypeFilter}
				draftDateFilter={draftDateFilter}
				setDraftDateFilter={setDraftDateFilter}
				hasActiveFilters={hasActiveFilters}
				onApplyFilters={handleApplyFilters}
				onClearFilters={handleClearFilters}
				showPagination={pagination.totalPages > 1}
				totalItems={bookings.length}
				itemsPerPage={BOOKINGS_PER_PAGE}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
			/>

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
							{paginatedItems.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="py-16 text-center">
										<p className="text-lg font-medium text-gray-700">
											{hasActiveFilters
												? "No matching booking requests"
												: "All caught up!"}
										</p>
										<p className="text-sm text-gray-500 mt-1">
											{hasActiveFilters
												? "Try changing or clearing filters to see booking requests."
												: "There are no pending booking requests at this time."}
										</p>
									</TableCell>
								</TableRow>
							) : (
								paginatedItems.map((booking) => {
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
													<div className="inline-flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 max-w-full">
														<Users className="h-3.5 w-3.5 shrink-0 text-gray-500 mt-0.5" />

														<div
															className="flex flex-col truncate"
															title={`Booked For: ${booking.requestedFor}\nBooked By: ${booking.bookedByName ?? "—"}`}
														>
															<span className="truncate">
																Booked For: {booking.requestedFor}
															</span>
															<span className="truncate text-gray-500">
																Booked By: {booking.bookedByName ?? "—"}
															</span>
														</div>
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
													>
														<Eye className="w-4 h-4" />
													</Button>
													{canApprove &&
														booking.status === "pending" &&
														!booking.isPast && (
															<>
																<Button
																	size="sm"
																	className={BOOKING_APPROVE_BUTTON_CLASS}
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
																	className={BOOKING_REJECT_BUTTON_CLASS}
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
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Modals */}
			<ViewBookingModal
				isOpen={!!viewingBooking}
				onClose={closeView}
				booking={viewingBooking}
				onEdit={handleEditFromView}
				onDelete={handleDeleteFromView}
				canEdit={canEditViewedBooking}
				canDelete={canDeleteViewedBooking}
				canApprove={canApprove}
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
