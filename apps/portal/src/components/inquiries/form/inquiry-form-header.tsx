import { cn } from "@repo/ui/lib/utils";

interface InquiryFormHeaderProps {
	className?: string;
	children: React.ReactNode;
}

export function InquiryFormHeader({
	className,
	children,
}: InquiryFormHeaderProps) {
	return (
		<div className={cn("bg-[#a60202] py-3 px-6 sm:px-8", className)}>
			<p className="text-white/90 text-sm font-medium">{children}</p>
		</div>
	);
}
