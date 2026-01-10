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

const FOCUSABLE_ELEMENTS_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook to trap focus within a container (e.g., modal)
 * Implements accessibility best practices:
 * - Traps Tab/Shift+Tab within the container
 * - Closes on Escape key
 * - Restores focus to trigger element on cleanup
 *
 * @param config - Configuration object for the focus trap
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 *
 * useFocusTrap({
 *   isActive: isModalOpen,
 *   containerRef: modalRef,
 *   triggerRef: buttonRef,
 *   onEscape: () => setIsModalOpen(false),
 * });
 * ```
 */
export function useFocusTrap(config: FocusTrapConfig): void {
	const { isActive, containerRef, triggerRef, onEscape } = config;

	useEffect(() => {
		if (!isActive) return;

		let previousActiveElement: Element | null = null;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Handle Escape key
			if (e.key === "Escape" && onEscape) {
				e.preventDefault();
				onEscape();
			}

			// Handle Tab key for focus trapping
			if (e.key === "Tab") {
				const container = containerRef.current;
				if (!container) return;

				const focusableElements = container.querySelectorAll<HTMLElement>(
					FOCUSABLE_ELEMENTS_SELECTOR,
				);
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (e.shiftKey) {
					// Shift+Tab: if on first element, go to last
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement?.focus();
					}
				} else {
					// Tab: if on last element, go to first
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement?.focus();
					}
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
				FOCUSABLE_ELEMENTS_SELECTOR,
			);
			const firstElement = focusableElements[0];
			if (focusableElements.length > 0 && firstElement) {
				firstElement.focus();
			}
		}, 0);

		// Cleanup function
		return () => {
			document.removeEventListener("keydown", handleKeyDown);

			// Restore focus to trigger element or previously focused element
			if (triggerRef?.current) {
				triggerRef.current.focus();
			} else if (previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		};
	}, [isActive, containerRef, triggerRef, onEscape]);
}
