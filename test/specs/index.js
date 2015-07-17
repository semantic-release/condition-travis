const { test } = require('tap')
const SRError = require('@semantic-release/error')

const condition = require('../../dist')

test('raise errors in travis environment', (t) => {
  t.test('only runs on travis', (tt) => {
    tt.plan(2)

    condition({}, {}, {}, {}, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOTRAVIS')
    })
  })

  t.test('not running on pull requests', (tt) => {
    tt.plan(2)
    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: '105'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EPULLREQUEST')
    })
  })

  t.test('not running on tags', (tt) => {
    tt.plan(2)
    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: 'false',
      TRAVIS_TAG: 'v1.0.0'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EGITTAG')
    })
  })

  t.test('only running on specified branch', (tt) => {
    tt.plan(5)

    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    }, (err) => {
      tt.is(err, null)
    })

    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'notmaster'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
    })

    condition({}, {
      release: {
        branch: 'foo'
      }
    }, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
    })
  })

  t.test('supports travis_after_all', (tt) => {
    tt.plan(5)

    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master',
      BUILD_LEADER: 'YES',
      BUILD_AGGREGATE_STATUS: 'others_succeeded'
    }, (err) => {
      tt.is(err, null)
    })

    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master',
      BUILD_MINION: 'YES'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOBUILDLEADER')
    })

    condition({}, {}, {}, {
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'master',
      BUILD_LEADER: 'YES',
      BUILD_AGGREGATE_STATUS: 'others_failed'
    }, (err) => {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EOTHERSFAILED')
    })
  })
})
