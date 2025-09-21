import { renderPanels } from './panels.js';
import { renderSettings } from './settings.js';
import { injectOutfitIntoChat } from './panels.js';

globalThis.injectOutfitIntoChat = injectOutfitIntoChat;

jQuery(async function () {
    renderPanels();
    await renderSettings();
});
