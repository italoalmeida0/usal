/**
 * Document your localStorage
 */
export default class AppLocalStorage {
	static get theme() {
		return localStorage.theme;
	}
	static set theme(val) {
		localStorage.theme = val;
	}
}
