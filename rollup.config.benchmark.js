var nodeGlobalsPlugin = require("rollup-plugin-node-globals");
var nodeBuiltinsPlugin = require("rollup-plugin-node-builtins");
var typescriptPlugin = require("rollup-plugin-typescript");
var typescript = require("typescript");

module.exports = {
    entry: "src/__benchmarks__/prefix-emitter-benchmark.ts",
    dest: "dist/prefix-emitter.benchmark.js",

    format: "umd",

    external: [
        "benchmark"
    ],

    globals: {
        "benchmark": "Benchmark",
    },

    plugins: [
        typescriptPlugin({ typescript: typescript }),
        
        nodeGlobalsPlugin(),
        nodeBuiltinsPlugin(),
    ],
}