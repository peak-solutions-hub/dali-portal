"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { MOCK_VISITOR_LOGS } from "./visitor-logs";

const INITIAL_BENEFICIARY_FORM_STATE = {
	familyName: "",
	firstName: "",
	middleName: "",
	municipality: "",
	barangay: "",
	age: "",
	phoneNumber: "",
	email: "",
	purpose: "",
};

const ILOILO_LOCALITIES = [
	"Ajuy",
	"Alimodian",
	"Anilao",
	"Badiangan",
	"Balasan",
	"Banate",
	"Barotac Nuevo",
	"Barotac Viejo",
	"Batad",
	"Bingawan",
	"Cabatuan",
	"Calinog",
	"Carles",
	"Concepcion",
	"Dingle",
	"Dueñas",
	"Dumangas",
	"Estancia",
	"Guimbal",
	"Igbaras",
	"Janiuay",
	"Lambunao",
	"Leganes",
	"Lemery",
	"Leon",
	"Maasin",
	"Miagao",
	"Mina",
	"New Lucena",
	"Oton",
	"Pavia",
	"Pototan",
	"San Dionisio",
	"San Enrique",
	"San Joaquin",
	"San Miguel",
	"San Rafael",
	"Santa Barbara",
	"Sara",
	"Tigbauan",
	"Tubungan",
	"Zarraga",
];

const MOCK_BENEFICIARIES = MOCK_VISITOR_LOGS.filter((log) =>
	log.purpose.toLowerCase().includes("assistance"),
).map((log) => ({
	id: `${log.id}-beneficiary`,
	name: log.constituentName,
	municipality: log.affiliation ?? "Iloilo City",
	barangay: log.affiliation ?? "--",
	age: "45",
	phoneNumber: "0917 123 4567",
	email: "sample@example.com",
	purpose: log.purpose,
}));

export function BeneficiaryDatabase() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [formState, setFormState] = useState(INITIAL_BENEFICIARY_FORM_STATE);

	const handleInputChange = (field: keyof typeof formState, value: string) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormState(INITIAL_BENEFICIARY_FORM_STATE);
		setIsDialogOpen(false);
	};

	const totalBeneficiaries = MOCK_BENEFICIARIES.length;

	return (
		<div className="space-y-6">
			<Card className="w-fit px-6 py-4 border border-gray-200 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50">
						<FileText className="h-6 w-6 text-sky-600" />
					</div>
					<div>
						<p className="text-sm text-gray-500">Total Beneficiaries</p>
						<p className="text-2xl font-semibold text-gray-900">
							{totalBeneficiaries}
						</p>
					</div>
				</div>
			</Card>

			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<p className="text-sm text-gray-500">
					Only visitors who received assistance or beneficiary services appear
					in this list.
				</p>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
						<Plus className="h-4 w-4" />
						Add Beneficiary
					</Button>
					<DialogContent className="sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Add Beneficiary</DialogTitle>
							<DialogDescription>
								Fill in beneficiary details for tracking assistance cases.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div>
									<label className="text-sm font-medium text-gray-700">
										Family Name
									</label>
									<Input
										value={formState.familyName}
										onChange={(e) =>
											handleInputChange("familyName", e.target.value)
										}
										placeholder="Enter family name"
										required
									/>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										First Name
									</label>
									<Input
										value={formState.firstName}
										onChange={(e) =>
											handleInputChange("firstName", e.target.value)
										}
										placeholder="Enter first name"
										required
									/>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Middle Name
									</label>
									<Input
										value={formState.middleName}
										onChange={(e) =>
											handleInputChange("middleName", e.target.value)
										}
										placeholder="Enter middle name"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium text-gray-700">
										Municipality / City
									</label>
									<Select
										value={formState.municipality}
										onValueChange={(value) =>
											handleInputChange("municipality", value)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select municipality" />
										</SelectTrigger>
										<SelectContent className="max-h-60 overflow-y-auto overscroll-contain">
											{ILOILO_LOCALITIES.map((locale) => (
												<SelectItem
													key={`beneficiary-${locale}`}
													value={locale}
												>
													{locale}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Barangay
									</label>
									<Input
										value={formState.barangay}
										onChange={(e) =>
											handleInputChange("barangay", e.target.value)
										}
										placeholder="Enter barangay"
										required
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div>
									<label className="text-sm font-medium text-gray-700">
										Age
									</label>
									<Input
										type="number"
										min="0"
										value={formState.age}
										onChange={(e) => handleInputChange("age", e.target.value)}
										placeholder="Age"
										required
									/>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Phone Number
									</label>
									<Input
										type="tel"
										value={formState.phoneNumber}
										onChange={(e) =>
											handleInputChange("phoneNumber", e.target.value)
										}
										placeholder="e.g. 0917 123 4567"
										required
									/>
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Email{" "}
										<span className="font-normal text-gray-500">
											(optional)
										</span>
									</label>
									<Input
										type="email"
										value={formState.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										placeholder="name@example.com"
									/>
								</div>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Purpose of Assistance
								</label>
								<Input
									value={formState.purpose}
									onChange={(e) => handleInputChange("purpose", e.target.value)}
									placeholder="Describe assistance needed"
									required
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="ghost"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit">Save Beneficiary</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-lg border border-gray-200 overflow-hidden">
				<Table>
					<TableHeader className="bg-gray-50">
						<TableRow className="border-b border-gray-200">
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-48">
								Name
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Municipality
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Barangay
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-24">
								Age
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Phone
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-48">
								Email
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 min-w-56">
								Purpose
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MOCK_BENEFICIARIES.map((beneficiary, index) => (
							<TableRow
								key={beneficiary.id}
								className={`border-b border-gray-200 ${
									index % 2 === 1 ? "bg-gray-50/30" : "bg-white"
								}`}
							>
								<TableCell className="px-6 py-4 text-sm font-medium text-gray-900">
									{beneficiary.name}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.municipality}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.barangay}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.age}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.phoneNumber}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.email}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{beneficiary.purpose}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
