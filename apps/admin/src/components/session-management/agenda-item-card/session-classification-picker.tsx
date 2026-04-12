import { Input } from "@repo/ui/components/input";
import { Search } from "@repo/ui/lib/lucide-react";
import { CLASSIFICATION_LABELS } from "@repo/ui/lib/session-ui";
import { useId, useMemo, useState } from "react";

interface SessionClassificationPickerProps {
	onSelect: (key: string) => void;
	onClose: () => void;
	excludeKeys?: string[];
}

export function SessionClassificationPicker({
	onSelect,
	onClose,
	excludeKeys = [],
}: SessionClassificationPickerProps) {
	const searchInputId = useId();
	const [query, setQuery] = useState("");

	const entries = useMemo(() => {
		const all = Object.entries(CLASSIFICATION_LABELS as Record<string, string>)
			.filter(([key]) => !excludeKeys.includes(key))
			.sort(([, a], [, b]) => a.localeCompare(b));
		if (!query.trim()) return all;
		const q = query.toLowerCase();
		return all.filter(([, label]) => label.toLowerCase().includes(q));
	}, [query, excludeKeys]);

	return (
		<div className="rounded-lg border border-blue-200 bg-white shadow-lg overflow-hidden">
			<div className="p-2 border-b border-gray-100">
				<div className="relative">
					<Search
						className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
						aria-hidden="true"
					/>
					<label htmlFor={searchInputId} className="sr-only">
						Search committee
					</label>
					<Input
						id={searchInputId}
						aria-label="Search committee"
						autoFocus
						placeholder="Search committee…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-8 h-7 text-xs"
					/>
				</div>
			</div>
			<div className="max-h-52 overflow-y-auto">
				{entries.length === 0 ? (
					<p className="text-xs text-gray-400 text-center py-4">No results</p>
				) : (
					entries.map(([key, label]) => (
						<button
							key={key}
							type="button"
							onClick={() => {
								onSelect(key);
								onClose();
							}}
							className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
						>
							{label}
						</button>
					))
				)}
			</div>
			<div className="p-2 border-t border-gray-100">
				<button
					type="button"
					onClick={onClose}
					className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
