import { renderPanels } from './panels.js';
import { renderSettings } from './settings.js';

jQuery(async function () {
    renderPanels();
    await renderSettings();
});
