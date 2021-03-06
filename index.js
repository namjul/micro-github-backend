require('dotenv').config();
const url = require('url');
const { send } = require('micro');
const UrlPattern = require('url-pattern');
const api = require('./src/api');
const handlers = require('./src/handlers');
const { handleErrors } = require('./src/utils');
const { auth, getHeaders } = require('./src/auth');
const { schema } = require('./src/config');

const pattern = new UrlPattern(
  new RegExp(String.raw`^/(${Object.keys(schema).join('|')})(?:/(\w+))?$`),
  ['resource', 'id']
);

module.exports = handleErrors(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, username');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');

  if (req.method === 'OPTIONS') {
    send(res, 200);
  } else {
    const { pathname } = url.parse(req.url);
    const match = pattern.match(pathname);
    const { reponame } = getHeaders(req);
    const username = await auth(req);
    const handler = handlers(Object.assign(req, { params: match }), res);

    if (match) {
      const route = [req.method, ...Object.keys(match)].join(':');

      switch (route) {
        case 'GET:resource':
          return handler.show({ username, reponame });
        case 'GET:resource:id':
          return handler.show({ username, reponame });
        case 'POST:resource':
          return handler.create({ username, reponame });
        case 'PUT:resource':
          return handler.update({ username, reponame });
        case 'PUT:resource:id':
          return handler.update({ username, reponame });
        case 'PATCH:resource':
          return handler.update({ username, reponame });
        case 'PATCH:resource:id':
          return handler.update({ username, reponame });
        case 'DELETE:resource:id':
          return handler.destroy({ username, reponame });
        default:
          send(res, 404, 'Not Found');
          break;
      }
    } else {
      send(res, 404, 'Not Found');
    }
  }
});
