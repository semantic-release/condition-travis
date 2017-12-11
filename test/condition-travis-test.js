import test from 'ava';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import nock from 'nock';
import SemanticReleaseError from '@semantic-release/error';
import authenticate from './helpers/mock-github';

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Delete env variables in case they are on the machine running the tests
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GH_URL;
  delete process.env.GITHUB_URL;
  delete process.env.GH_PREFIX;
  delete process.env.GITHUB_PREFIX;
  delete process.env.TRAVIS;
  delete process.env.TRAVIS_PULL_REQUEST;
  delete process.env.TRAVIS_BRANCH;
  delete process.env.TRAVIS_URL;
  delete process.env.TRAVIS_PREFIX;
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
  // Reset nock
  nock.cleanAll();
});

test.serial('Only runs on travis', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});

  const error = await t.throws(condition({}, {options: {}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOTRAVIS');
  t.true(travisDeployOnce.notCalled);
});

test.serial('Not running on pull requests', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_PULL_REQUEST = '105';

  const error = await t.throws(condition({}, {options: {}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EPULLREQUEST');
  t.true(travisDeployOnce.notCalled);
});

test.serial('Does not run on non-master branch by default', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'notmaster';

  const error = await t.throws(condition({}, {options: {branch: 'master'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EBRANCHMISMATCH');
  t.true(travisDeployOnce.notCalled);
});

test.serial('Does not run on master if branch configured as "foo"', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';

  const error = await t.throws(condition({}, {options: {branch: 'foo'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EBRANCHMISMATCH');
  t.true(travisDeployOnce.notCalled);
});

test.serial('travis-deploy-once resolves with true', async t => {
  const travisDeployOnce = stub().resolves(true);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';

  const result = await condition(
    {githubToken},
    {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}}
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once resolves with null', async t => {
  const travisDeployOnce = stub().resolves(null);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  process.env.GITHUB_TOKEN = 'github_token';
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const pro = false;
  const github = authenticate({githubToken: process.env.GITHUB_TOKEN})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    condition({}, {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOBUILDLEADER');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once resolves with false', async t => {
  const travisDeployOnce = stub().resolves(false);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  process.env.GH_TOKEN = 'github_token';
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const pro = false;
  const github = authenticate({githubToken: process.env.GH_TOKEN})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    condition({}, {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EOTHERSFAILED');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once rejects with error', async t => {
  const travisDeployOnce = stub().rejects(new Error('travis-deploy-once error'));
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    condition(
      {githubToken},
      {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}}
    )
  );

  t.true(error instanceof Error);
  t.is(error.message, 'travis-deploy-once error');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('Throw SemanticReleaseError for invalid repositoryUrl', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const githubToken = 'github_token';
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';

  const error = await t.throws(condition({githubToken}, {options: {branch: 'master', repositoryUrl: 'invalid_url'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EINVALIDGITURL');
});

test.serial('Throws an error if github call fails', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(401);

  const error = await t.throws(
    condition(
      {githubToken},
      {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}}
    )
  );

  t.true(error instanceof Error);
  t.is(error.code, 401);
  t.true(github.isDone());
});

test.serial('Calls travis-run-once with pro parameter determined by github call', async t => {
  const travisDeployOnce = stub().resolves(true);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = true;
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const result = await condition(
    {githubToken},
    {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}}
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('Calls travis-run-once with pro parameter determined by github call with githubUrl', async t => {
  const travisDeployOnce = stub().resolves(true);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = true;
  const githubUrl = 'https://testurl.com:443';
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  const github = authenticate({githubToken, githubUrl})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const result = await condition(
    {githubToken, githubUrl},
    {options: {branch: 'master', repositoryUrl: `git+https://testurl.com:443/${owner}/${repo}.git`}}
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: undefined}});
  t.true(github.isDone());
});

test.serial('Calls travis-run-once with enterprise parameter', async t => {
  const travisDeployOnce = stub().resolves(true);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  const travisUrl = 'https://travis.example.com';
  const travisApiPathPrefix = '/api';
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});
  process.env.TRAVIS = 'true';
  process.env.TRAVIS_BRANCH = 'master';

  const result = await condition(
    {githubToken, travisUrl, travisApiPathPrefix},
    {options: {branch: 'master', repositoryUrl: `git+https://github.com/${owner}/${repo}.git`}}
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro, enterprise: travisUrl + travisApiPathPrefix}});
  t.true(github.isDone());
});
