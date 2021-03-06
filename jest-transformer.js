var ts = require("typescript");
var fs = require("fs");

module.exports = {
    process: function(src, filename) {
        if (filename.indexOf("node_modules") === -1) {
            if (filename.indexOf(".ts") === filename.length - 3) {
                src = ts.transpile(src, {
                    experimentalDecorators: true,
                    lib: [ "dom", "es5", "es6" ],
                    target: ts.ScriptTarget.ES5,
                });
            }
        }
        return src;
    }
};