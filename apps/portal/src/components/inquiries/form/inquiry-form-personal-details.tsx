"use client";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Mail, User } from "@repo/ui/lib/lucide-react";
import type { Control } from "react-hook-form";
import type { SubmitInquiryFormValues } from "./schema";

interface InquiryFormPersonalDetailsProps {
	control: Control<SubmitInquiryFormValues>;
}

export function InquiryFormPersonalDetails({
	control,
}: InquiryFormPersonalDetailsProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
				<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
					1
				</span>
				Personal Details
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<FormField
					control={control}
					name="citizenName"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-medium">
								Full Name <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<div className="relative group">
									<User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
									<Input
										className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
										placeholder="e.g. Juan Dela Cruz"
										{...field}
									/>
								</div>
							</FormControl>
							<FormDescription className="text-xs text-gray-500 mt-1.5 ml-1 select-none opacity-0">
								This is a placeholder to align the height.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="citizenEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-medium">
								Email Address <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<div className="relative group">
									<Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
									<Input
										type="email"
										className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
										placeholder="e.g. juan@example.com"
										{...field}
									/>
								</div>
							</FormControl>
							<FormDescription className="text-xs text-gray-500 mt-1.5 ml-1">
								We'll send the ticket reference and updates here.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
