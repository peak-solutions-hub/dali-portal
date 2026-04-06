"use client";

import { useCallback, useState } from "react";

interface DeleteBookingState {
	id: string;
	title: string;
}

export function useBookingListModals<TBooking, TEdit>() {
	const [viewingBooking, setViewingBooking] = useState<TBooking | null>(null);
	const [editingBooking, setEditingBooking] = useState<TEdit | null>(null);
	const [deletingBooking, setDeletingBooking] =
		useState<DeleteBookingState | null>(null);

	const openView = useCallback((booking: TBooking) => {
		setViewingBooking(booking);
	}, []);

	const closeView = useCallback(() => {
		setViewingBooking(null);
	}, []);

	const openEdit = useCallback((payload: TEdit) => {
		setEditingBooking(payload);
	}, []);

	const closeEdit = useCallback(() => {
		setEditingBooking(null);
	}, []);

	const openDelete = useCallback((payload: DeleteBookingState) => {
		setDeletingBooking(payload);
	}, []);

	const closeDelete = useCallback(() => {
		setDeletingBooking(null);
	}, []);

	const openEditFromView = useCallback((payload: TEdit) => {
		setViewingBooking(null);
		setEditingBooking(payload);
	}, []);

	const openDeleteFromView = useCallback((payload: DeleteBookingState) => {
		setViewingBooking(null);
		setDeletingBooking(payload);
	}, []);

	return {
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
	};
}
