const { send, createError } = require('micro');
const api = require('./api');
const { schema } = require('./config');
const db = require('./db');

exports.handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      console.error(err.stack);
    }

    send(res, err.statusCode || 500, { error: true, message: err.message });
  }
};

exports.getResource = async ({ username, reponame, resource }) => {
  // Create resource if it does exist
  if (!await db.has(`${username}:${resource}`)) {
    try {
      // check if username or repo exist
      await api.getRepo({ username, reponame });
    } catch (err) {
      // if user exist but has no repository optimisticaly create one
      if (err.statusCode === 404) {
        await api.createRepo(reponame);
      } else {
        throw err;
      }
    }

    try {
      const { content, sha } = await api.read({ username, reponame, resource });
      await db.put(`${username}:${resource}`, { content, sha });
    } catch (err) {
      if (err.statusCode === 404) {
        const { content, sha } = await api
          .write({ username, reponame, resource, data: schema[resource] })
          .then(res => ({ sha: res.content.sha, content: schema[resource] }));

        await db.put(`${username}:${resource}`, { content, sha });
      } else {
        throw err;
      }
    }
  }

  return await db.get(`${username}:${resource}`);
};
