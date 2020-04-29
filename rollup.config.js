import { terser } from 'rollup-plugin-terser';
import multiEntry from 'rollup-plugin-multi-entry';
import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'src/node.js',
        output: [
            {
                file: 'dist/dabr-node.js',
                format: 'esm'
            },
            {
                file: 'dist/dabr-node.min.js',
                format: 'esm',
                plugins: [terser()]
            }
        ]
    },
    {
        input: 'src/channel.js',
        output: [
            {
                file: 'dist/dabr-channel.js',
                format: 'esm'
            },
            {
                file: 'dist/dabr-channel.min.js',
                format: 'esm',
                plugins: [terser()]
            }
        ]
    },
    {
        input: 'src/index.js',
        output: [
            {
                file: 'dist/dabr-lean.js',
                format: 'esm'
            },
            {
                file: 'dist/dabr-lean.min.js',
                format: 'esm',
                plugins: [terser()]
            }
        ],
        plugins: [resolve()]
    },
    {
        input: ['src/index.js', 'src/lib/index.js'],
        output: [
            {
                file: 'dist/dabr.js',
                format: 'esm'
            },
            {
                file: 'dist/dabr.min.js',
                format: 'esm',
                plugins: [terser()]
            }
        ],
        plugins: [multiEntry(), resolve()]
    }
];
