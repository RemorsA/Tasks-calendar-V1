export const COLOR_PRESETS = [
	{ name: 'Banana Cream', value: '#EEDCA7' },
	{ name: 'Deep Blueberry', value: '#2D3E56' },
	{ name: 'Warm Caramel', value: '#E7993F' },
	{ name: 'Iced Mint', value: '#AAC6AD' },
	{ name: 'Dark Chocolate', value: '#422B21' },
	{ name: 'Vanilla Chocolate', value: '#DFCFBA' }
];

export function getContrastYIQ(hexcolor: string) {
	if (!hexcolor || !hexcolor.startsWith('#')) return 'var(--text-on-accent)';
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0,2),16);
	const g = parseInt(hexcolor.substr(2,2),16);
	const b = parseInt(hexcolor.substr(4,2),16);
	const yiq = ((r*299)+(g*587)+(b*114))/1000;
	// If light background (high YIQ), use dark text. Else use light text.
	// In Obsidian, text-normal is usually dark in light mode, light in dark mode.
	// We need explicit black/white or careful variable usage.
	return (yiq >= 128) ? '#000000' : '#ffffff';
}

