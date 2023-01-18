module.exports = {
  roots: [
    "src"
  ],

  testMatch: [
    "<rootDir>/**/*.test.ts"
  ],

  transform: {
    "^.+\.(ts|tsx)$": "ts-jest"
  },
  
  testEnvironment: "node",

  setupFiles: []
}