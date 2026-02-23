import { oc } from "@orpc/contract";
import { z } from "zod";
import { ERRORS } from "../constants";
import {
	CreateRoomBookingSchema,
	GenerateBookingUploadUrlResponseSchema,
	GenerateBookingUploadUrlSchema,
	GetRoomBookingByIdSchema,
	GetRoomBookingListSchema,
	RoomBookingListResponseSchema,
	RoomBookingResponseSchema,
	UpdateRoomBookingSchema,
	UpdateRoomBookingStatusSchema,
} from "../schemas/room-booking.schema";

// ---------------------------------------------------------------------------
// GET /bookings — list bookings (with filters)
// ---------------------------------------------------------------------------
export const getRoomBookingList = oc
	.route({
		method: "GET",
		path: "/bookings",
		summary: "List conference room bookings",
		description:
			"Returns a paginated list of bookings. Supports filtering by status, room, and date.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetRoomBookingListSchema)
	.output(RoomBookingListResponseSchema);

// ---------------------------------------------------------------------------
// GET /bookings/{id} — get booking by ID
// ---------------------------------------------------------------------------
export const getRoomBookingById = oc
	.route({
		method: "GET",
		path: "/bookings/{id}",
		summary: "Get conference room booking by ID",
		description: "Returns full details for a single booking.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.ROOM_BOOKING.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetRoomBookingByIdSchema)
	.output(RoomBookingResponseSchema);

// ---------------------------------------------------------------------------
// POST /bookings — create a booking
// ---------------------------------------------------------------------------
export const createRoomBooking = oc
	.route({
		method: "POST",
		path: "/bookings",
		summary: "Create a conference room booking",
		description:
			"Creates a booking request. Status is auto-set to CONFIRMED for direct-path roles or PENDING for councilors. A conflict check against CONFIRMED bookings is performed.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		CONFLICT: ERRORS.ROOM_BOOKING.CONFLICT,
		INVALID_TIME_RANGE: ERRORS.ROOM_BOOKING.INVALID_TIME_RANGE,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		TOO_MANY_REQUESTS: ERRORS.GENERAL.TOO_MANY_REQUESTS,
	})
	.input(CreateRoomBookingSchema)
	.output(RoomBookingResponseSchema);

// ---------------------------------------------------------------------------
// PATCH /bookings/{id}/status — approve or reject a pending booking
// ---------------------------------------------------------------------------
export const updateRoomBookingStatus = oc
	.route({
		method: "PATCH",
		path: "/bookings/{id}/status",
		summary: "Approve or reject a pending booking",
		description:
			"Transitions a PENDING booking to CONFIRMED or REJECTED. Re-runs conflict detection before confirming. Restricted to head_admin, vice_mayor, and admin_staff.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.ROOM_BOOKING.NOT_FOUND,
		CONFLICT: ERRORS.ROOM_BOOKING.CONFLICT,
		FORBIDDEN: ERRORS.ROOM_BOOKING.FORBIDDEN,
		CANNOT_APPROVE: ERRORS.ROOM_BOOKING.CANNOT_APPROVE,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(UpdateRoomBookingStatusSchema)
	.output(RoomBookingResponseSchema);

// ---------------------------------------------------------------------------
// PUT /bookings/{id} — edit a booking
// ---------------------------------------------------------------------------
export const updateRoomBooking = oc
	.route({
		method: "PUT",
		path: "/bookings/{id}",
		summary: "Edit a conference room booking",
		description:
			"Allow booking owners to edit their booking details. If a confirmed booking's schedule or room is edited, its status is reset to pending for re-approval.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.ROOM_BOOKING.NOT_FOUND,
		CONFLICT: ERRORS.ROOM_BOOKING.CONFLICT,
		FORBIDDEN: ERRORS.ROOM_BOOKING.FORBIDDEN,
		INVALID_TIME_RANGE: ERRORS.ROOM_BOOKING.INVALID_TIME_RANGE,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(UpdateRoomBookingSchema)
	.output(RoomBookingResponseSchema);

// ---------------------------------------------------------------------------
// DELETE /bookings/{id} — delete a booking
// ---------------------------------------------------------------------------
export const deleteRoomBooking = oc
	.route({
		method: "DELETE",
		path: "/bookings/{id}",
		summary: "Delete a conference room booking",
		description:
			"Deletes a booking. Ownership check enforced: users can only delete their own bookings unless they are an admin-level role.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.ROOM_BOOKING.NOT_FOUND,
		FORBIDDEN: ERRORS.ROOM_BOOKING.FORBIDDEN,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetRoomBookingByIdSchema)
	.output(z.object({ success: z.boolean() }));

// ---------------------------------------------------------------------------
// POST /bookings/upload-url — generate signed upload URL for attachment
// ---------------------------------------------------------------------------
export const generateBookingUploadUrl = oc
	.route({
		method: "POST",
		path: "/bookings/upload-url",
		summary: "Generate a signed upload URL for a booking attachment",
		description:
			"Returns a short-lived Supabase signed upload URL. The client uploads the file directly to Supabase Storage and then passes the resulting path in CreateRoomBooking.attachmentUrl. File must be PDF, JPEG, or JPG and ≤ 5 MB.",
		tags: ["Room Booking", "Admin"],
	})
	.errors({
		INVALID_ATTACHMENT: ERRORS.ROOM_BOOKING.INVALID_ATTACHMENT,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GenerateBookingUploadUrlSchema)
	.output(GenerateBookingUploadUrlResponseSchema);

// ---------------------------------------------------------------------------
// Aggregated contract
// ---------------------------------------------------------------------------
export const roomBookingContract = {
	getList: getRoomBookingList,
	getById: getRoomBookingById,
	create: createRoomBooking,
	updateStatus: updateRoomBookingStatus,
	update: updateRoomBooking,
	delete: deleteRoomBooking,
	generateUploadUrl: generateBookingUploadUrl,
};
