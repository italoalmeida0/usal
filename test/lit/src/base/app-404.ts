import { CtLit, html, property, customElement, css } from '@conectate/ct-lit';

@customElement('app-404')
export class App404 extends CtLit {
	static styles = css`
		:host {
			display: block;
		}
	`;

	render() {
		return html`<h1>404 - Not found</h1>`;
	}
}
