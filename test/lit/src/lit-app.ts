import './base/app-router';
import AppLocalStorage from './base/app-localstorage';
import { loadLang } from './xconfig/strings';
import { css, CtLit, customElement, html } from '@conectate/ct-lit';
import { property } from 'lit/decorators.js';
import { injectTheme, Theme } from './base/styles/default-theme';

@customElement('lit-app')
export class LitApp extends CtLit {
	static styles = [
		css`
			:host,
			main {
				display: flex;
				flex-direction: column;
				color: var(--color-on-background);
				height: 100%;
			}
			app-router {
				flex: 1;
			}
			header {
				display: flex;
				align-items: center;
				font-size: 1.5em;
				font-weight: bold;
				padding: 0px 16px;
				height: 56px;
				color: var(--color-primary);
				background: var(--color-surface);
				box-shadow: rgba(0, 0, 0, 0.26) 0px 4px 11px 0px;
				z-index: 90;
				position: relative;
			}
		`
	];
	@property({ type: Number }) foo = 1;

	async connectedCallback() {
		await loadLang();
		injectTheme();
		Theme.setTheme(AppLocalStorage.theme || 'light');
		super.connectedCallback();
	}

	render() {
		return html`
			<main>
				<header>LitElement Starter App</header>
				<app-router></app-router>
			</main>
		`;
	}

	firstUpdated() {}
}
