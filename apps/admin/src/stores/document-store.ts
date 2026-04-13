"use client";

import type {
	DocumentListTab,
	DocumentSortBy,
	DocumentTypeEnumType,
	SortOrder,
	StatusTypeEnumType,
} from "@repo/shared";
import { create } from "zustand";
import { getDocumentTypesForTab } from "@/utils/document-helpers";

interface DocumentFilterState {
	activeTab: DocumentListTab;
	search: string;
	statusFilter: StatusTypeEnumType | "all";
	typeFilter: DocumentTypeEnumType | "all";
	dateFrom: string | null;
	dateTo: string | null;
	page: number;
	limit: number;
	sortBy: DocumentSortBy;
	sortOrder: SortOrder;
	/** Selected invitation document IDs for batch caller slip generation */
	selectedInvitationIds: string[];
}

interface DocumentFilterActions {
	setActiveTab: (tab: DocumentListTab) => void;
	setSearch: (search: string) => void;
	setStatusFilter: (status: StatusTypeEnumType | "all") => void;
	setTypeFilter: (type: DocumentTypeEnumType | "all") => void;
	setDateFrom: (date: string | null) => void;
	setDateTo: (date: string | null) => void;
	setPage: (page: number) => void;
	setLimit: (limit: number) => void;
	setSort: (sortBy: DocumentSortBy, sortOrder: SortOrder) => void;
	clearFilters: () => void;
	toggleInvitationSelection: (id: string) => void;
	setSelectedInvitationIds: (ids: string[]) => void;
	clearInvitationSelection: () => void;
}

type DocumentStore = DocumentFilterState & DocumentFilterActions;

const DEFAULT_STATE: DocumentFilterState = {
	activeTab: "all",
	search: "",
	statusFilter: "all",
	typeFilter: "all",
	dateFrom: null,
	dateTo: null,
	page: 1,
	limit: 10,
	sortBy: "receivedAt",
	sortOrder: "desc",
	selectedInvitationIds: [],
};

export const useDocumentStore = create<DocumentStore>((set) => ({
	...DEFAULT_STATE,
	setActiveTab: (activeTab) =>
		set((state) => {
			const availableTypes = getDocumentTypesForTab(activeTab);
			const hasInvalidTypeSelection =
				state.typeFilter !== "all" &&
				!availableTypes.includes(state.typeFilter);

			return {
				activeTab,
				typeFilter: hasInvalidTypeSelection ? "all" : state.typeFilter,
				page: 1,
				selectedInvitationIds: [],
			};
		}),
	setSearch: (search) => set({ search, page: 1 }),
	setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
	setTypeFilter: (typeFilter) => set({ typeFilter, page: 1 }),
	setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
	setDateTo: (dateTo) => set({ dateTo, page: 1 }),
	setPage: (page) => set({ page }),
	setLimit: (limit) => set({ limit, page: 1 }),
	setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder, page: 1 }),
	clearFilters: () =>
		set({
			search: "",
			statusFilter: "all",
			typeFilter: "all",
			dateFrom: null,
			dateTo: null,
			page: 1,
			sortBy: "receivedAt",
			sortOrder: "desc",
		}),
	toggleInvitationSelection: (id) =>
		set((state) => ({
			selectedInvitationIds: state.selectedInvitationIds.includes(id)
				? state.selectedInvitationIds.filter((i) => i !== id)
				: [...state.selectedInvitationIds, id],
		})),
	setSelectedInvitationIds: (ids) => set({ selectedInvitationIds: ids }),
	clearInvitationSelection: () => set({ selectedInvitationIds: [] }),
}));
