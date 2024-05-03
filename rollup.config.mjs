//npm imports for rollup
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

//uses src/manifest.json as an input file and outputs the files and folders to dist.
//Note: does not build all files from src into dist, some are copied over by build command in package.json
export default {
    input: 'src/manifest.json',
    output: {
        dir: 'dist',
        format: 'esm',
    },
    plugins: [nodeResolve(), chromeExtension(), json()]
};
