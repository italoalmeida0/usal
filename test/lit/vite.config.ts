import { RollupBabelInputPluginOptions, babel } from '@rollup/plugin-babel';
import copy, { CopyOptions } from 'rollup-plugin-copy';
import { Plugin, defineConfig } from 'vite';

import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'node:fs';
import minifyHTML from 'rollup-plugin-html-literals';
import summary from 'rollup-plugin-summary';
import app from './package.json';

const babelConfig: RollupBabelInputPluginOptions = {
	babelHelpers: 'bundled',
	extensions: ['.js', '.jsx', '.ts', '.tsx'],
	exclude: [/\bcore-js\b/],
	babelrc: false,
	plugins: [
		['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-syntax-import-meta',
		'@babel/plugin-proposal-export-default-from'
	],
	presets: [['@babel/preset-env', { targets: { chrome: '65' }, useBuiltIns: 'usage', corejs: '3', debug: false }]]
};

const copyConfig: CopyOptions = {
	hook: 'closeBundle',
	targets: [{ src: 'res', dest: 'dist' }]
};
export const svgLoader: () => Plugin = () => {
	var regexSequences: [RegExp, string][] = [
		// Remove XML stuffs and comments
		[/<\?xml[\s\S]*?>/gi, ''],
		[/<!doctype[\s\S]*?>/gi, ''],
		[/<!--.*-->/gi, ''],

		// SVG XML -> HTML5
		[/\<([A-Za-z]+)([^\>]*)\/\>/g, '<$1$2></$1>'], // convert self-closing XML SVG nodes to explicitly closed HTML5 SVG nodes
		[/\s+/g, ' '], // replace whitespace sequences with a single space
		[/\> \</g, '><'] // remove whitespace between tags
	];
	const getExtractedSVG = (svgStr: string) => regexSequences.reduce((prev, regexSequence) => prev.replace(regexSequence[0], regexSequence[1]), svgStr).trim();
	return {
		name: 'vite-svg-patch-plugin',
		transform: function (code, id) {
			if (id.endsWith('.svg')) {
				const extractedSvg = readFileSync(id, 'utf8');
				return `export const value = '${getExtractedSVG(extractedSvg)}'\n;export default value`;
			}
			return code;
		}
	};
};

// https://vitejs.dev/config/
export default (opts: { mode: 'production' | 'development'; command: 'build' | 'serve' }) => {
	return defineConfig({
		server: {
			port: Number(process.env.PORT || 3000),
			allowedHosts: [process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS || '']
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify(opts.mode),
			'process.env.VERSION': JSON.stringify(app.version)
		},
		plugins: [],
		build: {
			assetsInlineLimit: 100000,
			commonjsOptions: {
				sourceMap: false
			},
			rollupOptions: {
				input: {
					app: './src/lit-app.ts'
				},
				output: {
					format: 'esm',
					chunkFileNames: `v${app.version}/${process.env.NODE_ENV == 'development' ? '[name].' : 'c.'}[hash].js`,
					entryFileNames: `v${app.version}/[name].bundle.js`,
					dir: 'dist'
				},
				plugins: [
					// Minify HTML template literals
					minifyHTML(),
					babel(babelConfig),
					// Resolve bare module specifiers to relative paths
					resolve(),
					// Copy res to dist folder
					copy(copyConfig),
					// Minify JS
					terser({
						format: {
							comments: false
						},
						compress: false,
						module: true
					}),
					// Print bundle summary
					summary({
						showMinifiedSize: false,
						showGzippedSize: false
					})
				],
				preserveEntrySignatures: false
			}
		}
	});
};
