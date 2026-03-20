/**
 * Global CSS styles for portal Quill content display.
 * Supports both legacy nested format and new flat format with ql-ui markers.
 */
export function SessionDetailStyles() {
	return (
		<style>{`
			/* ── Block mode ──────────────────────────────────────────────── */
			.portal-content {
				font-size: 0.875rem;
				line-height: 1.6;
				color: #1f2937;
				overflow-wrap: break-word;
				word-break: normal;
				white-space: pre-wrap;
				counter-reset: list-0 list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8;
			}
			@media (max-width: 639px) {
				.portal-content { font-size: 0.75rem; }
			}
			.portal-content p { margin: 0; padding: 0; min-height: 1.6em; }
			.portal-content p.ql-indent-1,
			.portal-content .ql-indent-1:not(li) { padding-left: 3em; }
			.portal-content p.ql-indent-2,
			.portal-content .ql-indent-2:not(li) { padding-left: 6em; }
			.portal-content p.ql-indent-3,
			.portal-content .ql-indent-3:not(li) { padding-left: 9em; }
			.portal-content p.ql-indent-4,
			.portal-content .ql-indent-4:not(li) { padding-left: 12em; }
			.portal-content p.ql-indent-5,
			.portal-content .ql-indent-5:not(li) { padding-left: 15em; }
			.portal-content ul, .portal-content ol { margin: 0.35em 0; padding-left: 1.75em; list-style-position: outside; }
			.portal-content ul { list-style-type: disc; }
			.portal-content ol { list-style-type: decimal; }
			.portal-content li { display: list-item; margin: 0.15em 0; padding-left: 0.25em; }
			/* New flat format (has data-list): hide native markers, rely on ql-ui::before */
			.portal-content li[data-list] { list-style-type: none; padding-left: 1.5em; position: relative; }
			.portal-content li[data-list] > .ql-ui:before { display: inline-block; margin-left: -1.5em; margin-right: 0.3em; text-align: right; white-space: nowrap; width: 1.2em; }
			.portal-content li[data-list=bullet] > .ql-ui:before { content: '\\2022'; }
			.portal-content li[data-list=ordered] > .ql-ui:before { content: counter(list-0, decimal) '. '; }
			.portal-content li[data-list=ordered] { counter-increment: list-0; counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8; }
			/* Ordered list style overrides for legacy format (from ql-list-style-* ClassAttributor) */
			.portal-content li.ql-list-style-decimal:not([data-list])     { list-style-type: decimal; }
			.portal-content li.ql-list-style-lower-alpha:not([data-list]) { list-style-type: lower-alpha; }
			.portal-content li.ql-list-style-lower-roman:not([data-list]) { list-style-type: lower-roman; }
			.portal-content li.ql-list-style-upper-alpha:not([data-list]) { list-style-type: upper-alpha; }
			.portal-content li.ql-list-style-upper-roman:not([data-list]) { list-style-type: upper-roman; }
			/* ql-list-style overrides for new format (ql-ui::before markers) */
			.portal-content li[data-list=ordered].ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-0, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-list-style-lower-roman > .ql-ui:before { content: counter(list-0, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-0, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-list-style-upper-roman > .ql-ui:before { content: counter(list-0, upper-roman) '. '; }
			/* List indent padding (all formats) */
			.portal-content li.ql-indent-1 { padding-left: 4.5em; }
			.portal-content li.ql-indent-2 { padding-left: 7.5em; }
			.portal-content li.ql-indent-3 { padding-left: 10.5em; }
			.portal-content li.ql-indent-4 { padding-left: 13.5em; }
			.portal-content li.ql-indent-5 { padding-left: 16.5em; }
			.portal-content li.ql-indent-6 { padding-left: 19.5em; }
			.portal-content li.ql-indent-7 { padding-left: 22.5em; }
			.portal-content li.ql-indent-8 { padding-left: 25.5em; }
			/* Legacy format bullet cycling (not for flat format with ql-ui markers) */
			.portal-content li.ql-indent-1:not([data-list]) { list-style-type: circle; }
			.portal-content li.ql-indent-2:not([data-list]) { list-style-type: square; }
			.portal-content li.ql-indent-3:not([data-list]) { list-style-type: disc; }
			.portal-content li.ql-indent-4:not([data-list]) { list-style-type: circle; }
			.portal-content li.ql-indent-5:not([data-list]) { list-style-type: square; }
			.portal-content li.ql-indent-6:not([data-list]) { list-style-type: disc; }
			.portal-content li.ql-indent-7:not([data-list]) { list-style-type: circle; }
			.portal-content li.ql-indent-8:not([data-list]) { list-style-type: square; }
			/* New format indent counter overrides */
			.portal-content li[data-list=ordered].ql-indent-1 { counter-increment: list-1; counter-reset: list-2 list-3 list-4 list-5 list-6 list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-1 > .ql-ui:before { content: counter(list-1, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-2 { counter-increment: list-2; counter-reset: list-3 list-4 list-5 list-6 list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-2 > .ql-ui:before { content: counter(list-2, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-3 { counter-increment: list-3; counter-reset: list-4 list-5 list-6 list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-3 > .ql-ui:before { content: counter(list-3, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-4 { counter-increment: list-4; counter-reset: list-5 list-6 list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-4 > .ql-ui:before { content: counter(list-4, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-5 { counter-increment: list-5; counter-reset: list-6 list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-5 > .ql-ui:before { content: counter(list-5, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-6 { counter-increment: list-6; counter-reset: list-7 list-8; }
			.portal-content li[data-list=ordered].ql-indent-6 > .ql-ui:before { content: counter(list-6, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-7 { counter-increment: list-7; counter-reset: list-8; }
			.portal-content li[data-list=ordered].ql-indent-7 > .ql-ui:before { content: counter(list-7, decimal) '. '; }
			.portal-content li[data-list=ordered].ql-indent-8 { counter-increment: list-8; }
			.portal-content li[data-list=ordered].ql-indent-8 > .ql-ui:before { content: counter(list-8, decimal) '. '; }
			/* ql-list-style overrides for indented items (new format) */
			.portal-content li[data-list=ordered].ql-indent-1.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-1, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-1.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-1, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-1.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-1, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-1.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-1, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-2.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-2, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-2.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-2, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-2.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-2, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-2.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-2, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-3.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-3, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-3.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-3, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-3.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-3, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-3.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-3, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-4.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-4, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-4.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-4, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-4.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-4, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-4.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-4, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-5.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-5, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-5.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-5, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-5.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-5, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-5.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-5, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-6.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-6, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-6.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-6, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-6.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-6, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-6.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-6, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-7.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-7, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-7.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-7, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-7.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-7, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-7.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-7, upper-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-8.ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-8, lower-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-8.ql-list-style-lower-roman > .ql-ui:before { content: counter(list-8, lower-roman) '. '; }
			.portal-content li[data-list=ordered].ql-indent-8.ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-8, upper-alpha) '. '; }
			.portal-content li[data-list=ordered].ql-indent-8.ql-list-style-upper-roman > .ql-ui:before { content: counter(list-8, upper-roman) '. '; }
			.portal-content strong { font-weight: 700; }
			.portal-content em     { font-style: italic; }
			.portal-content u      { text-decoration: underline; }
			.portal-content s      { text-decoration: line-through; }
			.portal-content sup    { vertical-align: super; font-size: 0.75em; line-height: 0; }
			.portal-content sub    { vertical-align: sub;   font-size: 0.75em; line-height: 0; }
			.portal-content .ql-align-center  { text-align: center; }
			.portal-content .ql-align-right   { text-align: right; }
			.portal-content .ql-align-justify,
			.portal-content [style*="text-align: justify"] {
				text-align: justify; text-align-last: left; hyphens: auto; -webkit-hyphens: auto; word-spacing: -0.01em;
			}
			/* ── Inline mode ─────────────────────────────────────────────── */
			.portal-inline { font-size: 0.875rem; line-height: 1.5; color: #111827; overflow-wrap: break-word; word-break: normal; }
			@media (max-width: 639px) { .portal-inline { font-size: 0.75rem; } }
			.portal-inline p { display: inline; margin: 0; padding: 0; }
			.portal-inline ul, .portal-inline ol { display: block; margin: 0.25em 0; padding-left: 1.5em; list-style-position: outside; }
			.portal-inline ul { list-style-type: disc; }
			.portal-inline ol { list-style-type: decimal; }
			.portal-inline li { display: list-item; margin: 0.1em 0; padding-left: 0.25em; }
			.portal-inline strong { font-weight: 700; }
			.portal-inline em     { font-style: italic; }
			.portal-inline u      { text-decoration: underline; }
			.portal-inline s      { text-decoration: line-through; }
			.portal-inline sup    { vertical-align: super; font-size: 0.75em; line-height: 0; }
			.portal-inline sub    { vertical-align: sub;   font-size: 0.75em; line-height: 0; }
		`}</style>
	);
}
