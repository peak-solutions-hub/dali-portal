"use client";

import { generateOperationKey } from "@orpc/tanstack-query";
import type {
	CompleteCallerSlipInput,
	GenerateCallerSlipInput,
	RecordDecisionInput,
} from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, orpc } from "@/lib/api.client";

export function useGenerateCallerSlip() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: GenerateCallerSlipInput) => {
			const [error, data] = await api.callerSlips.generate(input);
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: generateOperationKey(["callerSlips", "getList"]),
			});
			// Also invalidate document list since assigned invitations change
			queryClient.invalidateQueries({
				queryKey: generateOperationKey(["documents", "getList"]),
			});
		},
	});
}

export function useRecordDecision(slipId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: RecordDecisionInput) => {
			const [error, data] = await api.callerSlips.recordDecision(input);
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.callerSlips.getById.queryOptions({
					input: { id: slipId },
				}).queryKey,
			});
		},
	});
}

export function useCompleteCallerSlip() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CompleteCallerSlipInput) => {
			const [error, data] = await api.callerSlips.complete(input);
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: generateOperationKey(["callerSlips", "getList"]),
			});
		},
	});
}
