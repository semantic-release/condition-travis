import test from 'ava';
import pify from 'pify';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import nock from 'nock';
import {authenticate} from './helpers/mock-github';
import SemanticReleaseError from '@semantic-release/error';

test.afterEach.always(t => {
  // Reset nock
  nock.cleanAll();
});

test('Only runs on travis', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const error = await t.throws(pify(condition)({}, {env: {}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOTRAVIS');
  t.true(travisDeployOnce.notCalled);
});

test('Not running on pull requests', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const error = await t.throws(pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: '105'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EPULLREQUEST');
  t.true(travisDeployOnce.notCalled);
});

test('Not running on tags', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: 'false', TRAVIS_TAG: 'v1.0.0'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EGITTAG');
  t.true(travisDeployOnce.notCalled);
});

test('Not running on tags that don’t look like semantic versions', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: 'false', TRAVIS_TAG: 'vfoo'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EGITTAG');
  t.true(travisDeployOnce.notCalled);
});

test('Does not run on non-master branch by default', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});

  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'notmaster'}, options: {branch: 'master'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EBRANCHMISMATCH');
  t.true(travisDeployOnce.notCalled);
});

test('Does not run on master if branch configured as "foo"', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'foo'}})
  );

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

  const result = await pify(condition)(
    {},
    {
      pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
      env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
      options: {branch: 'master', githubToken},
    }
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once resolves with null', async t => {
  const travisDeployOnce = stub().resolves(null);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    pify(condition)(
      {},
      {
        pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
        env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
        options: {branch: 'master', githubToken},
      }
    )
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOBUILDLEADER');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once resolves with false', async t => {
  const travisDeployOnce = stub().resolves(false);
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    pify(condition)(
      {},
      {
        pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
        env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
        options: {branch: 'master', githubToken},
      }
    )
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EOTHERSFAILED');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
  t.true(github.isDone());
});

test.serial('travis-deploy-once rejects with error', async t => {
  const travisDeployOnce = stub().rejects(new Error('travis-deploy-once error'));
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const pro = false;
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const error = await t.throws(
    pify(condition)(
      {},
      {
        pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
        env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
        options: {branch: 'master', githubToken},
      }
    )
  );

  t.true(error instanceof Error);
  t.is(error.message, 'travis-deploy-once error');
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
  t.true(github.isDone());
});

test.serial('Throws an error if github call fails', async t => {
  const travisDeployOnce = stub();
  const condition = proxyquire('../', {'travis-deploy-once': travisDeployOnce});
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(401);

  const error = await t.throws(
    pify(condition)(
      {},
      {
        pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
        env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
        options: {branch: 'master', githubToken},
      }
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
  const github = authenticate({githubToken})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const result = await pify(condition)(
    {},
    {
      pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
      env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
      options: {branch: 'master', githubToken},
    }
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
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
  const github = authenticate({githubToken, githubUrl})
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {private: pro});

  const result = await pify(condition)(
    {},
    {
      pkg: {repository: {url: `git+https://github.com/${owner}/${repo}.git`}},
      env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'},
      options: {branch: 'master', githubToken, githubUrl},
    }
  );

  t.falsy(result);
  t.true(travisDeployOnce.calledOnce);
  t.deepEqual(travisDeployOnce.firstCall.args[0], {travisOpts: {pro}});
  t.true(github.isDone());
});
