/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest"], // sin isolatedModules aquí
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/e2e/", // ⬅️ EXCLUIR playwright de Jest
  ],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
