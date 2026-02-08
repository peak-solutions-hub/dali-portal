import { Button } from "@repo/ui/components/button";
import { Send } from "@repo/ui/lib/lucide-react";

interface InquirySubmitButtonProps {
	isSubmitting: boolean;
	hasErrors?: boolean;
	label?: string;
}

export function InquirySubmitButton({
	isSubmitting,
	hasErrors = false,
	label = "Submit Inquiry",
}: InquirySubmitButtonProps) {
	const isDisabled = isSubmitting || hasErrors;

	return (
		<div className="flex justify-end pt-2">
			<Button
				type="submit"
				className="w-full sm:w-auto min-w-50 h-14 bg-[#a60202] hover:bg-[#8b0202] text-white rounded-xl text-base font-bold shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
				disabled={isDisabled}
			>
				{isSubmitting ? (
					<span className="flex items-center gap-2">
						<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						Submitting
					</span>
				) : (
					<span className="flex items-center gap-2">
						{label}
						<Send className="w-4 h-4" />
					</span>
				)}
			</Button>
		</div>
	);
}
