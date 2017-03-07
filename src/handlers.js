const { send, createError, json } = require('micro');
const cuid = require('cuid');
const db = require('./db');
const api = require('./api');
const { checkResource, getResource } = require('./utils');

module.exports = (req, res) => ({
  async show({ username, reponame }) {
    const { resource, id } = req.params;
    const { content } = await getResource({ username, reponame, resource });

    if (id && Array.isArray(content)) {
      const entry = content.find(entry => entry.id === id);

      if (!entry) {
        throw createError(404, `Could not find ${resource} ${id}`);
      }

      send(res, 200, entry);
    } else {
      send(res, 200, content);
    }
  },
  async create({ username, reponame }) {
    const { resource } = req.params;

    await checkResource({ 
      username, 
      reponame, 
      resource 
    })

    const { content, sha } = await getResource({
      username,
      reponame,
      resource
    });
    let value = await json(req);

    // check for id in value
    if (Array.isArray(content)) {
      if ('id' in value) {
        // check for duplicates and fail if it exists
        const check = content.find(entry => entry.id === value.id);

        if (check) {
          throw createError(409, `Duplicate id ${value.id} found`);
        }
      } else {
        // create unique id
        value = Object.assign({ id: cuid() }, value);
      }
    }

    const newContent = Array.isArray(content)
      ? [...content, value]
      : Object.assign(content, value);

    const { content: { sha: newSha } } = await api.write({
      username,
      reponame,
      resource,
      data: newContent,
      sha,
      message: `Create ${resource}`
    });

    await db.put(`${username}:${resource}`, {
      content: newContent,
      sha: newSha
    });

    send(res, 201, value);
  },
  async update({ username, reponame }) {
    const { resource, id } = req.params;

    await checkResource({ 
      username, 
      reponame, 
      resource 
    })

    const { content, sha } = await getResource({
      username,
      reponame,
      resource
    });
    let value = await json(req);

    const newContent = Array.isArray(content)
      ? content.map(entry => {
          if (entry.id === id) {
            value = req.method === 'PATCH'
              ? Object.assign(entry, value, { id })
              : Object.assign(value, { id });
            return value;
          }
          return entry;
        })
      : req.method === 'PATCH' ? value = Object.assign(content, value) : value;

    const { content: { sha: newSha } } = await api.write({
      username,
      reponame,
      resource,
      data: newContent,
      sha,
      message: `Update ${resource}`
    });

    await db.put(`${username}:${resource}`, {
      content: newContent,
      sha: newSha
    });

    send(res, 200, value);
  },
  async destroy({ username, reponame }) {
    const { resource, id } = req.params;

    await checkResource({ 
      username, 
      reponame, 
      resource 
    })

    const { content, sha } = await getResource({
      username,
      reponame,
      resource
    });

    if (id && Array.isArray(content)) {
      const entry = content.find(entry => entry.id === id);

      if (!entry) {
        throw createError(404, `Could not find ${resource} ${id}`);
      }

      const newContent = content.filter(entry => entry.id !== id);

      const { content: { sha: newSha } } = await api.write({
        username,
        reponame,
        resource,
        data: newContent,
        sha,
        message: `Delete ${resource}`
      });

      await db.put(`${username}:${resource}`, {
        content: newContent,
        sha: newSha
      });

      send(res, 200, {});
    } else {
      send(res, 404, 'Not Found');
    }
  }
});
