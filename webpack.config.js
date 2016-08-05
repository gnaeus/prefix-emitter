const path      = require("path");
const webpack   = require("webpack");
const deepmerge = require("deepmerge");

const config = {
    entry: "./src/prefix-emitter.ts",
    
    output: {
        path: "dist",
        filename: "prefix-emitter.js",
        libraryTarget: "umd",
    },

    module: {
        loaders: [
            {
                test: /\.ts$/, exclude: /node_modules/, loader: "ts-loader",
                query: { silent: true },
            },
        ]
    },

    devtool: "#source-map",
};

const minified = deepmerge(config, {
    output: {
        filename: "prefix-emitter.min.js"
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
    ],
});

const benchmark = deepmerge(config, {
    entry: "./src/__benchmarks__/prefix-emitter-benchmark.ts",

    output: {
        path: "dist/benchmarks",
        filename: "prefix-emitter-benchmark.js",
    },

    module: {
        noParse: [
            /[\/\\]node_modules[\/\\]benchmark[\/\\]benchmark\.js$/
        ],
    },

    devtool: "#inline",
});

module.exports = [config, minified, benchmark];