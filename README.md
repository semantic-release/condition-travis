# condition-travis

[![npm version](https://badge.fury.io/js/%40semantic-release%2Fcondition-travis.svg)](http://badge.fury.io/js/%40semantic-release%2Fcondition-travis)
[![Build Status](https://travis-ci.org/semantic-release/condition-travis.svg?branch=next)](https://travis-ci.org/semantic-release/condition-travis)
[![Coverage Status](https://coveralls.io/repos/semantic-release/condition-travis/badge.svg?branch=next&service=github)](https://coveralls.io/github/semantic-release/condition-travis?branch=next)
[![Dependency Status](https://david-dm.org/semantic-release/condition-travis/next.svg)](https://david-dm.org/semantic-release/condition-travis/next)
[![devDependency Status](https://david-dm.org/semantic-release/condition-travis/next/dev-status.svg)](https://david-dm.org/semantic-release/condition-travis/next#info=devDependencies)

`@semantic-release/condition-travis` is the default implementation of
`semantic-release`’s [verifyConditions](https://github.com/semantic-release/semantic-release#verifyconditions)
extension point. I tests that the publish is

1. happening on Travis,
2. on the right branch and
3. not happening before all jobs succeeded

## License

MIT
