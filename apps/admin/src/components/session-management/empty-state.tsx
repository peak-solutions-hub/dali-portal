"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { FileText, Plus } from "@repo/ui/lib/lucide-react";

interface EmptyStateProps {
	onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
	return (
		<Card className="p-12 text-center">
			<FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				No Session Selected
			</h3>
			<p className="text-gray-600 mb-4">
				Select an existing session or create a new one to start building the
				agenda
			</p>
			<Button onClick={onCreateNew} className="cursor-pointer">
				<Plus className="h-4 w-4 mr-2" />
				Create New Session
			</Button>
		</Card>
	);
}
