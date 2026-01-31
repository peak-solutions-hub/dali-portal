import { Card } from "@repo/ui/components/card";
import { AuthBackground } from "./auth-background";

interface AuthCardProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Wrapper component for authentication pages
 * Provides consistent layout with background and card styling
 */
export function AuthCard({ children, className = "" }: AuthCardProps) {
	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			<AuthBackground />
			<Card
				className={`w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20 ${className}`}
			>
				{children}
			</Card>
		</div>
	);
}
