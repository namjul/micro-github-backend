const assert = require('assert');
const isPlainObject = require('is-plain-object');

assert(process.env.SECRET, '`SECRET` not set');
assert(process.env.REPO, '`REPO` not set');
assert(process.env.SCHEMA, '`SCHEMA` not set');

const schema = JSON.parse(process.env.SCHEMA);

if (!isPlainObject(schema)) {
  throw Error('Schema needs to be an object');
}

module.exports = {
  secret: process.env.SECRET,
  repo: process.env.REPO,
  schema
};
