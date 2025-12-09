/* eslint-disable prettier/prettier */
export default {
  displayName: {
    name: 'Jazzer.js',
    color: 'cyan',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.fuzz.ts'],
  testRunner: '@jazzer.js/jest-runner',
  
  testTimeout: 30000,
  maxWorkers: 1, // Фаззинг работает в одном воркере
  maxConcurrency: 1,

  bail: 0,
  
  
  
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>../../tsconfig.json',
      },
    ],
  },
  
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^types/src/(.*)$': '<rootDir>/../types/src/$1',
  },
  
  // Отключаем кэширование для фаззинга
  cache: false,
  
  verbose: true,
  
  // Глобальные переменные для Jazzer.js
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>../../tsconfig.json',
    },
    jazzer: {
      fuzzTime: 60,
      maxLength: 4096,
      corpus: './corpus', 
      dictionary: true,
    },
  },
};