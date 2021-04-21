import { ExecFileSyncOptions, execSync } from "child_process";
import * as fs from "fs";
import { accessSync, chmod } from "fs";
import fetch from "node-fetch";
import * as os from "os";
import * as path from "path";
import * as unzipper from "unzipper";
import { SupportedArchAndPlatform } from "./azcopy.types";
import {
  ensureBinFolder,
  shellEscape,
  wrapSpinner,
  writeDownload
} from "./helpers";

const argsToFilter = ["--force-bin-download"];

const platform = os.platform();
const arch = os.arch();
const forceBinDownload = process.argv.includes("--force-bin-download");

export async function azcopy(
  force: boolean = forceBinDownload,
  extraArguments: string[] = []
) {
  console.log(`Detected ${platform} platform (arch - ${arch})`);

  const binPath = path.resolve(
    __dirname,
    platform === "win32" ? "./scripts/bin/azcopy.exe" : "./scripts/bin/azcopy"
  );

  const azcopyFilename = platform === "win32" ? "azcopy.exe" : "azcopy";
  const binFolder = path.resolve(__dirname, "./scripts/bin");

  try {
    accessSync(binPath);
    console.log("binary exists");
  } catch (error) {
    force = true;
    await ensureBinFolder();
    console.log("binary not found");
  }

  if (!SupportedArchAndPlatform.includes(`${platform}_${arch}`)) {
    throw Error(
      "Unsupported platform for azcopy - supported platform and arch are - " +
        SupportedArchAndPlatform.join(",")
    );
  }

  const commonExecOptions: ExecFileSyncOptions = {
    encoding: "utf8",
    stdio: "inherit",
    cwd: path.resolve(__dirname, "./scripts")
  };

  let downloadLink: string;
  let downloadedFileRelativePath: string;
  let scriptFile: string;

  if (force) {
    if (platform === "win32") {
      scriptFile = "win.ps1";
      if (arch === "x32") {
        downloadLink = "https://aka.ms/downloadazcopy-v10-windows-32bit";
        downloadedFileRelativePath = "./scripts/bin/azcopy_win32.zip";
      } else {
        downloadLink = "https://aka.ms/downloadazcopy-v10-windows";
        downloadedFileRelativePath = "./scripts/bin/azcopy_win32_x64.zip";
      }

      await wrapSpinner(`Downloading azcopy from ${downloadLink}`, async () => {
        await fetch(downloadLink).then(
          writeDownload(downloadedFileRelativePath)
        );
      });

      await wrapSpinner(
        "Extracting...",
        () =>
          new Promise((resolve, reject) => {
            const azcopyBinFile = path.resolve(
              __dirname,
              "./scripts/bin/",
              azcopyFilename
            );
            const zipPath = path.resolve(__dirname, downloadedFileRelativePath);
            fs.createReadStream(zipPath)
              .pipe(unzipper.Parse())
              .on("entry", function (entry) {
                const fileName = entry.path;
                const type = entry.type; // 'Directory' or 'File'
                const size = entry.vars.uncompressedSize; // There is also compressedSize;
                if (fileName.endsWith(azcopyFilename)) {
                  entry.pipe(fs.createWriteStream(azcopyBinFile));
                } else {
                  entry.autodrain();
                }
              })
              .promise()
              .then(
                () => {
                  fs.unlinkSync(zipPath);
                  chmod(azcopyBinFile, 0o100, (err) => {
                    resolve();
                  });
                },
                (e) => {
                  console.log("error", e);
                  reject(e);
                }
              );
          })
      );
    } else if (platform === "linux" || platform === "darwin") {
      scriptFile = "nix.sh";
      if (platform === "linux") {
        downloadLink = "https://aka.ms/downloadazcopy-v10-linux";
        downloadedFileRelativePath = "./scripts/bin/azcopy_linux.tar.gz";
      } else {
        downloadLink = "https://aka.ms/downloadazcopy-v10-mac";
        downloadedFileRelativePath = "./scripts/bin/azcopy_linux.tar.gz";
      }

      await wrapSpinner(`Downloading azcopy from ${downloadLink}`, async () => {
        await fetch(downloadLink).then(
          writeDownload(downloadedFileRelativePath)
        );
      });

      await wrapSpinner(
        "Extracting...",
        () =>
          new Promise((resolve, reject) => {
            const azcopyBinFile = path.resolve(
              __dirname,
              "./scripts/bin/",
              azcopyFilename
            );
            const zipPath = path.resolve(__dirname, downloadedFileRelativePath);
            fs.createReadStream(zipPath)
              .pipe(unzipper.Parse())
              .on("entry", function (entry) {
                const fileName = entry.path;
                const type = entry.type; // 'Directory' or 'File'
                const size = entry.vars.uncompressedSize; // There is also compressedSize;
                if (fileName.endsWith(azcopyFilename)) {
                  entry.pipe(fs.createWriteStream(azcopyBinFile));
                } else {
                  entry.autodrain();
                }
              })
              .promise()
              .then(
                () => {
                  fs.unlinkSync(zipPath);
                  chmod(azcopyBinFile, 0o100, (err) => {
                    resolve();
                  });
                },
                (e) => {
                  console.log("error", e);
                  reject(e);
                }
              );
          })
      );
    }
  }

  const args = process.argv.slice(2, process.argv.length).filter((arg) => {
    return !argsToFilter.includes(arg);
  });

  const allArguments = args.concat(extraArguments);

  const escapedCommand = shellEscape(allArguments);
  console.log("------ executing azcopy ------ \n");
  execSync(`${binPath} ${escapedCommand}`, commonExecOptions);
}
