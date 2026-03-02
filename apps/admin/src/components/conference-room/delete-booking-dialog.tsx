"use client";

import { Loader2 } from "lucide-react";
import { useDeleteBooking } from "@/hooks/room-booking";

interface DeleteBookingDialogProps {
	isOpen: boolean;
	onClose: () => void;
	booking: { id: string; title: string } | null;
}

export function DeleteBookingDialog({
	isOpen,
	onClose,
	booking,
}: DeleteBookingDialogProps) {
	const { deleteBooking, isDeleting } = useDeleteBooking(() => {
		onClose();
	});

	const handleDelete = async () => {
		if (!booking) return;
		await deleteBooking(booking.id);
	};

	if (!isOpen || !booking) return null;

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-md">
				<div className="px-6 py-5">
					<h3 className="text-lg font-semibold text-gray-900">
						Delete Booking
					</h3>
					<p className="mt-2 text-sm text-gray-600">
						Are you sure you want to delete{" "}
						<span className="font-medium text-gray-900">
							&quot;{booking.title}&quot;
						</span>
						? This action cannot be undone.
					</p>
				</div>

				<div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
					<button
						type="button"
						onClick={onClose}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70"
					>
						{isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
						{isDeleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
		</div>
	);
}
