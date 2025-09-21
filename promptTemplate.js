export const defaultPromptTemplate = `
You will PATCH the baseline outfit for {{who}} using ONLY explicit updates from <CHAT/>.
If no updates exist in <CHAT/>, fall back to <CHARINFO/>.
Never invent new items. If an item isn’t found in either, keep the baseline value from <BASE/>.

Output EXACTLY these {{lineCount}} lines (no extra text, no markdown):
{{fieldList}}

<BASE>
{{base}}
</BASE>

<CHARINFO>
{{charInfo}}
</CHARINFO>

<CHAT>
{{chat}}
</CHAT>

Self-check:
- Are there exactly {{lineCount}} lines?
- Do all lines start with the exact labels above?
- If info missing, keep baseline value from <BASE/>.
`.trim();
