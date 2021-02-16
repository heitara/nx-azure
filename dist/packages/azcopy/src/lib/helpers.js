"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shellEscape = exports.wrapSpinner = exports.writeDownload = exports.ensureBinFolder = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const ora = require("ora");
const os_1 = require("os");
const path = require("path");
const binPath = path.resolve(__dirname, "./scripts/bin");
function ensureBinFolder() {
    return new Promise((resolve, reject) => {
        if (!fs_1.existsSync(binPath)) {
            fs_1.mkdir(binPath, 
            // Apparently this is not documented in @types/node but NODEJS docs say we can use it this way - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_options_callback
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
exports.ensureBinFolder = ensureBinFolder;
function writeDownload(relativeFilePath) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (res) => {
        return new Promise((resolve, reject) => {
            const fileStream = fs_1.createWriteStream(path.resolve(__dirname, relativeFilePath));
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                reject(err);
            });
            fileStream.on("finish", function () {
                resolve();
            });
        });
    };
}
exports.writeDownload = writeDownload;
function wrapSpinner(oraOptions, fn) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const spinner = ora(oraOptions).start();
        try {
            yield fn();
        }
        catch (error) {
            spinner.fail();
            throw error;
        }
        spinner.succeed();
    });
}
exports.wrapSpinner = wrapSpinner;
function shellEscape(args) {
    const quote = os_1.platform() === "win32" ? '"' : "'";
    return args
        .map((arg) => {
        if (!/^[A-Za-z0-9_/-]+$/.test(arg)) {
            arg = quote + arg.replace(quote, `\${quote}`) + quote;
            arg = arg
                .replace(/^(?:'')+/g, "") // unduplicate single-quote at the beginning
                .replace(/^(?:"")+/g, "") // unduplicate double-quote at the beginning
                .replace(/\\'''/g, "\\'") // remove non-escaped single-quote if there are enclosed between 2 escaped
                .replace(/\\"""/g, '\\"'); // remove non-escaped double-quote if there are enclosed between 2 escaped
        }
        return arg;
    })
        .join(" ");
}
exports.shellEscape = shellEscape;
//# sourceMappingURL=helpers.js.map