import { defaultPromptTemplate } from './promptTemplate.js';

export const MODULE_NAME = 'outfit-location-tracker';

// ---- Base outfit schema (fixed order) ----
const defaultOutfit = {
    headwear: 'unknown',
    topwear: 'unknown',
    top_underwear: 'unknown',
    bottomwear: 'unknown',
    bottom_underwear: 'unknown',
    footwear: 'unknown',
};

export function getSettings() {
    const { extensionSettings } = SillyTavern.getContext();
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = {
            user: { ...defaultOutfit },
            userLocation: '',
            characters: {},      // <-- per-character storage
            positions: {},
            collapsed: {},
            customFields: [],
            autoUpdate: false,
            promptTemplate: defaultPromptTemplate,
        };
    }
    const s = extensionSettings[MODULE_NAME];

    if (!s.positions) s.positions = {};
    if (!s.collapsed) s.collapsed = {};
    if (!s.characters) s.characters = {};
    if (!Array.isArray(s.customFields)) s.customFields = [];
    if (typeof s.userLocation !== 'string') s.userLocation = '';
    if (!s.user) s.user = { ...defaultOutfit };
    if (typeof s.promptTemplate !== 'string') s.promptTemplate = defaultPromptTemplate;

    return s;
}

export function saveSettings() {
    SillyTavern.getContext().saveSettingsDebounced();
}

// Ensure outfit/location exists for given characterId
export function ensureCharBlock(s, charId) {
    if (!s.characters[charId]) {
        s.characters[charId] = {
            outfit: { ...defaultOutfit },
            location: '',
        };
    }
    // fill missing custom fields
    for (const f of s.customFields) {
        if (!(f in s.characters[charId].outfit)) {
            s.characters[charId].outfit[f] = 'unknown';
        }
    }
}

// Ensure outfit keys exist everywhere
export function ensureOutfitKeys(s) {
    const baseKeys = Object.keys(defaultOutfit);
    const all = [...baseKeys, ...s.customFields];

    // User
    for (const key of all) {
        if (!(key in s.user)) s.user[key] = 'unknown';
    }

    // Each character
    for (const charId of Object.keys(s.characters)) {
        for (const key of all) {
            if (!(key in s.characters[charId].outfit)) {
                s.characters[charId].outfit[key] = 'unknown';
            }
        }
    }
}

// Reset a character’s outfit+location (for “Start new chat”)
export function resetCharacter(charId) {
    const s = getSettings();
    if (s.characters[charId]) {
        s.characters[charId] = {
            outfit: { ...defaultOutfit },
            location: '',
        };
        saveSettings();
    }
}
