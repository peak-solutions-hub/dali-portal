"use client";

import { INQUIRY_CATEGORY_VALUES } from "@repo/shared";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import type { Control } from "react-hook-form";
import type { SubmitInquiryFormValues } from "./schema";

interface InquiryFormDetailsProps {
	control: Control<SubmitInquiryFormValues>;
}

export function InquiryFormDetails({ control }: InquiryFormDetailsProps) {
	const formatCategoryLabel = (category: string) => {
		return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
	};

	return (
		<div className="space-y-6 pt-2">
			<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
				<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
					2
				</span>
				Inquiry Details
			</div>

			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-gray-700 font-medium">
									Category <span className="text-red-500">*</span>
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl">
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
									</FormControl>
									<SelectContent className="rounded-xl border-gray-100 shadow-lg">
										{INQUIRY_CATEGORY_VALUES.map((category) => (
											<SelectItem
												key={category}
												value={category}
												className="py-3 px-4 focus:bg-red-50 focus:text-[#a60202] cursor-pointer"
											>
												{formatCategoryLabel(category)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="subject"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-gray-700 font-medium">
									Subject <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input
										className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
										placeholder="Brief summary (e.g. Schedule Request)"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={control}
					name="message"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-medium">
								Message <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Please describe your inquiry, concern, or request in detail..."
									className="min-h-40 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl resize-y p-4 leading-relaxed"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
