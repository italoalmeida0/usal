import { css } from 'lit';

// Define your Theme
let defaultTheme = css`
	:root {
		--color-primary: #2cb5e8;
		--color-primary-medium: #2cb5e8b0;
		--color-primary-light: #2cb5e82b;
		--color-on-primary: #fff;

		--color-secondary: #0fb8ad;
		/* Color de objeto en cima de color de acento */
		--color-on-secondary: #fff;

		/* Fondos */
		--color-background: #f7f7f8;
		/* Fondos Textos que aparecen en los fondos */
		--color-on-background: #535353; /* Gris */

		/* Fondos que estan en cima de los fondos (ct-cards) */
		--color-surface: #ffffff;
		/* Fondos Textos que aparecen en los ct-cards */
		--color-on-surface: #535353; /* Gris */

		/* Color de objeto en cima de error */
		--color-error: #b10808;
		--color-on-error: #fff;

		--high-emphasis: #000000de;
		--medium-emphasis: #00000099;
		--color-disable: #00000047;

		/* Blur */
		--color-blur: rgba(255, 255, 255, 0.7);
		--color-blur-surface: rgba(255, 255, 255, 0.6);
		--color-on-surface-opaque: #8e8e8e; /* Texto sencundarios */
		--color-on-surface-dividers: #7c7c7c30; /* divisores */
		--color-app: linear-gradient(90deg, #0fb8ad 0%, #1fc8db 51%, #2cb5e8 75%);
		--dark-primary-color: #218cb3;
	}
	.dark {
		--color-primary: #2cb5e8;
		--color-primary-medium: #2cb5e8b0;
		--color-primary-light: #2cb5e82b;
		--color-on-primary: #fff;

		--color-secondary: #0fb8ad;
		--color-on-secondary: #fff;

		/* Fondos */
		--color-background: #111e23;
		/* Fondos Textos que aparecen en los fondos */
		--color-on-background: #fff;

		/* Fondos que estan en cima de los fondos (ct-cards) */
		--color-surface: #1a2c34;
		/* Fondos Textos que aparecen en los ct-cards */
		--color-on-surface: #fff;

		--color-error: #cf6679;
		--color-on-error: #fff;

		--high-emphasis: #ffffffde;
		--medium-emphasis: #ffffff99;
		--color-disable: #ffffff61;

		--color-on-surface-opaque: #8e8e8e; /* Texto sencundarios */
		--color-on-surface-dividers: #bbbbbb24; /* divisores */
		--color-blur: rgba(35, 35, 37, 0.7);
		--color-blur-surface: #1a2c34b3;
		--color-app: linear-gradient(90deg, #0fb8ad 0%, #1fc8db 51%, #2cb5e8 75%);
		--dark-primary-color: #218cb3;
	}
`;

/**
 * Inject CSS
 */
export function injectTheme() {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = 'https://fonts.googleapis.com/css?family=Roboto:400,500,700';
	document.head.appendChild(link);
	const style = document.createElement('style');
	style.innerHTML = defaultTheme.cssText;
	document.head.appendChild(style);
}

export class Theme {
	static setTheme(color: 'dark' | 'light') {
		if (color == 'dark') {
			localStorage.theme = 'dark';
			document.documentElement.classList.add('dark');
			document.documentElement.classList.remove('light');
		} else {
			localStorage.theme = 'light';
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
		}
	}
}
