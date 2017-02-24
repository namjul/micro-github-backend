const axios = require('axios');
const { Base64 } = require('js-base64');
const Papa = require('papaparse');
const { createError } = require('micro');

const instance = axios.create({
  baseURL: 'https://api.github.com',
  validateStatus: false,
  transformResponse: [data => data]
});

// disable axios default reject
instance.defaults.validateStatus = () => true;

const hasToken = () =>
  instance.defaults.headers.common['authorization'].indexOf('token') >= 0;

exports.auth = function auth(auth) {
  if (auth.token) {
    instance.defaults.headers.common['authorization'] = `token ${auth.token}`;
  } else if (auth.username && auth.password) {
    instance.defaults.headers.common[
      'authorization'
    ] = `Basic ${Base64.encode(auth.username + ':' + auth.password)}`;
  }
};

exports.me = function me(username) {
  return instance
    .request({ url: hasToken() ? '/user' : `/users/${username}` })
    .then(res => {
      if (res.status === 404) {
        throw createError(404, 'User not found');
      }

      if (res.status === 401) {
        throw createError(401, 'User unauthorized');
      }

      return res;
    })
    .then(checkStatus)
    .then(toJSON);
};

exports.getRepo = function getRepo({ username, reponame }) {
  return instance
    .request({ url: `/repos/${username}/${reponame}` })
    .then(checkStatus)
    .then(toJSON);
};

exports.createRepo = function createRepo(reponame) {
  return instance
    .request({ method: 'post', url: `/user/repos`, data: { name: reponame } })
    .then(checkStatus)
    .then(toJSON);
};

exports.read = function read(
  { username, reponame, resource, format = 'json' }
) {
  validate(username, reponame, resource);
  return instance
    .request({
      method: 'get',
      url: `/repos/${username}/${reponame}/contents/${resource}${format === 'assets' ? '' : '.' + format}`
    })
    .then(checkStatus)
    .then(toJSON)
    .then(decodeContent)
    .then(parseJSON);
};

exports.write = function write(
  { username, reponame, resource, data, sha, format = 'json', filename }
) {
  validate(username, reponame, resource);
  return instance
    .request({
      method: 'put',
      url: `/repos/${username}/${reponame}/contents/${resource}${format === 'assets' ? '/' + filename : '.' + format}`,
      sha,
      data: {
        message: `Update ${resource}`,
        sha,
        content: encodeContent(
          format === 'asset'
            ? unparseAsset(data)
            : format === 'json' ? unparseJSON(data) : unparseCSV(data)
        )
      }
    })
    .then(checkStatus)
    .then(toJSON);
};

exports.remove = function remove(
  { username, reponame, resource, sha, format = 'json', filename }
) {
  validate(username, reponame, resource);
  return instance
    .request({
      message: `Delete ${resource}`,
      url: `/repos/${username}/${reponame}/contents/${resource}${format === 'asset' ? '/' + filename : '.' + format}`,
      data: { message: 'update repo', sha }
    })
    .then(checkStatus);
};

function toJSON(response) {
  if (typeof response.data === 'string') {
    try {
      return JSON.parse(response.data);
    } catch (e) {}
  }
}

function upload(username, reponame, resource, data) {}

function validate(username, reponame, resource) {
  if (!username) {
    throw new Error('Missing username ');
  }

  if (!reponame) {
    throw new Error('Missing reponame');
  }

  if (!resource) {
    throw new Error('Missing resource');
  }
}

// stringify
function encodeContent(content) {
  return Base64.encode(content);
}

function unparseJSON(content) {
  return JSON.stringify(content, null, 2) + '\n';
}

function unparseCSV(content) {
  return Papa.unparse(content) + '\n';
}

function unparseAsset(content) {}

// parse
function decodeContent(response) {
  return Object.assign(response, { content: Base64.decode(response.content) });
}

function parseJSON(response) {
  return Object.assign(response, { content: JSON.parse(response.content) });
}

function parseCSV(response) {
  return Object.assign(response, { content: Papa.parse(response.content) });
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  throw createError(
    response.status,
    `${response.statusText} ${response.config.url}`
  );
}
