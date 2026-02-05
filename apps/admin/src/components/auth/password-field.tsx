"use client";

import { Input } from "@repo/ui/components/input";
import { Eye, EyeOff, Key } from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type PasswordFieldProps = {
	id?: string;
	label?: string;
	placeholder?: string;
	register?: UseFormRegisterReturn<string>; // react-hook-form register return (kept loose to avoid coupling)
	showIcon?: boolean;
	disabled?: boolean;
	error?: string | undefined;
	className?: string;
};

export function PasswordField({
	id,
	label = "Password",
	placeholder,
	register,
	showIcon = false,
	disabled = false,
	error,
	className,
}: PasswordFieldProps) {
	const [visible, setVisible] = useState(false);

	return (
		<div>
			<label className="block mb-2 text-sm font-semibold text-gray-700">
				{label}
			</label>

			<div className="relative">
				<Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<Input
					id={id}
					type={visible ? "text" : "password"}
					placeholder={placeholder}
					className={`h-12 pl-11 pr-10 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202] ${className ?? ""}`}
					disabled={disabled}
					{...(register ?? {})}
				/>

				{showIcon && (
					<button
						type="button"
						onClick={() => setVisible(!visible)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10 pointer-events-auto bg-transparent"
						aria-label={visible ? "Hide password" : "Show password"}
					>
						{visible ? (
							<EyeOff className="w-5 h-5" />
						) : (
							<Eye className="w-5 h-5" />
						)}
					</button>
				)}
			</div>

			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}

export default PasswordField;
