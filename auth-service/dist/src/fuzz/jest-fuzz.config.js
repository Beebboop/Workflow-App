"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    displayName: {
        name: 'Jazzer.js',
        color: 'cyan',
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.fuzz.ts'],
    testRunner: '@jazzer.js/jest-runner',
    testTimeout: 30000,
    maxWorkers: 1,
    maxConcurrency: 1,
    bail: 0,
    setupFilesAfterEnv: [],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>../../tsconfig.json',
                isolatedModules: true,
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^types/src/(.*)$': '<rootDir>/../types/src/$1',
    },
    cache: false,
    verbose: true,
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>../../tsconfig.json',
        },
    },
};
//# sourceMappingURL=jest-fuzz.config.js.map