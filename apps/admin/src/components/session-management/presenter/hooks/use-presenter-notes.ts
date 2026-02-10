"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function usePresenterNotes(
	sessionNumber: string | undefined,
	slideId: string,
) {
	const notesLimit = 5000;
	const [notes, setNotes] = useState("");

	const notesStorageKey = useMemo(
		() => `dali-presenter-notes-${sessionNumber ?? "unknown"}`,
		[sessionNumber],
	);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(notesStorageKey);
			const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
			setNotes((parsed[slideId] ?? "").slice(0, notesLimit));
		} catch {
			setNotes("");
		}
	}, [notesStorageKey, slideId, notesLimit]);

	const saveNotes = useCallback(
		(value: string) => {
			setNotes(value);
			try {
				const raw = localStorage.getItem(notesStorageKey);
				const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
				parsed[slideId] = value;
				localStorage.setItem(notesStorageKey, JSON.stringify(parsed));
			} catch {
				// ignore
			}
		},
		[notesStorageKey, slideId],
	);

	return { notes, saveNotes, notesLimit };
}
