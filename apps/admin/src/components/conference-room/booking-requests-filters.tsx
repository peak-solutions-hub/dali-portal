"use client";

import { CONFERENCE_ROOM_OPTIONS, MEETING_TYPE_OPTIONS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { PaginationControl } from "@repo/ui/components/pagination-control";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { X } from "lucide-react";

interface BookingRequestsFiltersProps {
	today: Date;
	isFilterPopoverOpen: boolean;
	setIsFilterPopoverOpen: (value: boolean) => void;
	draftRoomFilter: string;
	setDraftRoomFilter: (value: string) => void;
	draftMeetingTypeFilter: string;
	setDraftMeetingTypeFilter: (value: string) => void;
	draftDateFilter: Date | undefined;
	setDraftDateFilter: (value: Date | undefined) => void;
	hasActiveFilters: boolean;
	onApplyFilters: () => void;
	onClearFilters: () => void;
	showPagination: boolean;
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;
	onPageChange: (page: number) => void;
}

export function BookingRequestsFilters({
	today,
	isFilterPopoverOpen,
	setIsFilterPopoverOpen,
	draftRoomFilter,
	setDraftRoomFilter,
	draftMeetingTypeFilter,
	setDraftMeetingTypeFilter,
	draftDateFilter,
	setDraftDateFilter,
	hasActiveFilters,
	onApplyFilters,
	onClearFilters,
	showPagination,
	totalItems,
	itemsPerPage,
	currentPage,
	onPageChange,
}: BookingRequestsFiltersProps) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm mb-4">
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
				<div className="flex items-center gap-2">
					<Popover
						open={isFilterPopoverOpen}
						onOpenChange={setIsFilterPopoverOpen}
					>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="h-9 border-gray-300 bg-white"
							>
								Filters
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-72 p-3" align="start">
							<div className="space-y-3">
								<div>
									<p className="text-xs font-medium text-gray-500 mb-1">Room</p>
									<Select
										value={draftRoomFilter}
										onValueChange={setDraftRoomFilter}
									>
										<SelectTrigger className="w-full h-9 border-gray-300 bg-white shadow-sm">
											<SelectValue placeholder="All Rooms" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Rooms</SelectItem>
											{CONFERENCE_ROOM_OPTIONS.map((room) => (
												<SelectItem key={room.value} value={room.value}>
													{room.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<p className="text-xs font-medium text-gray-500 mb-1">
										Meeting Type
									</p>
									<Select
										value={draftMeetingTypeFilter}
										onValueChange={setDraftMeetingTypeFilter}
									>
										<SelectTrigger className="w-full h-9 border-gray-300 bg-white shadow-sm">
											<SelectValue placeholder="All Meeting Types" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Meeting Types</SelectItem>
											{MEETING_TYPE_OPTIONS.map((meetingType) => (
												<SelectItem
													key={meetingType.value}
													value={meetingType.value}
												>
													{meetingType.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<p className="text-xs font-medium text-gray-500 mb-1">Date</p>
									<div className="flex justify-center rounded-md border border-gray-300 bg-white">
										<Calendar
											mode="single"
											selected={draftDateFilter}
											onSelect={setDraftDateFilter}
											disabled={(date) => date < today}
											initialFocus
										/>
									</div>
								</div>

								<div className="flex justify-end">
									<Button size="sm" onClick={onApplyFilters}>
										Apply Filters
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					<Button
						variant="ghost"
						size="sm"
						className="h-9 px-3 border border-transparent data-[active=true]:border-gray-300"
						onClick={onClearFilters}
						disabled={!hasActiveFilters}
						title="Clear all filters"
						data-active={hasActiveFilters}
					>
						Clear Filters
						{hasActiveFilters ? <X className="h-4 w-4 ml-1" /> : null}
					</Button>
				</div>

				{showPagination && (
					<PaginationControl
						totalItems={totalItems}
						itemsPerPage={itemsPerPage}
						currentPage={currentPage}
						onPageChange={onPageChange}
						showCount
						className="mx-0"
					/>
				)}
			</div>
		</div>
	);
}
