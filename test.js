var Promise = require('bluebird')
var proxyquire = require('proxyquire')
var test = require('tap').test
var SRError = require('@semantic-release/error')

var condition = proxyquire('./', {
  'travis-deploy-once': Promise.resolve.bind(null, true)
})

test('raise errors in travis environment', function (t) {
  t.test('only runs on travis', function (tt) {
    tt.plan(3)

    condition({}, {env: {}}, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOTRAVIS')
      tt.is(err.stop, false)
    })
  })

  t.test('not running on pull requests', function (tt) {
    tt.plan(3)
    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_PULL_REQUEST: '105'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EPULLREQUEST')
      tt.is(err.stop, false)
    })
  })

  t.test('not running on tags', function (tt) {
    tt.plan(3)
    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_PULL_REQUEST: 'false',
        TRAVIS_TAG: 'v1.0.0'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EGITTAG')
      tt.is(err.stop, false)
    })
  })

  t.test('only running on specified branch', function (tt) {
    tt.plan(7)

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, null)
    })

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'notmaster'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
      tt.is(err.stop, false)
    })

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'foo'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
      tt.is(err.stop, false)
    })
  })

  t.test('supports travis-deploy-once', function (tt) {
    tt.plan(8)

    proxyquire('./', {
      'travis-deploy-once': Promise.resolve.bind(null, true)
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, null)
    })

    proxyquire('./', {
      'travis-deploy-once': Promise.resolve.bind(null, null)
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOBUILDLEADER')
      tt.is(err.stop, false)
    })

    proxyquire('./', {
      'travis-deploy-once': Promise.resolve.bind(null, false)
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EOTHERSFAILED')
      tt.is(err.stop, false)
    })

    var error = new Error()
    proxyquire('./', {
      'travis-deploy-once': Promise.reject.bind(null, error)
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, error)
    })
  })

  t.end()
})
