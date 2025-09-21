// Load Material Design Icons once (for lingerie/underwear)
if (!document.getElementById('mdi-styles')) {
    const link = document.createElement('link');
    link.id = 'mdi-styles';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css';
    document.head.appendChild(link);
}

// Icons (Font Awesome Free + MDI for underwear)
export const fieldIcons = {
    headwear: '<i class="fa-solid fa-hat-cowboy"></i>',
    topwear: '<i class="fa-solid fa-shirt"></i>',
    top_underwear: '<span class="mdi mdi-lingerie"></span>',
    bottomwear: '<i class="mdi mdi-seat-legroom-normal"></i>',
    bottom_underwear: '<span class="mdi mdi-underwear-outline"></span>',
    footwear: '<i class="fa-solid fa-shoe-prints"></i>',
};

export const genericIcon = '<i class="fa-solid fa-tag"></i>';

// Pretty labels for base fields
const fieldLabels = {
    headwear: 'Headwear',
    topwear: 'Top (outer)',
    top_underwear: 'Top (under)',
    bottomwear: 'Bottom (outer)',
    bottom_underwear: 'Bottom (under)',
    footwear: 'Footwear',
};

export const pretty = (k) =>
    (fieldLabels[k] || k.replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()));
