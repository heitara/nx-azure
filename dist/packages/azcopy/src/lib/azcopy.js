"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.azcopy = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs = require("fs");
const fs_1 = require("fs");
const node_fetch_1 = require("node-fetch");
const os = require("os");
const path = require("path");
const unzipper = require("unzipper");
const azcopy_types_1 = require("./azcopy.types");
const helpers_1 = require("./helpers");
const argsToFilter = ["--force-bin-download"];
const platform = os.platform();
const arch = os.arch();
const forceBinDownload = process.argv.includes("--force-bin-download");
function azcopy(force = forceBinDownload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`Detected ${platform} platform (arch - ${arch})`);
        const binPath = path.resolve(__dirname, platform === "win32" ? "./scripts/bin/azcopy.exe" : "./scripts/bin/azcopy");
        const azcopyFilename = platform === "win32" ? "azcopy.exe" : "azcopy";
        const binFolder = path.resolve(__dirname, "./scripts/bin");
        try {
            fs_1.accessSync(binPath);
            console.log("binary exists");
        }
        catch (error) {
            force = true;
            yield helpers_1.ensureBinFolder();
            console.log("binary not found");
        }
        if (!azcopy_types_1.SupportedArchAndPlatform.includes(`${platform}_${arch}`)) {
            throw Error("Unsupported platform for azcopy - supported platform and arch are - " +
                azcopy_types_1.SupportedArchAndPlatform.join(","));
        }
        const commonExecOptions = {
            encoding: "utf8",
            stdio: "inherit",
            cwd: path.resolve(__dirname, "./scripts"),
        };
        let downloadLink;
        let downloadedFileRelativePath;
        let scriptFile;
        if (force) {
            if (platform === "win32") {
                scriptFile = "win.ps1";
                if (arch === "x32") {
                    downloadLink = "https://aka.ms/downloadazcopy-v10-windows-32bit";
                    downloadedFileRelativePath = "./scripts/bin/azcopy_win32.zip";
                }
                else {
                    downloadLink = "https://aka.ms/downloadazcopy-v10-windows";
                    downloadedFileRelativePath = "./scripts/bin/azcopy_win32_x64.zip";
                }
                yield helpers_1.wrapSpinner(`Downloading azcopy from ${downloadLink}`, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield node_fetch_1.default(downloadLink).then(helpers_1.writeDownload(downloadedFileRelativePath));
                }));
                yield helpers_1.wrapSpinner("Extracting...", () => new Promise((resolve, reject) => {
                    let azcopyBinFile = path.resolve(__dirname, './scripts/bin/', azcopyFilename);
                    let zipPath = path.resolve(__dirname, downloadedFileRelativePath);
                    fs.createReadStream(zipPath)
                        .pipe(unzipper.Parse())
                        .on('entry', function (entry) {
                        const fileName = entry.path;
                        const type = entry.type; // 'Directory' or 'File'
                        const size = entry.vars.uncompressedSize; // There is also compressedSize;
                        if (fileName.endsWith(azcopyFilename)) {
                            entry.pipe(fs.createWriteStream(azcopyBinFile));
                        }
                        else {
                            entry.autodrain();
                        }
                    })
                        .promise()
                        .then(() => {
                        fs.unlinkSync(zipPath);
                        fs_1.chmod(azcopyBinFile, 0o100, (err) => {
                            resolve();
                        });
                    }, e => {
                        console.log('error', e);
                        reject(e);
                    });
                }));
            }
            else if (platform === "linux" || platform === "darwin") {
                scriptFile = "nix.sh";
                if (platform === "linux") {
                    downloadLink = "https://aka.ms/downloadazcopy-v10-linux";
                    downloadedFileRelativePath = "./scripts/bin/azcopy_linux.tar.gz";
                }
                else {
                    downloadLink = "https://aka.ms/downloadazcopy-v10-mac";
                    downloadedFileRelativePath = "./scripts/bin/azcopy_linux.tar.gz";
                }
                yield helpers_1.wrapSpinner(`Downloading azcopy from ${downloadLink}`, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield node_fetch_1.default(downloadLink).then(helpers_1.writeDownload(downloadedFileRelativePath));
                }));
                yield helpers_1.wrapSpinner("Extracting...", () => new Promise((resolve, reject) => {
                    let azcopyBinFile = path.resolve(__dirname, './scripts/bin/', azcopyFilename);
                    let zipPath = path.resolve(__dirname, downloadedFileRelativePath);
                    fs.createReadStream(zipPath)
                        .pipe(unzipper.Parse())
                        .on('entry', function (entry) {
                        const fileName = entry.path;
                        const type = entry.type; // 'Directory' or 'File'
                        const size = entry.vars.uncompressedSize; // There is also compressedSize;
                        if (fileName.endsWith(azcopyFilename)) {
                            entry.pipe(fs.createWriteStream(azcopyBinFile));
                        }
                        else {
                            entry.autodrain();
                        }
                    })
                        .promise()
                        .then(() => {
                        fs.unlinkSync(zipPath);
                        fs_1.chmod(azcopyBinFile, 0o100, (err) => {
                            resolve();
                        });
                    }, e => {
                        console.log('error', e);
                        reject(e);
                    });
                }));
            }
        }
        const args = process.argv.slice(2, process.argv.length).filter((arg) => {
            return !argsToFilter.includes(arg);
        });
        const escapedCommand = helpers_1.shellEscape(args);
        console.log("------ executing azcopy ------ \n");
        child_process_1.execSync(`${binPath} ${escapedCommand}`, commonExecOptions);
    });
}
exports.azcopy = azcopy;
//# sourceMappingURL=azcopy.js.map