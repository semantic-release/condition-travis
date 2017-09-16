import test from 'ava';
import pify from 'pify';
import proxyquire from 'proxyquire';
import simple from 'simple-mock';
import SemanticReleaseError from '@semantic-release/error';

const conditionMock = {'travis-deploy-once': () => {}};

test('only runs on travis', async t => {
  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(pify(condition)({}, {env: {}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOTRAVIS');
});

test('not running on pull requests', async t => {
  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: '105'}}));

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EPULLREQUEST');
});

test('not running on tags', async t => {
  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: 'false', TRAVIS_TAG: 'v1.0.0'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EGITTAG');
});

test('not running on tags that don’t look like semantic versions', async t => {
  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_PULL_REQUEST: 'false', TRAVIS_TAG: 'vfoo'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EGITTAG');
});

test('only runs on master by default', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true);

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const result = await pify(condition)(
    {},
    {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'master'}}
  );
  t.falsy(result);
});

test('does not run on non-master branch by default', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true);

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'notmaster'}, options: {branch: 'master'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EBRANCHMISMATCH');
});

test('does not run on master if branch configured as "foo"', async t => {
  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'foo'}})
  );

  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EBRANCHMISMATCH');
});

test('travis-deploy-once resolves with true', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(true);

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const result = await pify(condition)(
    {},
    {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'master'}}
  );
  t.falsy(result);
});

test('travis-deploy-once resolves with null', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(null);

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'master'}})
  );
  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'ENOBUILDLEADER');
});

test('travis-deploy-once resolves with false', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').resolveWith(false);

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'master'}})
  );
  t.true(error instanceof SemanticReleaseError);
  t.is(error.code, 'EOTHERSFAILED');
});

test('travis-deploy-once rejects with error', async t => {
  simple.mock(conditionMock, 'travis-deploy-once').rejectWith(new Error());

  const condition = proxyquire.noCallThru()('../', conditionMock);
  const error = await t.throws(
    pify(condition)({}, {env: {TRAVIS: 'true', TRAVIS_BRANCH: 'master'}, options: {branch: 'master'}})
  );
  t.true(error instanceof Error);
  t.truthy(error);
});
