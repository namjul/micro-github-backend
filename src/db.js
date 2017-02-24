const inMemoryDb = {}

module.exports = {
  put: (key, value) => Promise.resolve(inMemoryDb[key] = value),
  has: (key) => Promise.resolve(!!inMemoryDb[key]),
  get: (key) => Promise.resolve(inMemoryDb[key])
};
