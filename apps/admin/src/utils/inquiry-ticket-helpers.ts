import { isDefinedError } from "@orpc/client";
import type {
	InquiryStatus,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface TicketHelperCallbacks {
	onTicketUpdate: (ticket: InquiryTicketWithMessagesResponse) => void;
	onMessageClear: () => void;
	onLoadingChange: (loading: boolean) => void;
	onStatusLoadingChange: (loading: boolean) => void;
	onFilesClear: () => void;
	onUploadProgress: (progress: number) => void;
	onStatusUpdate?: () => void;
}

export interface UserInfo {
	id: string;
	fullName: string;
}

export const createTicketHelpers = (
	ticketId: string | null,
	message: string,
	files: File[],
	uploadFiles: () => Promise<string[]>,
	callbacks: TicketHelperCallbacks,
	currentUser?: UserInfo,
) => {
	const {
		onTicketUpdate,
		onMessageClear,
		onLoadingChange,
		onStatusLoadingChange,
		onFilesClear,
		onUploadProgress,
		onStatusUpdate,
	} = callbacks;

	const refreshTicketData = async () => {
		if (!ticketId) return null;

		const [refreshErr, refreshedTicket] = await api.inquiries.getWithMessages({
			id: ticketId,
		});
		if (!refreshErr && refreshedTicket) {
			onTicketUpdate(refreshedTicket);
			return refreshedTicket;
		}
		return null;
	};

	const handleSendMessage = async () => {
		if ((!message.trim() && files.length === 0) || !ticketId) return;

		onLoadingChange(true);
		onUploadProgress(10);

		try {
			let attachmentPaths: string[] = [];
			if (files.length > 0) {
				onUploadProgress(40);
				attachmentPaths = await uploadFiles();
				onUploadProgress(80);
			}

			const [err, _result] = await api.inquiries.sendMessage({
				ticketId,
				content: message.trim() || "(Attachment)",
				senderName: "Staff Member", // TODO: Get from auth context
				senderType: "staff",
				attachmentPaths:
					attachmentPaths.length > 0 ? attachmentPaths : undefined,
			});

			if (err) {
				if (isDefinedError(err)) {
					toast.error(err.message);
				} else {
					toast.error("Failed to send message");
				}
				onLoadingChange(false);
				onUploadProgress(0);
				return;
			}

			// Refresh ticket data
			await refreshTicketData();
			onMessageClear();
			onFilesClear();

			// Status may have auto-updated (staff reply → waiting_for_citizen)
			// Notify parent to refresh status counts
			if (onStatusUpdate) {
				onStatusUpdate();
			}
			toast.success("Message sent successfully");
		} catch (e) {
			console.error(e);
			toast.error("An error occurred while sending message");
		} finally {
			onLoadingChange(false);
			onUploadProgress(0);
		}
	};

	const handleUpdateStatus = async (
		newStatus: InquiryStatus,
		closureRemarks?: string,
	) => {
		if (!ticketId) return;

		onStatusLoadingChange(true);
		const [err, _result] = await api.inquiries.updateStatus({
			id: ticketId,
			status: newStatus,
			closureRemarks,
		});

		if (err) {
			if (isDefinedError(err)) {
				toast.error(err.message);
			} else {
				toast.error("Failed to update status");
			}
			onStatusLoadingChange(false);
			return;
		}

		// Refresh ticket data
		await refreshTicketData();
		onStatusLoadingChange(false);

		// Notify parent to refresh status counts
		if (onStatusUpdate) {
			onStatusUpdate();
		}
	};

	const handleAssignToMe = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleResolve = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleReject = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const confirmAssignToMe = async () => {
		if (!ticketId) return;

		onStatusLoadingChange(true);
		const [err, _result] = await api.inquiries.assignToMe({
			id: ticketId,
		});

		if (err) {
			if (isDefinedError(err)) {
				toast.error(err.message);
			} else {
				toast.error("Failed to assign ticket");
			}
			onStatusLoadingChange(false);
			return;
		}

		// Refresh ticket data to get updated info
		const refreshedTicket = await refreshTicketData();
		onStatusLoadingChange(false);

		// Show success toast with ticket number
		if (refreshedTicket) {
			const assigneeName = currentUser?.fullName || "you";
			toast.success(
				`Inquiry ${refreshedTicket.referenceNumber} has been assigned to ${assigneeName}`,
			);
		}

		// Notify parent to refresh status counts (new → open transition)
		if (onStatusUpdate) {
			onStatusUpdate();
		}
	};

	const confirmResolve = async (remarks: string) => {
		if (!ticketId) return;

		onStatusLoadingChange(true);
		const [err, _result] = await api.inquiries.updateStatus({
			id: ticketId,
			status: "resolved",
			closureRemarks: remarks,
		});

		if (err) {
			if (isDefinedError(err)) {
				toast.error(err.message);
			} else {
				toast.error("Failed to resolve ticket");
			}
			onStatusLoadingChange(false);
			return;
		}

		// Refresh ticket data to get updated info
		const refreshedTicket = await refreshTicketData();
		onStatusLoadingChange(false);

		// Show success toast with ticket number
		if (refreshedTicket) {
			toast.success(
				`Inquiry ${refreshedTicket.referenceNumber} has been resolved`,
			);
		}

		// Notify parent to refresh status counts
		if (onStatusUpdate) {
			onStatusUpdate();
		}
	};

	const confirmReject = async (remarks: string) => {
		if (!ticketId) return;

		onStatusLoadingChange(true);
		const [err, _result] = await api.inquiries.updateStatus({
			id: ticketId,
			status: "rejected",
			closureRemarks: remarks,
		});

		if (err) {
			if (isDefinedError(err)) {
				toast.error(err.message);
			} else {
				toast.error("Failed to reject ticket");
			}
			onStatusLoadingChange(false);
			return;
		}

		// Refresh ticket data to get updated info
		const refreshedTicket = await refreshTicketData();
		onStatusLoadingChange(false);

		// Show success toast with ticket number
		if (refreshedTicket) {
			toast.success(
				`Inquiry ${refreshedTicket.referenceNumber} has been rejected`,
			);
		}

		// Notify parent to refresh status counts
		if (onStatusUpdate) {
			onStatusUpdate();
		}
	};

	return {
		handleSendMessage,
		handleUpdateStatus,
		handleAssignToMe,
		handleResolve,
		handleReject,
		confirmAssignToMe,
		confirmResolve,
		confirmReject,
		refreshTicketData,
	};
};
