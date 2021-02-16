/// <reference types="node" />
export declare const SupportedArchitectures: string[];
export declare const SupportedPlatforms: NodeJS.Platform[];
export declare const SupportedArchAndPlatform: string[];
export declare type ArgType<T> = T extends (...args: infer D) => unknown ? D : never;
