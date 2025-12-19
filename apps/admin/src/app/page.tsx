import { Button } from "@repo/ui/components/button";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<div>Hello World</div>
			<Button className="text-amber-200" size="sm">
				Repo UI Button
			</Button>
		</div>
	);
}
