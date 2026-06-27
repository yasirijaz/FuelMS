/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'docs',     // documentation only
        'style',    // formatting — no logic change
        'refactor', // code change without feat or fix
        'perf',     // performance improvement
        'test',     // adding or updating tests
        'build',    // build system or external dependency changes
        'ci',       // CI configuration files
        'chore',    // other changes that don't fit above
        'revert',   // revert a previous commit
        'arch',     // architecture decisions / ADRs
        'wip',      // work in progress (should never reach main)
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 120],
  },
}
