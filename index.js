const url = require('url');
const GitHubApi = require('github');
const parseSlug = require('parse-github-repo-url');
const semver = require('semver');
const deployOnce = require('travis-deploy-once');
const SemanticReleaseError = require('@semantic-release/error');
const resolveConfig = require('./lib/resolve-config');

module.exports = async function(pluginConfig, {pkg, env, options: {branch}}) {
  const {githubToken, githubUrl, githubApiPathPrefix} = resolveConfig(pluginConfig);
  if (env.TRAVIS !== 'true') {
    throw new SemanticReleaseError(
      'semantic-release didn’t run on Travis CI and therefore a new version won’t be published.\nYou can customize this behavior using "verifyConditions" plugins: git.io/sr-plugins',
      'ENOTRAVIS'
    );
  }

  if (Object.prototype.hasOwnProperty.call(env, 'TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') {
    throw new SemanticReleaseError(
      'This test run was triggered by a pull request and therefore a new version won’t be published.',
      'EPULLREQUEST'
    );
  }

  if (env.TRAVIS_TAG) {
    let errorMessage = 'This test run was triggered by a git tag and therefore a new version won’t be published.';

    if (semver.valid(env.TRAVIS_TAG)) {
      errorMessage +=
        '\nIt is very likely that this tag was created by semantic-release itself.\nEverything is okay. For log output of the actual publishing process look at the build that ran before this one.';
    }

    throw new SemanticReleaseError(errorMessage, 'EGITTAG');
  }

  if (branch !== env.TRAVIS_BRANCH) {
    throw new SemanticReleaseError(
      `This test run was triggered on the branch ${
        env.TRAVIS_BRANCH
      }, while semantic-release is configured to only publish from ${
        branch
      }.\nYou can customize this behavior using the "branch" option: git.io/sr-options`,
      'EBRANCHMISMATCH'
    );
  }

  const {port, protocol, hostname} = githubUrl ? url.parse(githubUrl) : {};
  const github = new GitHubApi({
    port,
    protocol: (protocol || '').split(':')[0] || null,
    host: hostname,
    pathPrefix: githubApiPathPrefix || null,
  });
  github.authenticate({type: 'token', token: githubToken});

  const [owner, repo] = parseSlug(pkg.repository.url);
  const {data: {private: pro}} = await github.repos.get({owner, repo});

  const result = await deployOnce({travisOpts: {pro}});

  if (result === null) {
    throw new SemanticReleaseError(
      'This test run is not the build leader and therefore a new version won’t be published.',
      'ENOBUILDLEADER'
    );
  }

  if (result === false) {
    throw new SemanticReleaseError(
      'In this test run not all jobs passed and therefore a new version won’t be published.',
      'EOTHERSFAILED'
    );
  }
};
