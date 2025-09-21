// names.js
export function resolveNames() {
    const ctx = SillyTavern.getContext();

    // User
    const userName = ctx?.name1 || window?.name1 || 'You';

    // Active character id
    let charIdx = ctx?.characterId;
    if (charIdx == null && window?.this_chid != null) {
        charIdx = window.this_chid;
    }
    const charId = Number.isNaN(Number(charIdx)) ? charIdx : Number(charIdx);

    // Active character object (prefer the card list, never use name2 here)
    const charObj =
        (ctx?.characters && ctx.characters[charId]) ||
        (window?.characters && window.characters[charId]) ||
        null;

    // If card name missing, fall back to a safe generic label
    const charName = (charObj?.name && String(charObj.name).trim())
        ? String(charObj.name).trim()
        : 'Character';

    return { userName, charName, charId };
}
