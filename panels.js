// panels.js
import { getSettings, saveSettings, ensureOutfitKeys, ensureCharBlock } from './state.js';
import { resolveNames } from './names.js';
import { fieldIcons, genericIcon, pretty } from './utils.js';
import { fetchOutfitFromChat } from './updater.js';

function buildPanel(id, title, ownerKey, settings, sideFallback) {
    const s = settings;
    const pos = s.positions[id] || { top: 10, side: sideFallback, offset: 10 };
    const collapsed = !!s.collapsed[id];

    const baseKeys = ['headwear','topwear','top_underwear','bottomwear','bottom_underwear','footwear'];
    const customKeys = s.customFields;
    const fields = [...baseKeys, ...customKeys];

    let html = `
      <div id="${id}" class="tracker-panel"
           style="position:fixed;top:${pos.top}px;${pos.side}:${pos.offset}px;width:320px;z-index:9999;">
        <div class="tracker-header drag-handle">
            <span class="panel-title">${title}</span>
            <span class="collapse-toggle" style="cursor:pointer;">${collapsed ? '▲' : '▼'}</span>
        </div>
        <div class="tracker-body" style="display:${collapsed ? 'none' : 'block'};">
    `;

    for (const field of fields) {
        const icon = fieldIcons[field] || genericIcon;
        const label = pretty(field);
        const value = s[ownerKey][field] ?? 'unknown';
        html += `
          <label>${icon} ${label}:</label>
          <input type="text" class="text_pole wide100p"
                 data-owner="${ownerKey}" data-field="${field}" value="${value}">
          <div class="suggestion" data-field="${field}" style="color:#4caf50;font-size:0.85em;"></div>
        `;
    }

    const locField = `${ownerKey}Location`;
    const locLabel = ownerKey === 'char' ? 'Character location' : 'User location';

    html += `
        <label><i class="fa-solid fa-location-dot"></i> ${locLabel}:</label>
        <textarea class="text_pole wide100p" rows="2" data-owner="${locField}">${s[locField] || ''}</textarea>
        <div class="suggestion" data-field="${locField}" style="color:#4caf50;font-size:0.85em;"></div>

        <div class="btn-row" style="display:flex;gap:8px;margin-top:8px;">
            <div class="menu_button save-btn" style="flex:1 1 auto;">💾 Save</div>
            <div class="menu_button update-btn" style="flex:1 1 auto;">🤖 Update from Chat</div>
        </div>
      </div>
    `;
    return html;
}

function makeInteractive(panelSelector, ownerKey, settings) {
    const panel = $(panelSelector);
    const id = panel.attr('id');

    // Dragging + remember position
    panel.draggable({
        handle: '.drag-handle',
        stop: function (_e, ui) {
            const pos = ui.position;
            settings.positions[id] = {
                top: pos.top,
                side: pos.left < window.innerWidth / 2 ? 'left' : 'right',
                offset: pos.left < window.innerWidth / 2 ? pos.left : window.innerWidth - pos.left - panel.width(),
            };
            saveSettings();
        },
    });

    // Save outfit/location
    panel.find('.save-btn').on('click', () => {
        panel.find('input').each(function () {
            const field = $(this).data('field');
            const suggestion = panel.find(`.suggestion[data-field="${field}"]`).text().trim();
            settings[ownerKey][field] = suggestion || $(this).val().trim();
        });

        const locField = `${ownerKey}Location`;
        const suggestion = panel.find(`.suggestion[data-field="${locField}"]`).text().trim();
        settings[locField] = suggestion || panel.find(`textarea[data-owner="${locField}"]`).val().trim();

        // Clear suggestions after save
        panel.find('.suggestion').text('');
        saveSettings();

        const { userName, charName } = resolveNames();
        toastr.success(`${ownerKey === 'char' ? charName : userName} outfit saved`);

        // ✅ Pull fresh state and re-render immediately
        const s = getSettings();
        ensureOutfitKeys(s);
        renderPanels(true);
    });

    // Update from Chat -> show suggestions under fields (green)
    panel.find('.update-btn').on('click', async () => {
        try {
            toastr.info('Fetching outfit info from chat...');
            const suggestions = await fetchOutfitFromChat(ownerKey);
            if (!suggestions) return;

            for (const [field, val] of Object.entries(suggestions)) {
                const sugEl = panel.find(`.suggestion[data-field="${field}"]`);
                if (sugEl.length) sugEl.text(val);
            }
            toastr.success('Suggestions updated — press Save to apply.');
        } catch (e) {
            console.error('Update from Chat failed:', e);
            toastr.error('Failed to update from chat');
        }
    });

    // Collapse toggle (persist state)
    panel.find('.collapse-toggle').on('click', function () {
        const body = panel.find('.tracker-body');
        body.toggle();
        const collapsed = body.is(':hidden');
        $(this).text(collapsed ? '▲' : '▼');
        settings.collapsed[id] = collapsed;
        saveSettings();
    });
}

// After render, fix titles once names are definitely available
function syncTitlesOnce() {
    let tries = 0;
    const maxTries = 120; // extended retry window
    const timer = setInterval(() => {
        const { userName, charName } = resolveNames();
        const ch = $('#char_outfit_panel .panel-title');
        const uh = $('#user_outfit_panel .panel-title');

        const wantCh = `${charName} Outfit`;
        const wantUh = `${userName} Outfit`;

        if (ch.length && ch.text() !== wantCh) ch.text(wantCh);
        if (uh.length && uh.text() !== wantUh) uh.text(wantUh);

        const done = (ch.text() === wantCh && uh.text() === wantUh);
        if (done || ++tries >= maxTries) clearInterval(timer);
    }, 250);
}

