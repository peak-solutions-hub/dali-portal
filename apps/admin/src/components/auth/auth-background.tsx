export function AuthBackground() {
	return (
		<>
			{/* Background Gradient */}
			<div className="absolute inset-0 bg-linear-to-br from-red-600/95 via-[#a60202]/90 to-red-950/95" />

			{/* Decorative Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-64 h-64 bg-[#FFC107]/10 rounded-full blur-3xl" />
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
			</div>
		</>
	);
}
