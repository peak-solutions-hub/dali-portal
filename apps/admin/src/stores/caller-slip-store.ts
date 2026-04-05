"use client";

import type { CallerSlipStatus } from "@repo/shared";
import { create } from "zustand";

interface CallerSlipFilterState {
	search: string;
	statusFilter: CallerSlipStatus | "all";
	dateFrom: string | null;
	dateTo: string | null;
	page: number;
	limit: number;
}

interface CallerSlipFilterActions {
	setSearch: (search: string) => void;
	setStatusFilter: (status: CallerSlipStatus | "all") => void;
	setDateFrom: (dateFrom: string | null) => void;
	setDateTo: (dateTo: string | null) => void;
	setPage: (page: number) => void;
	setLimit: (limit: number) => void;
	clearFilters: () => void;
}

type CallerSlipStore = CallerSlipFilterState & CallerSlipFilterActions;

const DEFAULT_STATE: CallerSlipFilterState = {
	search: "",
	statusFilter: "all",
	dateFrom: null,
	dateTo: null,
	page: 1,
	limit: 10,
};

export const useCallerSlipStore = create<CallerSlipStore>((set) => ({
	...DEFAULT_STATE,
	setSearch: (search) => set({ search, page: 1 }),
	setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
	setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
	setDateTo: (dateTo) => set({ dateTo, page: 1 }),
	setPage: (page) => set({ page }),
	setLimit: (limit) => set({ limit, page: 1 }),
	clearFilters: () => set({ ...DEFAULT_STATE }),
}));
