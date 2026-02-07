export function AuthBackground() {
	return (
		<div className="fixed inset-0 overflow-hidden bg-[#4a0000]">
			<div className="absolute inset-0 bg-[linear-gradient(90deg,_#5c0000_0%,_#ce1126_50%,_#5c0000_100%)]" />

			<div className="absolute inset-0">
				<div className="absolute inset-y-0 left-0 w-[40%] bg-[linear-gradient(90deg,_rgba(206,17,38,0.4)_0%,_transparent_100%)] mix-blend-screen" />
				<div className="absolute inset-y-0 right-0 w-[40%] bg-[linear-gradient(-90deg,_rgba(206,17,38,0.4)_0%,_transparent_100%)] mix-blend-screen" />
			</div>
			<div className="absolute inset-0 bg-[linear-gradient(110deg,_transparent_20%,_rgba(255,255,255,0.1)_45%,_rgba(255,255,255,0.1)_55%,_transparent_80%)] mix-blend-overlay" />

			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-[#ff1a1a] opacity-30 rounded-full blur-[100px] mix-blend-screen" />
				<div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[#ff1a1a] opacity-30 rounded-full blur-[100px] mix-blend-screen" />

				<div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ce1126] opacity-40 rounded-full blur-[120px] mix-blend-plus-lighter" />
			</div>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(18,0,0,0.8)_120%)]" />
		</div>
	);
}
