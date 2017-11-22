import nock from 'nock';

export default function authenticate(
  {githubToken = 'GH_TOKEN', githubUrl = 'https://api.github.com', githubApiPathPrefix = ''} = {}
) {
  return nock(`${githubUrl}/${githubApiPathPrefix}`, {reqheaders: {authorization: `token ${githubToken}`}});
}