// Collapse char panel while portrait popup is visible
function setupCharPopupSync() {
    let autoCollapsed = false;
    const isPopupOpen = () => $('.zoomed_avatar:visible').length > 0;

    setInterval(() => {
        const charBody = $('#char_outfit_panel .tracker-body');
        const toggle = $('#char_outfit_panel .collapse-toggle');
        if (!charBody.length) return;

        if (isPopupOpen() && charBody.is(':visible')) {
            charBody.hide();
            toggle.text('▲');
            autoCollapsed = true;
        } else if (!isPopupOpen() && autoCollapsed) {
            charBody.show();
            toggle.text('▼');
            autoCollapsed = false;
        }
    }, 300);
}

function bindChatEventsOnce() {
    const ctx = SillyTavern.getContext();
    const ev = ctx?.eventSource;
    if (ev && typeof ev.on === 'function') {
        ev.on('chatLoaded', () => {
            console.log('[panels] chatLoaded event fired, rendering panels');
            renderPanels(true);
        });
    }
}

export function renderPanels(fromEvent = false) {
    const s = getSettings();
    ensureOutfitKeys(s);

    const { userName, charName } = resolveNames();

    if (!fromEvent) {
        // First call: only render the user panel, wait for chatLoaded for char panel
        const userHtml = buildPanel(
            'user_outfit_panel',
            `${userName} Outfit`,
            'user',
            s,
            'right'
        );
        $('#user_outfit_panel').remove();
        $(document.body).append(userHtml);
        makeInteractive('#user_outfit_panel', 'user', s);
        setupCharPopupSync();
        bindChatEventsOnce();
        return;
    }

    // Normal/full render (after chatLoaded)
    const charHtml = buildPanel(
        'char_outfit_panel',
        `${charName} Outfit`,
        'char',
        s,
        'left'
    );

    const userHtml = buildPanel(
        'user_outfit_panel',
        `${userName} Outfit`,
        'user',
        s,
        'right'
    );

    $('#char_outfit_panel').remove();
    $('#user_outfit_panel').remove();
    $(document.body).append(charHtml).append(userHtml);

    makeInteractive('#char_outfit_panel', 'char', s);
    makeInteractive('#user_outfit_panel', 'user', s);

    syncTitlesOnce();
    setupCharPopupSync();
}

/* -------------------------------------------------------
   Prompt Interceptor: inject under Persona & Char Desc
   ------------------------------------------------------- */
function formatOutfitBlock(title, name, outfitObj, location, keys) {
    const lines = keys.map(k => `- ${pretty(k)}: ${outfitObj?.[k] ?? 'unknown'}`);
    return `[${title}]\n${name} outfit:\n${lines.join('\n')}\n${name} location: ${location || 'unknown'}`;
}

export function injectOutfitIntoChat(chat, _contextSize, _abort, _type) {
    try {
        if (!Array.isArray(chat) || chat.length === 0) return;

        const ctx = SillyTavern.getContext();
        const s = getSettings();
        ensureOutfitKeys(s);

        const { userName, charName, charId } = resolveNames();
        if (charId != null) ensureCharBlock(s, charId);

        // Build ordered key list (base + custom)
        const baseKeys = ['headwear','topwear','top_underwear','bottomwear','bottom_underwear','footwear'];
        const keys = [...baseKeys, ...(Array.isArray(s.customFields) ? s.customFields : [])];

        const userBlock = formatOutfitBlock('Persona Outfit', userName, s.user, s.userLocation, keys);

        const charData = s.characters?.[charId] ?? { outfit: {}, location: '' };
        const charBlock = formatOutfitBlock('Character Outfit', charName, charData.outfit, charData.location, keys);

        // Skip if we've already injected on this build
        const already = chat.some(m => m?.is_system && typeof m.mes === 'string' &&
            (m.mes.includes('[Persona Outfit]') || m.mes.includes('[Character Outfit]')));
        if (already) return;

        // Find where system context ends (before first non-system message)
        let insertAt = chat.findIndex(m => !m?.is_system);
        if (insertAt < 0) insertAt = chat.length; // all system? then append

        // Insert two system messages so they appear right after Persona/Char sections
        const now = Date.now();
        const personaMsg = { is_system: true, name: 'OutfitTracker', send_date: now, mes: userBlock };
        const charMsg    = { is_system: true, name: 'OutfitTracker', send_date: now, mes: charBlock };

        // Heuristic: if there are multiple system blocks, try to put persona after the last system
        // that mentions the user name; same for character. If not found, fall back to insertAt.
        const lastPersonaIdx = [...chat].map((m, i) => ({ m, i }))
            .filter(x => x.m?.is_system && typeof x.m.mes === 'string' && x.m.mes.toLowerCase().includes(userName.toLowerCase()))
            .map(x => x.i).pop();
        const lastCharIdx = [...chat].map((m, i) => ({ m, i }))
            .filter(x => x.m?.is_system && typeof x.m.mes === 'string' && x.m.mes.toLowerCase().includes(charName.toLowerCase()))
            .map(x => x.i).pop();

        const personaInsert = Number.isInteger(lastPersonaIdx) ? lastPersonaIdx + 1 : insertAt;
        chat.splice(personaInsert, 0, personaMsg);

        // After inserting persona, indices shift. Compute char insertion again.
        const charInsertCandidate = Number.isInteger(lastCharIdx) ? (lastCharIdx >= personaInsert ? lastCharIdx + 2 : lastCharIdx + 1) : insertAt + 1;
        const safeCharInsert = Math.min(Math.max(charInsertCandidate, 0), chat.length);
        chat.splice(safeCharInsert, 0, charMsg);

    } catch (err) {
        console.error('[OutfitTracker] Failed to inject under Persona/Char Desc:', err);
    }
}
