// updater.js
import { getSettings } from './state.js';
import { defaultPromptTemplate } from './promptTemplate.js';

// --- Few-shot (strict guidance, not part of output) ---
function fewShot(locLabel) {
    return `
EXAMPLES (for guidance only; DO NOT copy into output):

Example A:
Headwear: none
Top (outer): blue hoodie
Top (under): white t-shirt
Bottom (outer): jeans
Bottom (under): briefs
Footwear: sneakers
${locLabel}: dorm room

Example B:
Headwear: black cap
Top (outer): leather jacket
Top (under): tank top
Bottom (outer): cargo pants
Bottom (under): boxers
Footwear: boots
${locLabel}: city street

Example C:
Headwear: baseball cap
Top (outer): trench coat
Top (under): dress shirt
Bottom (outer): slacks
Bottom (under): boxers
Footwear: dress shoes
${locLabel}: office

IMPORTANT:
- You must output exactly these 7 labels, spelled and capitalized as above.
- Do NOT invent new labels (e.g. "Legs", "Panties", "Shoes").
- Do NOT add commentary, explanations, or extra lines.
- Do NOT insert blank lines between outputs.
`.trim();
}

/**
 * Ask the current LLM (quietly) to PATCH outfit/location for "char" or "user".
 * Returns an object with normalized keys used by the panels:
 *   headwear, topwear, top_underwear, bottomwear, bottom_underwear, footwear,
 *   charLocation / userLocation
 */
export async function fetchOutfitFromChat(ownerKey) {
    const s = getSettings();
    const ctx = SillyTavern.getContext();
    const { name1, name2, chat, characters } = ctx;

    // ---- Resolve names (force correct ones; never use m.name) ----
    const userName = name1 || window?.name1 || 'You';

    const activeCharId = ctx?.characterId ?? window?.this_chid;
    const charObj =
        (characters && characters[activeCharId]) ||
        (window?.characters && window.characters[activeCharId]) ||
        null;

    const charName = (name2 && name2 !== 'SillyTavern System')
        ? name2
        : (charObj?.name || 'Character');

    const ownerIsChar = ownerKey === 'char';
    const who = ownerIsChar ? charName : userName;
    const locLabel = ownerIsChar ? 'Character location' : 'User location';

    // ---- Build BASE from saved state ----
    const base = [
        `Headwear: ${s[ownerKey]?.headwear ?? 'unknown'}`,
        `Top (outer): ${s[ownerKey]?.topwear ?? 'unknown'}`,
        `Top (under): ${s[ownerKey]?.top_underwear ?? 'unknown'}`,
        `Bottom (outer): ${s[ownerKey]?.bottomwear ?? 'unknown'}`,
        `Bottom (under): ${s[ownerKey]?.bottom_underwear ?? 'unknown'}`,
        `Footwear: ${s[ownerKey]?.footwear ?? 'unknown'}`,
        `${locLabel}: ${s[ownerKey + 'Location'] ?? 'unknown'}`,
    ].join('\n');

    // ---- Character card info (fallback) ----
    const charInfo = ownerIsChar ? (charObj?.description?.trim() || '') : '';

    // ---- Recent chat excerpt (last 12), filtered + with forced speakers ----
    const excerpt = (chat || [])
        .filter(m =>
            !m?.is_system &&
            (m?.mes ?? '').trim() !== '' &&
            String(m?.name || '').trim() !== 'SillyTavern System'
        )
        .slice(-12)
        .map(m => {
            const speaker = m.is_user ? (userName) : (charName);
            const text = String(m.mes || '').replace(/\s+/g, ' ').trim();
            return `${speaker}: ${text}`;
        })
        .join('\n');

    // ---- Build prompt from template ----
    const template = s.promptTemplate || defaultPromptTemplate;
    const fieldList = [
        'Headwear: ...',
        'Top (outer): ...',
        'Top (under): ...',
        'Bottom (outer): ...',
        'Bottom (under): ...',
        'Footwear: ...',
        `${locLabel}: ...`,
    ].join('\n');

    const prompt = (fewShot(locLabel) + '\n\n' + template)
        .replace(/{{who}}/g, who)
        .replace(/{{lineCount}}/g, '7')
        .replace(/{{fieldList}}/g, fieldList)
        .replace(/{{base}}/g, base)
        .replace(/{{charInfo}}/g, charInfo || '(none)')
        .replace(/{{chat}}/g, excerpt);

    // ---- Quiet generation via ST ----
    const { generateQuietPrompt } = ctx;
    let raw;
    try {
        const res = await generateQuietPrompt({ quietPrompt: prompt });
        raw = typeof res === 'string'
            ? res
            : (res?.text ?? res?.output_text ?? res?.result ?? '');
    } catch (e) {
        console.error('fetchOutfitFromChat(): quiet gen failed', e);
        return null;
    }
    if (!raw) return null;

    raw = raw.split(/self-check/i)[0];

    const out = {};
    raw.split('\n').forEach(line => {
        const [k, ...rest] = line.split(':');
        if (!k || rest.length === 0) return;
        let v = rest.join(':').trim();
        if (!v) return;

        v = sanitizeValue(v);
        const key = normalizeKey(k.trim(), ownerIsChar);
        if (!key) return;

        if (key === 'footwear' && /sock/i.test(v)) v = 'unknown';

        out[key] = v;
    });

    return out;
}

// -------------- helpers --------------
function sanitizeValue(v) {
    const t = v.replace(/\.$/, '').trim();
    if (!t || /^(?:none|n\/a|null|unknown)$/i.test(t)) return 'unknown';
    return t;
}

function normalizeKey(label, ownerIsChar) {
    const l = label.toLowerCase();
    if (l.startsWith('headwear')) return 'headwear';
    if (l.startsWith('top (outer)')) return 'topwear';
    if (l.startsWith('top (under)')) return 'top_underwear';
    if (l.startsWith('bottom (outer)')) return 'bottomwear';
    if (l.startsWith('bottom (under)')) return 'bottom_underwear';
    if (l.startsWith('footwear')) return 'footwear';
    if (ownerIsChar && l.startsWith('character location')) return 'charLocation';
    if (!ownerIsChar && l.startsWith('user location')) return 'userLocation';
    return null;
}
