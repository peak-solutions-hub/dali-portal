/**
 * Global Quill-compatible styles for the summary-display div.
 * Rendered once per AgendaItemCard to enable rich text rendering in display mode.
 *
 * Supports two HTML formats:
 * 1. Legacy (nested): <ol><li>…<ol><li>…</li></ol></li></ol>
 * 2. Flat (new):      <ol><li data-list="ordered" class="ql-indent-1">…</li></ol>
 */
export function QuillDisplayStyles() {
	return (
		<style jsx global>{`
			.summary-display { font-size: 0.75rem; line-height: 1.42; overflow-wrap: break-word; word-break: normal; white-space: pre-wrap; counter-reset: list-0 list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8; }
			.summary-display p { margin: 0; padding: 0; }
			.summary-display ul, .summary-display ol { padding-left: 1.5em; margin: 0.2em 0; list-style-position: outside; }
			.summary-display li { display: list-item; margin: 0; padding-left: 0; }

			/* ── Native markers for legacy format (nested <ol>/<li> without data-list) ── */
			.summary-display.ql-editor ol > li { list-style-type: decimal; }
			.summary-display.ql-editor ul > li { list-style-type: disc; }

			/* ── New flat format (has data-list): hide native markers, rely on ql-ui::before ── */
			.summary-display.ql-editor li[data-list] { list-style-type: none; }

			/* ── List indent padding — 2.5em per level (matching editor) ── */
			.summary-display.ql-editor li.ql-indent-1 { padding-left: 2.5em; }
			.summary-display.ql-editor li.ql-indent-2 { padding-left: 5em; }
			.summary-display.ql-editor li.ql-indent-3 { padding-left: 7.5em; }
			.summary-display.ql-editor li.ql-indent-4 { padding-left: 10em; }
			.summary-display.ql-editor li.ql-indent-5 { padding-left: 12.5em; }
			.summary-display.ql-editor li.ql-indent-6 { padding-left: 15em; }
			.summary-display.ql-editor li.ql-indent-7 { padding-left: 17.5em; }
			.summary-display.ql-editor li.ql-indent-8 { padding-left: 20em; }

			/* Legacy format bullet indent overrides (not for flat format with ql-ui markers) */
			.summary-display li.ql-indent-1:not([data-list]) { list-style-type: circle; }
			.summary-display li.ql-indent-2:not([data-list]) { list-style-type: square; }

			/* ── Force decimal on ALL ordered list indent levels (override Quill's cycling) ── */
			.summary-display.ql-editor li[data-list=ordered].ql-indent-1 > .ql-ui:before { content: counter(list-1, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-2 > .ql-ui:before { content: counter(list-2, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-3 > .ql-ui:before { content: counter(list-3, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-4 > .ql-ui:before { content: counter(list-4, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-5 > .ql-ui:before { content: counter(list-5, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-6 > .ql-ui:before { content: counter(list-6, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-7 > .ql-ui:before { content: counter(list-7, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-indent-8 > .ql-ui:before { content: counter(list-8, decimal) '. '; }

			/* ── Explicit list-style overrides (ql-list-style-* from picker) ── */
			/* decimal (explicit) */
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal > .ql-ui:before { content: counter(list-0, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-1 > .ql-ui:before { content: counter(list-1, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-2 > .ql-ui:before { content: counter(list-2, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-3 > .ql-ui:before { content: counter(list-3, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-4 > .ql-ui:before { content: counter(list-4, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-5 > .ql-ui:before { content: counter(list-5, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-6 > .ql-ui:before { content: counter(list-6, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-7 > .ql-ui:before { content: counter(list-7, decimal) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-8 > .ql-ui:before { content: counter(list-8, decimal) '. '; }
			/* lower-alpha */
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-0, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-1 > .ql-ui:before { content: counter(list-1, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-2 > .ql-ui:before { content: counter(list-2, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-3 > .ql-ui:before { content: counter(list-3, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-4 > .ql-ui:before { content: counter(list-4, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-5 > .ql-ui:before { content: counter(list-5, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-6 > .ql-ui:before { content: counter(list-6, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-7 > .ql-ui:before { content: counter(list-7, lower-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-8 > .ql-ui:before { content: counter(list-8, lower-alpha) '. '; }
			/* lower-roman */
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman > .ql-ui:before { content: counter(list-0, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-1 > .ql-ui:before { content: counter(list-1, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-2 > .ql-ui:before { content: counter(list-2, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-3 > .ql-ui:before { content: counter(list-3, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-4 > .ql-ui:before { content: counter(list-4, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-5 > .ql-ui:before { content: counter(list-5, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-6 > .ql-ui:before { content: counter(list-6, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-7 > .ql-ui:before { content: counter(list-7, lower-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-8 > .ql-ui:before { content: counter(list-8, lower-roman) '. '; }
			/* upper-alpha */
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-0, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-1 > .ql-ui:before { content: counter(list-1, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-2 > .ql-ui:before { content: counter(list-2, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-3 > .ql-ui:before { content: counter(list-3, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-4 > .ql-ui:before { content: counter(list-4, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-5 > .ql-ui:before { content: counter(list-5, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-6 > .ql-ui:before { content: counter(list-6, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-7 > .ql-ui:before { content: counter(list-7, upper-alpha) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-8 > .ql-ui:before { content: counter(list-8, upper-alpha) '. '; }
			/* upper-roman */
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman > .ql-ui:before { content: counter(list-0, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-1 > .ql-ui:before { content: counter(list-1, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-2 > .ql-ui:before { content: counter(list-2, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-3 > .ql-ui:before { content: counter(list-3, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-4 > .ql-ui:before { content: counter(list-4, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-5 > .ql-ui:before { content: counter(list-5, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-6 > .ql-ui:before { content: counter(list-6, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-7 > .ql-ui:before { content: counter(list-7, upper-roman) '. '; }
			.summary-display.ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-8 > .ql-ui:before { content: counter(list-8, upper-roman) '. '; }

			/* Ordered list style overrides for legacy format (not for flat format with data-list) */
			.summary-display li.ql-list-style-decimal:not([data-list])     { list-style-type: decimal; }
			.summary-display li.ql-list-style-lower-alpha:not([data-list]) { list-style-type: lower-alpha; }
			.summary-display li.ql-list-style-lower-roman:not([data-list]) { list-style-type: lower-roman; }
			.summary-display li.ql-list-style-upper-alpha:not([data-list]) { list-style-type: upper-alpha; }
			.summary-display li.ql-list-style-upper-roman:not([data-list]) { list-style-type: upper-roman; }

			/* ── Non-list indent (plain paragraphs / divs) ── */
			.summary-display p.ql-indent-1, .summary-display div.ql-indent-1 { padding-left: 3em; }
			.summary-display p.ql-indent-2, .summary-display div.ql-indent-2 { padding-left: 6em; }
			.summary-display p.ql-indent-3, .summary-display div.ql-indent-3 { padding-left: 9em; }
			.summary-display p.ql-indent-4, .summary-display div.ql-indent-4 { padding-left: 12em; }
			.summary-display p.ql-indent-5, .summary-display div.ql-indent-5 { padding-left: 15em; }
			.summary-display p.ql-indent-6, .summary-display div.ql-indent-6 { padding-left: 18em; }
			.summary-display p.ql-indent-7, .summary-display div.ql-indent-7 { padding-left: 21em; }
			.summary-display p.ql-indent-8, .summary-display div.ql-indent-8 { padding-left: 24em; }
			.summary-display strong { font-weight: 700; }
			.summary-display em { font-style: italic; }
			.summary-display u { text-decoration: underline; }
			.summary-display sup { vertical-align: super; font-size: 0.75em; line-height: 0; }
			.summary-display .ql-align-center { text-align: center; }
			.summary-display .ql-align-right { text-align: right; }
			.summary-display .ql-align-justify,
			.summary-display [style*="text-align: justify"] { text-align: justify; text-align-last: left; hyphens: auto; -webkit-hyphens: auto; word-spacing: -0.01em; }
		`}</style>
	);
}
