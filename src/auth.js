const crypto = require('crypto');
const db = require('./db');
const api = require('./api');
const { createError } = require('micro');
const { secret, repo: defaultReponame } = require('./config');

function getHeaders(req) {
  const token = req.headers['authorization'];
  const username = req.headers['username'];
  const reponame = defaultReponame;

  return { token, username, reponame };
}

async function auth(req) {
  const { token, username } = getHeaders(req);

  // required headers
  if (!token && !username) {
    throw createError(400, 'Provide token or username');
  }

  // prefer token
  if (token) {
    // mem token
    api.auth({ token });

    const saltedToken = crypto.createHmac('sha1', secret)
      .update(token)
      .digest('hex')

    // if token has been used return referenced username
    if (await db.has(`token:${saltedToken}`)) {
      return await db.get(`token:${saltedToken}`);
      // validate token
    } else {
      const user = await api.me();

      // of no error was thrown token is valid
      await db.put(`token:${saltedToken}`, user.login);

      return user.login;
    }
  }

  // username was already ones used so its valid
  return username;
}

module.exports = { getHeaders, auth };

