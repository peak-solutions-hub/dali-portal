import { FileText } from "@repo/ui/lib/lucide-react";

interface SessionAddTextButtonProps {
	onClick: () => void;
}

export function SessionAddTextButton({ onClick }: SessionAddTextButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
		>
			<FileText className="h-3.5 w-3.5" />
			<span>Add Custom Text</span>
		</button>
	);
}
