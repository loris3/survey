import { rollupPluginHTML as html } from "@web/rollup-plugin-html";
import {copy} from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import summary from 'rollup-plugin-summary';
import postcss from 'rollup-plugin-postcss';


const production = !process.env.ROLLUP_WATCH;
export default {
  watch: {
    exclude: ['db.*', '*.pdf']
    
  },
  input: 'index.js',
  plugins: [
    postcss({
      extensions: [ '.css' ],
    }),
    resolve(),
    terser({
      ecma: 2021,
      module: true,
      warnings: true,
    }),
    copy({
      patterns: [
        'fonts/**',
        '*.svg',
        '*.jpeg',
        '*.jpg',
        '*.html',
        'lime_bundle.js',
        'anchor_bundle.js'
      ],
    }),
    summary(),

  ],
  output: {
    dir: 'build',
		sourcemap: !production 
  },
  preserveEntrySignatures: 'strict',
};