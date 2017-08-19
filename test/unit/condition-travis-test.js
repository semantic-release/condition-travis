const proxyquire = require('proxyquire').noCallThru()
const simple = require('simple-mock')
const SRError = require('@semantic-release/error')
const {test} = require('tap')

const conditionMock = {
  'travis-deploy-once': () => {}
}

test('only runs on travis', function (t) {
  const condition = proxyquire('../../', conditionMock)
  condition({}, {env: {}}, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'ENOTRAVIS')
    t.end()
  })
})

test('not running on pull requests', function (t) {
  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: '105'
    }
  }, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EPULLREQUEST')
    t.end()
  })
})

test('not running on tags', function (t) {
  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: 'false',
      TRAVIS_TAG: 'v1.0.0'
    }
  }, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EGITTAG')
    t.end()
  })
})

test('not running on tags that don’t look like semantic versions', function (t) {
  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: 'false',
      TRAVIS_TAG: 'vfoo'
    }
  }, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EGITTAG')
    t.end()
  })
})

test('only runs on master by default', function (t) {
  t.plan(1)
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true)

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'master'
    }
  }, t.error)
})

test('does not run on non-master branch by default', function (t) {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true)

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'notmaster'
    },
    options: {
      branch: 'master'
    }
  }, (error) => {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EBRANCHMISMATCH')
    t.end()
  })
})

test('does not run on master if branch configured as "foo"', function (t) {
  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'foo'
    }
  }, (error) => {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EBRANCHMISMATCH')
    t.end()
  })
})

test('travis-deploy-once resolves with true', function (t) {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true)

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'master'
    }
  }, function (error) {
    t.is(error, null)
    t.end()
  })
})

test('travis-deploy-once resolves with null', function (t) {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(null)

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'master'
    }
  }, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'ENOBUILDLEADER')
    t.end()
  })
})

test('travis-deploy-once resolves with false', function (t) {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(false)

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'master'
    }
  }, function (error) {
    t.ok(error instanceof SRError)
    t.is(error.code, 'EOTHERSFAILED')
    t.end()
  })
})

test('travis-deploy-once rejects with error', function (t) {
  simple.mock(conditionMock, 'travis-deploy-once').rejectWith(new Error())

  const condition = proxyquire('../../', conditionMock)
  condition({}, {
    env: {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    },
    options: {
      branch: 'master'
    }
  }, function (error) {
    t.is(error, error)
    t.end()
  })
})
