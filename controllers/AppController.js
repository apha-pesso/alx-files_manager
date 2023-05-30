// File for the endpoint definition
// Import mongo and redisclient
const redis = require('../utils/redis');
const mongo = require('../utils/db');

const AppController = {
  getStatus(req, res) {
    if (redis.isAlive && mongo.isAlive) {
      res.status(200).send('{"redis": true, "db": true }');
    }
  },

  async getStats(req, res) {
    const users = await mongo.nbUsers();
    const files = await mongo.nbFiles();
    res.status(200).send(`{"users": ${users}, "files": ${files}}`);
  },
};

module.exports = AppController;
