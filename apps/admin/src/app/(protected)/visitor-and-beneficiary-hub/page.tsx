"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { BeneficiaryDatabase } from "@/components/visitor-beneficiary-hub/beneficiary-database";
import { VisitorLogs } from "@/components/visitor-beneficiary-hub/visitor-logs";

export default function VisitorAndBeneficiaryHub() {
	return (
		<div className="flex-1 flex flex-col h-full">
			{/* Page Header */}
			<div className="p-1 px-6 pb-4">
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900">
					Visitor & Beneficiary Hub
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Search, track, and manage all constituent interactions
				</p>
			</div>

			{/* Tabs */}
			<div className="px-6 flex-1">
				<Tabs defaultValue="visitor-log" className="w-full">
					<TabsList className="mb-6">
						<TabsTrigger value="visitor-log">Visitor Log</TabsTrigger>
						<TabsTrigger value="beneficiary-database">
							Beneficiary Database
						</TabsTrigger>
					</TabsList>

					<TabsContent value="beneficiary-database">
						<BeneficiaryDatabase />
					</TabsContent>

					<TabsContent value="visitor-log">
						<VisitorLogs />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
