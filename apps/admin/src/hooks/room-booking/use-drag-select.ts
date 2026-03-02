"use client";

import { useCallback, useState } from "react";
import { getSlotTimeRange } from "@/utils/booking-helpers";
import type { TimeSlot } from "@/utils/time-utils";

interface UseDragSelectOptions {
	timeSlots: TimeSlot[];
	/** Called with the formatted "StartTime - EndTime" string when the user completes a selection. */
	onSelectRange: (timeRange: string) => void;
}

interface UseDragSelectReturn {
	isDragging: boolean;
	selectedSlots: number[];
	dragPreviewTime: string;
	dragStartIndex: number | null;
	dragEndIndex: number | null;
	handleMouseDown: (index: number) => void;
	handleMouseEnter: (index: number) => void;
	handleMouseUp: () => void;
	isSlotSelected: (index: number) => boolean;
	resetDrag: () => void;
}

export function useDragSelect({
	timeSlots,
	onSelectRange,
}: UseDragSelectOptions): UseDragSelectReturn {
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
	const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
	const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
	const [dragPreviewTime, setDragPreviewTime] = useState("");

	const resetDrag = useCallback(() => {
		setIsDragging(false);
		setDragStartIndex(null);
		setDragEndIndex(null);
		setSelectedSlots([]);
		setDragPreviewTime("");
	}, []);

	const handleMouseDown = useCallback((index: number) => {
		setDragStartIndex(index);
		setDragEndIndex(index);
		setSelectedSlots([index]);
		setDragPreviewTime("");
	}, []);

	const handleMouseEnter = useCallback(
		(index: number) => {
			if (dragStartIndex === null) return;

			// Set dragging flag when user moves to a different slot
			if (index !== dragStartIndex) {
				setIsDragging(true);
			}

			setDragEndIndex(index);
			const start = Math.min(dragStartIndex, index);
			const end = Math.max(dragStartIndex, index);

			const slots: number[] = [];
			for (let i = start; i <= end; i++) {
				slots.push(i);
			}
			setSelectedSlots(slots);

			// Update drag preview time
			const range = getSlotTimeRange(timeSlots, start, end);
			if (range) setDragPreviewTime(range);
		},
		[dragStartIndex, timeSlots],
	);

	const handleMouseUp = useCallback(() => {
		if (dragStartIndex === null || dragEndIndex === null) return;

		let start = Math.min(dragStartIndex, dragEndIndex);
		let end = Math.max(dragStartIndex, dragEndIndex);

		// If it's a click (not a drag), auto-select 1 hour on the hour
		if (!isDragging) {
			const clickedSlot = timeSlots[start];
			if (!clickedSlot) {
				resetDrag();
				return;
			}

			// Find the start of the hour (when minute === 0)
			const hourStartIndex = timeSlots.findIndex(
				(slot) => slot.hour === clickedSlot.hour && slot.minute === 0,
			);

			if (hourStartIndex === -1) {
				resetDrag();
				return;
			}

			start = hourStartIndex;
			end = start + 3; // 4 slots = 1 hour

			if (end >= timeSlots.length) {
				end = timeSlots.length - 1;
			}
		}

		const range = getSlotTimeRange(timeSlots, start, end);
		if (range) {
			onSelectRange(range);
		}

		resetDrag();
	}, [
		dragStartIndex,
		dragEndIndex,
		isDragging,
		timeSlots,
		onSelectRange,
		resetDrag,
	]);

	const isSlotSelected = useCallback(
		(index: number) => selectedSlots.includes(index),
		[selectedSlots],
	);

	return {
		isDragging,
		selectedSlots,
		dragPreviewTime,
		dragStartIndex,
		dragEndIndex,
		handleMouseDown,
		handleMouseEnter,
		handleMouseUp,
		isSlotSelected,
		resetDrag,
	};
}
