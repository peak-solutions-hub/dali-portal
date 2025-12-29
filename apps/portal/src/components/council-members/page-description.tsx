export function PageDescription() {
	return (
		<section className="relative h-100 bg-cover bg-center text-white overflow-hidden">
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{
					backgroundImage: "url(/legislative-building.png)",
				}}
			/>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage:
						"linear-gradient(90deg, rgba(166, 2, 2, 0.2) 0%, rgba(166, 2, 2, 0.2) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.7) 100%)",
				}}
			/>
			<div className="relative z-10 h-full flex items-center justify-center px-4">
				<div className="text-center max-w-4xl mx-auto">
					<h1 className="text-4xl sm:text-5xl lg:text-[56px] lg:leading-16 mb-5 font-playfair-display">
						Council Members
					</h1>
					<p className="text-lg sm:text-xl lg:text-[20px] lg:leading-7.5 text-white/90 max-w-3xl mx-auto">
						Meet the dedicated public servants of the Sangguniang Panlungsod ng
						Iloilo, working together to legislate for the betterment of our city
						and its constituents.
					</p>
				</div>
			</div>
		</section>
	);
}
