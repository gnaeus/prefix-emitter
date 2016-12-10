var typescriptPlugin = require("rollup-plugin-typescript");
var typescript = require("typescript");

module.exports = {
    entry: "src/prefix-emitter.ts",
    dest: "dist/prefix-emitter.js",

    format: "umd",
    sourceMap: true,
    moduleName: "PrefixEmitter",

    plugins: [
        typescriptPlugin({ typescript: typescript }),
    ],
}