import fs from 'fs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import {plugins} from './build/rollup_plugins.js';
import banner from './build/banner.js';

const {BUILD, MINIFY, ROLLUP_WATCH} = process.env;
const minified = MINIFY === 'true';
const watch = ROLLUP_WATCH === 'true';
const srcDir = watch ? 'src' : 'rollup/build/tsc/src';
const inputExt = watch ? 'ts' : 'js';
const production = BUILD === 'production';
const outputFile =
    !production ? 'dist/maplibre-gl2-dev.es5.js' :
    minified ? 'dist/maplibre-gl2.es5.js' : 'dist/maplibre-gl2-unminified.es5.js';

export default [{
    // Before rollup you should run build-tsc to transpile from typescript to javascript (except when running rollup in watch mode)
    // Rollup will use code splitting to bundle GL JS into three "chunks":
    // - rollup/build/maplibregl/index.js: the main module, plus all its dependencies not shared by the worker module
    // - rollup/build/maplibregl/worker.js: the worker module, plus all dependencies not shared by the main module
    // - rollup/build/maplibregl/shared.js: the set of modules that are dependencies of both the main module and the worker module
    //
    // This is also where we do all of our source transformations using the plugins.
    input: [`${srcDir}/index.${inputExt}`, `${srcDir}/source/worker.${inputExt}`],
    output: {
        dir: 'rollup/build/maplibregl',
        format: 'amd',
        sourcemap: 'inline',
        indent: false,
        chunkFileNames: 'shared.js'
    },
    treeshake: production,
    plugins: plugins(minified, production, watch)
}, {
    // Next, bundle together the three "chunks" produced in the previous pass
    // into a single, final bundle. See rollup/bundle_prelude.js and
    // rollup/maplibregl.js for details.
    input: 'rollup/maplibregl.js',
    output: {
        name: 'maplibregl',
        file: outputFile,
        format: 'umd',
        sourcemap: production ? true : 'inline',
        indent: false,
        intro: fs.readFileSync('./rollup/bundle_prelude.js', 'utf8'),
        banner
    },
    treeshake: false,
    plugins: [
        // Ingest the sourcemaps produced in the first step of the build.
        // This is the only reason we use Rollup for this second pass
        sourcemaps()
    ],
}];
