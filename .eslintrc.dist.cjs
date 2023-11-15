// Liniting rules to fix up JS formatting for EGO review.
module.exports = {
  extends: [],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  rules: {
    "lines-between-class-members": ["error", "always"],
    "padding-line-between-statements": [
      "error",
      { "blankLine": "always", "prev": "*", "next": "class" },
      { "blankLine": "always", "prev": "*", "next": "function" },
      { "blankLine": "always", "prev": "*", "next": "return" },
      { "blankLine": "always", "prev": "*", "next": "export" },
      { "blankLine": "always", "prev": "*", "next": "multiline-const" },
    ]
  },
  ignorePatterns: []
};
