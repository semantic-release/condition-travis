const travisAfterAll = require('travis-after-all')

const SRError = require('@semantic-release/error')

module.exports = function (pluginConfig, {env, options}, cb) {
  if (env.TRAVIS !== 'true') return cb(new SRError('Not running on Travis', 'ENOTRAVIS'))

  if (env.hasOwnProperty('TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') return cb(new SRError('Not publishing from pull requests', 'EPULLREQUEST'))
  if (env.TRAVIS_TAG) return cb(new SRError('Not publishing from tags', 'EGITTAG'))

  if (options.branch !== env.TRAVIS_BRANCH) return cb(new SRError(`Branch is not ${options.branch}`, 'EBRANCHMISMATCH'))

  travisAfterAll((code, err) => {
    if (code === 0) return cb(null)

    if (code === 1) return cb(new SRError('Not publishing when other jobs in the build matrix fail.', 'EOTHERSFAILED'))

    if (code === 2) return cb(new SRError('Not publishing from minion', 'ENOBUILDLEADER'))

    cb(err || new SRError('travis-after-all return unexpected error code', 'ETAAFAIL'))
  })
}
