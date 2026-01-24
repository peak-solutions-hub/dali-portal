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
}

export const createTicketHelpers = (
	ticketId: string | null,
	message: string,
	callbacks: TicketHelperCallbacks,
) => {
	const {
		onTicketUpdate,
		onMessageClear,
		onLoadingChange,
		onStatusLoadingChange,
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
		if (!message.trim() || !ticketId) return;

		onLoadingChange(true);
		const [err, _result] = await api.inquiries.sendMessage({
			ticketId,
			content: message,
			senderName: "Staff Member", // TODO: Get from auth context
			senderType: "staff",
		});

		if (err) {
			if (isDefinedError(err)) {
				alert(`Error: ${err.message}`);
			} else {
				alert("Failed to send message");
			}
			onLoadingChange(false);
			return;
		}

		// Refresh ticket data
		await refreshTicketData();
		onMessageClear();
		onLoadingChange(false);
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
	};

	const handleAssignToMe = () => {
		// TODO: Implement assign to me with user context
		handleUpdateStatus("open");
	};

	const handleResolve = () => {
		const remarks = prompt("Please provide closure remarks:");
		if (remarks) {
			handleUpdateStatus("resolved", remarks);
		}
	};

	const handleReject = () => {
		const remarks = prompt("Please provide reason for rejection:");
		if (remarks) {
			handleUpdateStatus("rejected", remarks);
		}
	};

	return {
		handleSendMessage,
		handleUpdateStatus,
		handleAssignToMe,
		handleResolve,
		handleReject,
		refreshTicketData,
	};
};
