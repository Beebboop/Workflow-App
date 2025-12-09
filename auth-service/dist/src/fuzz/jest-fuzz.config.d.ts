declare const _default: {
    displayName: {
        name: string;
        color: string;
    };
    preset: string;
    testEnvironment: string;
    testMatch: string[];
    testRunner: string;
    testTimeout: number;
    maxWorkers: number;
    maxConcurrency: number;
    bail: number;
    setupFilesAfterEnv: never[];
    transform: {
        '^.+\\.ts$': (string | {
            tsconfig: string;
            isolatedModules: boolean;
        })[];
    };
    moduleFileExtensions: string[];
    moduleNameMapper: {
        '^types/src/(.*)$': string;
    };
    cache: boolean;
    verbose: boolean;
    globals: {
        'ts-jest': {
            tsconfig: string;
        };
    };
};
export default _default;
