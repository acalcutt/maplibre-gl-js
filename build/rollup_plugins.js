
import flowRemoveTypes from '@mapbox/flow-remove-types';
import resolve from '@rollup/plugin-node-resolve';
import buble from '@rollup/plugin-buble';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import unassert from 'rollup-plugin-unassert';
import json from '@rollup/plugin-json';
import {terser} from 'rollup-plugin-terser';
import minifyStyleSpec from './rollup_plugin_minify_style_spec.js';
import strip from '@rollup/plugin-strip';

// Common set of plugins/transformations shared across different rollup
// builds (main maplibre bundle, style-spec package, benchmarks bundle)

export const plugins = (minified, production) => [
    flow(),
    minifyStyleSpec(),
    json(),
    buble({transforms: {dangerousForOf: true}, objectAssign: "Object.assign"}),
    production ? strip({
        sourceMap: true,
        functions: ['PerformanceUtils.*', 'Debug.*']
    }) : false,
    minified ? terser({
        compress: {
            pure_getters: true,
            passes: 3
        }
    }) : false,
    production ? unassert() : false,
    resolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs({
        // global keyword handling causes Webpack compatibility issues, so we disabled it:
        // https://github.com/mapbox/mapbox-gl-js/pull/6956
        ignoreGlobal: true
    })
].filter(Boolean);

export function flow() {
    return {
        name: 'flow-remove-types',
        transform: (code) => ({
            code: flowRemoveTypes(code).toString(),
            map: null
        })
    };
}