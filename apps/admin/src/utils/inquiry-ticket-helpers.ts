import { isDefinedError } from "@orpc/client";
import type {
	InquiryStatus,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
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

export const createTicketHelpers = (
	ticketId: string | null,
	message: string,
	files: File[],
	uploadFiles: () => Promise<string[]>,
	callbacks: TicketHelperCallbacks,
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
					alert(`Error: ${err.message}`);
				} else {
					alert("Failed to send message");
				}
				onLoadingChange(false);
				onUploadProgress(0);
				return;
			}

			// Refresh ticket data
			await refreshTicketData();
			onMessageClear();
			onFilesClear();
		} catch (e) {
			console.error(e);
			alert("An error occurred.");
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
				alert(`Error: ${err}`);
			} else {
				alert("Failed to update status");
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
		// TODO: Implement assign to me with user context
		await handleUpdateStatus("open");
	};

	const confirmResolve = async (remarks: string) => {
		await handleUpdateStatus("resolved", remarks);
	};

	const confirmReject = async (remarks: string) => {
		await handleUpdateStatus("rejected", remarks);
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
