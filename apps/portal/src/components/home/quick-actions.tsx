import { ClipboardList, MessageSquarePlus } from "@repo/ui/lib/lucide-react";
import Link from "next/link";

export function QuickActions() {
	return (
		<div className="bg-[#a60202]">
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="flex items-center justify-start gap-8">
					{/* Citizen Services Label */}
					<div className="hidden lg:flex items-center gap-3">
						<div className="w-1 h-12 bg-white/30 rounded-full" />
						<span className="text-white font-semibold uppercase tracking-wider text-sm">
							Citizen Services
						</span>
					</div>

					{/* Quick Links */}
					<div className="flex items-center gap-4 flex-1 lg:flex-initial justify-center">
						{/* Make an Inquiry */}
						<Link
							href="/inquiries?tab=make"
							className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 rounded-md transition-all duration-200"
						>
							<MessageSquarePlus className="w-5 h-5 text-white" />
							<span className="text-white font-semibold">Make an Inquiry</span>
						</Link>

						{/* Track an Inquiry */}
						<Link
							href="/inquiries?tab=track"
							className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 rounded-md transition-all duration-200"
						>
							<ClipboardList className="w-5 h-5 text-white" />
							<span className="text-white font-semibold">Track an Inquiry</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
