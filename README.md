# condition-travis

[![npm version](https://badge.fury.io/js/%40semantic-release%2Fcondition-travis.svg)](http://badge.fury.io/js/%40semantic-release%2Fcondition-travis)
[![Build Status](https://travis-ci.org/semantic-release/condition-travis.svg?branch=next)](https://travis-ci.org/semantic-release/condition-travis)
[![Coverage Status](https://coveralls.io/repos/semantic-release/condition-travis/badge.svg?branch=next&service=github)](https://coveralls.io/github/semantic-release/condition-travis?branch=next)
[![Dependency Status](https://david-dm.org/semantic-release/condition-travis/next.svg)](https://david-dm.org/semantic-release/condition-travis/next)
[![devDependency Status](https://david-dm.org/semantic-release/condition-travis/next/dev-status.svg)](https://david-dm.org/semantic-release/condition-travis/next#info=devDependencies)

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
`@semantic-release/condition-travis` is the default implementation of
`semantic-release`’s [verifyConditions](https://github.com/semantic-release/semantic-release#verifyconditions)
extension point. I tests that the publish is

1. happening on Travis,
2. on the right branch and
3. not happening before all jobs succeeded

## Usage

```js
const condition = require('@semantic-release/condition-travis')

const pluginConfig = {} // not used in this plugin
const config = {
  options: {
    // set to repository’s main branch. It's "master" by default but can
    // be configured in the repository’s settings
    branch: 'master'
  },
  env: {
    // Travis environment variables
    // see https://docs.travis-ci.com/user/environment-variables/#Default-Environment-Variables

    // used to check if run on travis
    TRAVIS: 'true',

    // used to check if run on repository’s main branch
    TRAVIS_BRANCH: 'master',

    // builds triggered by a PR are ignored
    TRAVIS_PULL_REQUEST: 'false',

    // builds triggered by tags are ignored.
    // Most often the tags have been created by semantic-release itself
    TRAVIS_TAG: 'v1.2.3'
  }
}
condition(pluginConfig)
```

## License

MIT
