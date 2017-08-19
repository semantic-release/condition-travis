const deployOnce = require('travis-deploy-once')

const semver = require('semver')
const SRError = require('@semantic-release/error')

module.exports = async function (pluginConfig, config, callback) {
  const env = config.env
  const options = config.options

  if (env.TRAVIS !== 'true') {
    return callback(new SRError(
      'semantic-release didn’t run on Travis CI and therefore a new version won’t be published.\n' +
      'You can customize this behavior using "verifyConditions" plugins: git.io/sr-plugins',
      'ENOTRAVIS'
    ))
  }

  if (env.hasOwnProperty('TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') {
    return callback(new SRError(
      'This test run was triggered by a pull request and therefore a new version won’t be published.',
      'EPULLREQUEST'
    ))
  }

  if (env.TRAVIS_TAG) {
    let errorMessage = 'This test run was triggered by a git tag and therefore a new version won’t be published.'

    if (semver.valid(env.TRAVIS_TAG)) {
      errorMessage += '\nIt is very likely that this tag was created by semantic-release itself.\n' +
       'Everything is okay. For log output of the actual publishing process look at the build that ran before this one.'
    }

    return callback(new SRError(errorMessage, 'EGITTAG'))
  }

  if (options.branch !== env.TRAVIS_BRANCH) {
    return callback(new SRError(
      'This test run was triggered on the branch ' + env.TRAVIS_BRANCH +
      ', while semantic-release is configured to only publish from ' +
      options.branch + '.\n' +
      'You can customize this behavior using the "branch" option: git.io/sr-options',
      'EBRANCHMISMATCH'
    ))
  }

  let result
  try {
    result = await deployOnce()
  } catch (error) {
    return callback(error)
  }

  if (result == null) {
    return callback(new SRError(
      'This test run is not the build leader and therefore a new version won’t be published.',
      'ENOBUILDLEADER'
    ))
  }

  if (result === false) {
    return callback(new SRError(
      'In this test run not all jobs passed and therefore a new version won’t be published.',
      'EOTHERSFAILED'
    ))
  }

  callback(null)
}
