"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { parseDisplayDateToInput } from "@/utils/date-utils";
import { formatTimeToInput } from "@/utils/time-utils";

interface BookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedTime: string;
	selectedDate: string;
}

export function BookingModal({
	isOpen,
	onClose,
	selectedTime,
	selectedDate,
}: BookingModalProps) {
	const [room, setRoom] = useState("Conference Room A");
	const [date, setDate] = useState("");
	const [attendees, setAttendees] = useState("10");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [purpose, setPurpose] = useState("");
	const [attachment, setAttachment] = useState<File | null>(null);
	const [equipment, setEquipment] = useState({
		projector: false,
		soundSystem: false,
		whiteboard: false,
		videoConference: false,
	});

	// Parse selected time and date when modal opens
	useEffect(() => {
		if (isOpen) {
			const parsedDate = parseDisplayDateToInput(selectedDate);
			setDate(parsedDate);

			if (selectedTime.includes(" - ")) {
				const [start, end] = selectedTime.split(" - ");
				if (start && end) {
					setStartTime(formatTimeToInput(start.trim()));
					setEndTime(formatTimeToInput(end.trim()));
				}
			}
		}
	}, [isOpen, selectedDate, selectedTime]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Booking submitted:", {
			room,
			date,
			attendees,
			startTime,
			endTime,
			purpose,
			attachment: attachment?.name,
			equipment,
		});
		onClose();
	};

	const handleCheckboxChange = (key: keyof typeof equipment) => {
		setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setAttachment(file);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							Request Room Booking
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Submit a room booking request
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-md transition-colors"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
					{/* Room */}
					<div>
						<label
							htmlFor="room"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Room
						</label>
						<input
							id="room"
							type="text"
							value={room}
							onChange={(e) => setRoom(e.target.value)}
							className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							readOnly
						/>
					</div>

					{/* Date and Expected Attendees */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="date"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								Date <span className="text-red-500">*</span>
							</label>
							<input
								id="date"
								type="text"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="w-full px-4 py-3 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="MM/DD/YYYY"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="attendees"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								Expected Attendees
							</label>
							<input
								id="attendees"
								type="number"
								value={attendees}
								onChange={(e) => setAttendees(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								min="1"
							/>
						</div>
					</div>

					{/* Start Time and End Time */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="startTime"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								Start Time <span className="text-red-500">*</span>
							</label>
							<input
								id="startTime"
								type="text"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="08:00 AM"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="endTime"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								End Time <span className="text-red-500">*</span>
							</label>
							<input
								id="endTime"
								type="text"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="09:00 AM"
								required
							/>
						</div>
					</div>

					{/* Purpose */}
					<div>
						<label
							htmlFor="purpose"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Purpose <span className="text-red-500">*</span>
						</label>
						<textarea
							id="purpose"
							value={purpose}
							onChange={(e) => setPurpose(e.target.value)}
							className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							placeholder="Describe the purpose of the booking..."
							rows={4}
							required
						/>
					</div>

					{/* Equipment Needed */}
					<div>
						<label className="block text-sm font-semibold text-gray-900 mb-3">
							Equipment Needed
						</label>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Checkbox
									id="projector"
									checked={equipment.projector}
									onCheckedChange={() => handleCheckboxChange("projector")}
								/>
								<label
									htmlFor="projector"
									className="text-sm text-gray-900 cursor-pointer select-none"
								>
									Projector
								</label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="soundSystem"
									checked={equipment.soundSystem}
									onCheckedChange={() => handleCheckboxChange("soundSystem")}
								/>
								<label
									htmlFor="soundSystem"
									className="text-sm text-gray-900 cursor-pointer select-none"
								>
									Sound System
								</label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="whiteboard"
									checked={equipment.whiteboard}
									onCheckedChange={() => handleCheckboxChange("whiteboard")}
								/>
								<label
									htmlFor="whiteboard"
									className="text-sm text-gray-900 cursor-pointer select-none"
								>
									Whiteboard
								</label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="videoConference"
									checked={equipment.videoConference}
									onCheckedChange={() =>
										handleCheckboxChange("videoConference")
									}
								/>
								<label
									htmlFor="videoConference"
									className="text-sm text-gray-900 cursor-pointer select-none"
								>
									Video Conference Setup
								</label>
							</div>
						</div>
					</div>

					{/* Attachment */}
					<div>
						<label
							htmlFor="attachment"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Attach Letter (Optional)
						</label>
						<input
							id="attachment"
							type="file"
							accept=".jpg,.jpeg,.pdf"
							onChange={handleFileChange}
							className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>
						{attachment && (
							<p className="text-sm text-gray-600 mt-2">
								Selected: {attachment.name}
							</p>
						)}
						<p className="text-xs text-gray-500 mt-1">
							Accepted formats: JPG, PDF
						</p>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							Submit Request
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
