export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "perf", "docs", "test", "build", "ci", "chore", "revert"],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};
