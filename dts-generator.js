const dtsGenerator = require("dts-generator");

dtsGenerator.default({
    main: "prefix-emitter",
    baseDir: "./src",
    files: ["prefix-emitter.ts"],
    out: "./dist/prefix-emitter.d.ts",
});