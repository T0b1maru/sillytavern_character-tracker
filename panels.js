// panels.js
import { getSettings, saveSettings, ensureOutfitKeys } from './state.js';
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

    // Save outfit/location (apply suggestions if present)
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

        // Re-render so UI updates immediately
        renderPanels();
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
    const maxTries = 20;
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

export function renderPanels() {
    const s = getSettings();
    ensureOutfitKeys(s);

    const { userName, charName } = resolveNames();

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
