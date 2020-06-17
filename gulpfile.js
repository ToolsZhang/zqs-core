var gulp = require('gulp');
var typedoc = require("gulp-typedoc");

gulp.task("typedoc", function () {
    return gulp
        .src(["src/*.ts"])
        .pipe(typedoc({
            exclude: ["node_modules",
                "**/*+(index|.worker|.e2e).ts"],
            // TypeScript options (see typescript docs)
            module: "commonjs",
            target: "es6",
            includeDeclarations: false,

            // Output options (see typedoc docs)
            out: "./docs",

            // TypeDoc options (see typedoc docs)
            name: "zqs-core",
            ignoreCompilerErrors: true,
            version: true,
        }))
        ;
});