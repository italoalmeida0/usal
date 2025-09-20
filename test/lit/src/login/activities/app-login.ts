import { CtLit, html, property, customElement, css } from '@conectate/ct-lit';

@customElement('app-login')
export class AppLogin extends CtLit {
	static styles = css`
		:host {
			display: block;
		}
	`;

	render() {
		return html`<h1>Login</h1>`;
	}
}
