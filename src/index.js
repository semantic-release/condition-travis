const SRError = require('@semantic-release/error')

module.exports = function (options, pkg, argv, env, cb) {
  if (env.TRAVIS !== 'true') return cb(new SRError('Not running on Travis', 'ENOTRAVIS'))

  if (env.hasOwnProperty('TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') return cb(new SRError('Not publishing from pull requests', 'EPULLREQUEST'))
  if (env.TRAVIS_TAG) return cb(new SRError('Not publishing from tags', 'EGITTAG'))

  const branch = (pkg.release || {}).branch || 'master'

  if (branch !== env.TRAVIS_BRANCH) return cb(new SRError(`Branch is not ${branch}`, 'EBRANCHMISMATCH'))

  if (env.hasOwnProperty('BUILD_LEADER')) {
    if (env.BUILD_LEADER !== 'YES') return cb(new SRError('Not publishing from minion', 'ENOBUILDLEADER'))
    if (env.BUILD_AGGREGATE_STATUS !== 'others_succeeded') return cb(new SRError('Not publishing when other jobs in the build matrix fail.', 'EOTHERSFAILED'))
  }

  cb(null)
}
