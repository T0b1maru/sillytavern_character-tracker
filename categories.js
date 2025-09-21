// categories.js
// Central mapping of state keys ↔ pretty labels ↔ icons

// State keys we always support
export const defaultOutfit = {
    headwear: 'unknown',
    topwear: 'unknown',
    top_underwear: 'unknown',
    bottomwear: 'unknown',
    bottom_underwear: 'unknown',
    footwear: 'unknown',
};

// Pretty labels
export const fieldLabels = {
    headwear: 'Headwear',
    topwear: 'Top (outer)',
    top_underwear: 'Top (under)',
    bottomwear: 'Bottom (outer)',
    bottom_underwear: 'Bottom (under)',
    footwear: 'Footwear',
};

// Icons (FontAwesome + MDI)
export const fieldIcons = {
    headwear: '<i class="fa-solid fa-hat-cowboy"></i>',
    topwear: '<i class="fa-solid fa-shirt"></i>',
    top_underwear: '<span class="mdi mdi-lingerie"></span>',
    bottomwear: '<i class="mdi mdi-seat-legroom-normal"></i>',
    bottom_underwear: '<span class="mdi mdi-underwear-outline"></span>',
    footwear: '<i class="fa-solid fa-shoe-prints"></i>',
};

export const genericIcon = '<i class="fa-solid fa-tag"></i>';

// Normalize a pretty label or free-text to our state keys
export function normalizeKey(label, ownerIsChar) {
    const l = label.toLowerCase();
    if (l.startsWith('headwear')) return 'headwear';
    if (l.startsWith('top (outer)')) return 'topwear';
    if (l.startsWith('top (under)')) return 'top_underwear';
    if (l.startsWith('bottom (outer)')) return 'bottomwear';
    if (l.startsWith('bottom (under)')) return 'bottom_underwear';
    if (l.startsWith('footwear')) return 'footwear';
    if (l.startsWith('character location')) return 'charLocation';
    if (l.startsWith('user location')) return 'userLocation';
    return l.replace(/\s+/g, '_');
}

export const pretty = (k) =>
    (fieldLabels[k] || k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
