"use client";

import { type RefObject, useEffect } from "react";

interface FocusTrapConfig {
	/**
	 * Whether the focus trap is active
	 */
	isActive: boolean;
	/**
	 * Ref to the container element where focus should be trapped
	 */
	containerRef: RefObject<HTMLElement | null>;
	/**
	 * Ref to the trigger element that opened the modal (to restore focus on close)
	 */
	triggerRef?: RefObject<HTMLElement | null>;
	/**
	 * Callback when Escape key is pressed
	 */
	onEscape?: () => void;
}

/**
 * Hook to trap focus within a container (e.g., modal)
 * Implements accessibility best practices:
 * - Traps Tab/Shift+Tab within the container
 * - Closes on Escape key
 * - Restores focus to trigger element on cleanup
 *
 * @param config - Configuration object for the focus trap
 */
export function useFocusTrap(config: FocusTrapConfig): void {
	const { isActive, containerRef, triggerRef, onEscape } = config;

	useEffect(() => {
		if (!isActive) return;

		let previousActiveElement: Element | null = null;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Handle Escape key
			if (e.key === "Escape" && onEscape) {
				onEscape();
				return;
			}

			// Handle Tab key for focus trapping
			if (e.key === "Tab") {
				const container = containerRef.current;
				if (!container) return;

				const focusableElements = container.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);

				if (focusableElements.length === 0) return;

				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				// Trap focus within the container
				if (!e.shiftKey && document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				} else if (e.shiftKey && document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				}
			}
		};

		// Store the previously focused element
		previousActiveElement = document.activeElement;

		// Add keyboard event listener
		document.addEventListener("keydown", handleKeyDown);

		// Focus the first focusable element in the container
		setTimeout(() => {
			const container = containerRef.current;
			if (!container) return;

			const focusableElements = container.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);

			if (focusableElements.length > 0) {
				focusableElements[0]?.focus();
			}
		}, 0);

		// Cleanup function
		return () => {
			document.removeEventListener("keydown", handleKeyDown);

			// Restore focus to trigger element or previous active element
			if (
				triggerRef?.current &&
				typeof triggerRef.current.focus === "function"
			) {
				triggerRef.current.focus();
			} else if (
				previousActiveElement &&
				(previousActiveElement as HTMLElement).focus
			) {
				(previousActiveElement as HTMLElement).focus();
			}
		};
	}, [isActive, containerRef, triggerRef, onEscape]);
}
