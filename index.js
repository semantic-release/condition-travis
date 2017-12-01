const {parse} = require('url');
const GitHubApi = require('github');
const parseGithubUrl = require('parse-github-url');
const deployOnce = require('travis-deploy-once');
const SemanticReleaseError = require('@semantic-release/error');
const resolveConfig = require('./lib/resolve-config');

module.exports = async function(pluginConfig, {options: {branch, repositoryUrl}}) {
  const {githubToken, githubUrl, githubApiPathPrefix, travisUrl} = resolveConfig(pluginConfig);
  if (process.env.TRAVIS !== 'true') {
    throw new SemanticReleaseError(
      'semantic-release didn’t run on Travis CI and therefore a new version won’t be published.\nYou can customize this behavior using "verifyConditions" plugins: git.io/sr-plugins',
      'ENOTRAVIS'
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(process.env, 'TRAVIS_PULL_REQUEST') &&
    process.env.TRAVIS_PULL_REQUEST !== 'false'
  ) {
    throw new SemanticReleaseError(
      'This test run was triggered by a pull request and therefore a new version won’t be published.',
      'EPULLREQUEST'
    );
  }

  if (branch !== process.env.TRAVIS_BRANCH) {
    throw new SemanticReleaseError(
      `This test run was triggered on the branch ${
        process.env.TRAVIS_BRANCH
      }, while semantic-release is configured to only publish from ${branch}.\nYou can customize this behavior using the "branch" option: git.io/sr-options`,
      'EBRANCHMISMATCH'
    );
  }

  const {name: repo, owner} = parseGithubUrl(repositoryUrl);
  if (!owner || !repo) {
    throw new SemanticReleaseError('The git repository URL ${} is not a valid Github URL.', 'EINVALIDGITURL');
  }

  let {port, protocol, hostname: host} = githubUrl ? parse(githubUrl) : {};
  protocol = (protocol || '').split(':')[0] || null;

  const github = new GitHubApi({port, protocol, host, pathPrefix: githubApiPathPrefix});
  github.authenticate({type: 'token', token: githubToken});

  const {data: {private: pro}} = await github.repos.get({owner, repo});

  const result = await deployOnce({travisOpts: {pro, enterprise: travisUrl}});

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
