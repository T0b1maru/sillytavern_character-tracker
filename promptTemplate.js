// promptTemplate.js
export const defaultPromptTemplate = `
You will PATCH the baseline outfit for {{who}} using ONLY explicit updates from <CHAT/>.
If no updates exist in <CHAT/>, fall back to <CHARINFO/>.
Never invent new items. If an item isn’t found in either, keep the baseline value from <BASE/>.

Output EXACTLY these {{lineCount}} lines (no extra text, no markdown, no blank lines):
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

EXAMPLES (guidance only, do not copy literally):
Headwear: none
Top (outer): hoodie
Top (under): t-shirt
Bottom (outer): jeans
Bottom (under): briefs
Footwear: sneakers
{{locLabel}}: dorm room

Headwear: cap
Top (outer): jacket
Top (under): shirt
Bottom (outer): trousers
Bottom (under): boxers
Footwear: boots
{{locLabel}}: city street

Headwear: hat
Top (outer): coat
Top (under): blouse
Bottom (outer): skirt
Bottom (under): panties
Footwear: heels
{{locLabel}}: office

IMPORTANT:
- Use exactly 7 lines with labels as shown.
- Do NOT add new labels (e.g. “Legs”).
- Do NOT add commentary or descriptions.
- Do NOT insert blank lines between outputs.
- If missing, keep baseline value.

Self-check:
- Are there exactly {{lineCount}} lines?
- Are the labels spelled and capitalized EXACTLY as shown above?
- No additional labels, commentary, or formatting allowed.
- If info missing, keep baseline value from <BASE/>.
`.trim();