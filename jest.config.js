module.exports = {
  collectCoverageFrom: [
    "<rootDir>/src/**/*.js",
    "!**/node_modules/**",
    "!**/__mocks__/**",
    "!**/coverage/**",
    "!<rootDir>/jest.config.js",
    "!<rootDir>/dist/**",
  ],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testURL: "http://localhost:3000/",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.js?$",
};
