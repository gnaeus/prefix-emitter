const webpack       = require("webpack");
const deepmerge     = require("deepmerge");

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

    devtool: "source-map",
};

const minified = deepmerge(config, {
    output: {
        filename: "prefix-emitter.min.js"
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
    ],
});

module.exports = [config, minified];