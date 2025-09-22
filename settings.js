import { renderExtensionTemplateAsync } from '../../../extensions.js';
import { MODULE_NAME, getSettings, saveSettings, ensureOutfitKeys } from './state.js';
import { defaultPromptTemplate } from './promptTemplate.js';
import { renderPanels } from './panels.js';

const TEMPLATE_PATH = 'third-party/sillytavern_character-tracker';

export async function renderSettings() {
    try {
        const settingsHtml = await renderExtensionTemplateAsync(TEMPLATE_PATH, 'settings');
        $('#extensions_settings2').append(settingsHtml);
    } catch {
        /* optional */
    }

    const s = getSettings();

    // --- Populate UI ---
    $('#outfit_auto_update').prop('checked', !!s.autoUpdate);
    $('#outfit_custom_fields').val(s.customFields.join(', '));
    $('#outfit_prompt_template').val(s.promptTemplate || defaultPromptTemplate);

    // --- Save handler ---
    $('#outfit_save_settings').off('click').on('click', () => {
        const oldCustom = Array.isArray(s.customFields) ? [...s.customFields] : [];
        const list = String($('#outfit_custom_fields').val() || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

        // dedupe, preserve order
        const seen = new Set();
        const newCustom = list.filter(x => !seen.has(x) && seen.add(x));

        s.autoUpdate = $('#outfit_auto_update').is(':checked');
        s.customFields = newCustom;
        s.promptTemplate = $('#outfit_prompt_template').val().trim() || defaultPromptTemplate;

        // Add new fields
        for (const f of newCustom) {
            if (!(f in s.char)) s.char[f] = 'unknown';
            if (!(f in s.user)) s.user[f] = 'unknown';
        }
        // Remove deleted fields
        for (const f of oldCustom) {
            if (!newCustom.includes(f)) {
                delete s.char[f];
                delete s.user[f];
            }
        }

        ensureOutfitKeys(s);
        saveSettings();

        renderPanels(); // 🔥 instantly refresh both panels

        toastr.success('Outfit tracker settings saved');
    });

    // --- Reset handler ---
    $('#outfit_reset_settings').off('click').on('click', () => {
        s.autoUpdate = false;
        s.customFields = [];
        s.promptTemplate = defaultPromptTemplate;

        ensureOutfitKeys(s);
        saveSettings();

        // Reset UI fields
        $('#outfit_auto_update').prop('checked', false);
        $('#outfit_custom_fields').val('');
        $('#outfit_prompt_template').val(defaultPromptTemplate);

        renderPanels(); // 🔥 also refresh after reset

        toastr.info('Outfit tracker settings reset to defaults');
    });
}
