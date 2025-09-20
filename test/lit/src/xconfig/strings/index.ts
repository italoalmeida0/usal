/**
 * @author Herberth Obregón
 * @date 03/01/2021
 * Add langs
 */
import { es } from './lang/es';
// @ts-ignore
const strings: { [key in keyof typeof es]: (typeof es)[key] } = {};

export type tSupportLangs = 'es';
export const supportLang: tSupportLangs[] = ['es'];

export function getLang(defaultLang = 'es'): tSupportLangs {
	if (localStorage.lang == 'null') delete localStorage.lang;
	let lang = localStorage.lang || window.navigator.language || defaultLang;
	lang = lang.substring(0, 2);
	if (supportLang.includes(lang)) {
		return lang;
	} else {
		return 'es';
	}
}
export async function loadLang() {
	document.documentElement.lang = getLang();
	switch (getLang()) {
		default:
		case 'es':
			let es = await import('./lang/es');
			setNewDict(es.es);
			break;
	}
	// @ts-ignore
	window.strings = strings;
}

function setNewDict(str: any) {
	Object.keys(str).forEach((key: any) => {
		// @ts-ignore
		strings[key] = str[key];
	});
}

export { strings };
