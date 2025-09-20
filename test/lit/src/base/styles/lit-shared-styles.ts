import { css } from 'lit';

// You Shared Styles
export const litStyles = css`
	*,
	*:before,
	*:after {
		box-sizing: border-box;
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased;
	}

	.highlight-font {
		font-family: 'Roboto', arial, sans-serif;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-family: 'Roboto', arial, sans-serif;
	}
	h1,
	h2,
	h3,
	h4 {
		color: var(--dark-primary-color);
		/* margin-top: 0.8em;
		margin-bottom: 0.8em; */
	}
`;
