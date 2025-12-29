import { isDefinedError } from "@orpc/client";
import { api } from "@/lib/api.client";

export default async function Inquiries() {
	// just an example for now
	const [error, data] = await api.inquiries.getList({ limit: 12 });

	// sample error handling
	if (isDefinedError(error)) {
		return <div>Error: {error.message}</div>;
	} else if (error) {
		return <div>{error.message}</div>;
	}

	return (
		<div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
			<div className="text-center">
				{data.map((inquiry) => (
					<div key={inquiry.id}>{inquiry.subject}</div>
				))}
				<h1 className="text-4xl font-bold text-gray-900"></h1>
			</div>
		</div>
	);
}
