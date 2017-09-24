# condition-travis

[![npm](https://img.shields.io/npm/v/@semantic-release/condition-travis.svg)](https://www.npmjs.com/package/@semantic-release/condition-travis)
[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/condition-travis.svg)](https://greenkeeper.io/)
[![license](https://img.shields.io/github/license/semantic-release/condition-travis.svg)](https://github.com/semantic-release/condition-travis/blob/master/LICENSE)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[![Travis](https://img.shields.io/travis/semantic-release/condition-travis.svg)](https://travis-ci.org/semantic-release/condition-travis)
[![Codecov](https://img.shields.io/codecov/c/github/semantic-release/condition-travis.svg)](https://codecov.io/gh/semantic-release/condition-travis)

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
