import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
    input: 'src/manifest.json',
    output: {
        dir: 'dist',
        format: 'esm',
    },
    plugins: [nodeResolve(), chromeExtension(), json()]
};
