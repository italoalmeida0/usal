import { CtLit, html, customElement, css } from '@conectate/ct-lit';
import { Page } from '@conectate/ct-router';
import '@conectate/ct-router';
/**
 * @see https://www.npmjs.com/package/@conectate/ct-router
 */
@customElement('app-router')
export class AppRouter extends CtLit {
	static styles = [
		css`
			:host {
				display: block;
			}
		`
	];
	/** You can add more pages and behaviors
	 * @see https://www.npmjs.com/package/@conectate/ct-router
	 */
	static pages: Page[] = [
		{
			path: '/',
			element: html`<home-app></home-app>`,
			from: () => import('../home/activities/home-app'),
			auth: false,
			title: () => `Page 1 • Example.com`
		},
		{
			path: '/404',
			element: html`<app-404></app-404>`,
			from: () => import('./app-404'),
			auth: false,
			title: () => `404 • Example.com`
		},
		{
			path: '/login',
			element: html`<app-login></app-login>`,
			from: () => import('../login/activities/app-login'),
			auth: false,
			title: () => `Login • Example.com`
		}
	];

	render() {
		return html` <ct-router loginFallback="/login" loginFallback="/404" .pages=${AppRouter.pages}> </ct-router>`;
	}
}
