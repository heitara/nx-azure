import * as ora from "ora";
import { ArgType } from "./azcopy.types";
export declare function ensureBinFolder(): Promise<unknown>;
export declare function writeDownload(relativeFilePath: string): (res: any) => Promise<unknown>;
export declare function wrapSpinner(oraOptions: ArgType<typeof ora>[0], fn: () => Promise<unknown>): Promise<void>;
export declare function shellEscape(args: string[]): string;
