// File for the endpoint definition
// Import mongo and redisclient
const redis = require('../utils/redis');
const mongo = require('../utils/db');

const AppController = {
  getStatus(req, res) {
    const redisStatus = redis.isAlive();
    const mongoStatus = mongo.isAlive();
    res.status(200).json({ redis: redisStatus, mongo: mongoStatus });
  },

  async getStats(req, res) {
    const users = await mongo.nbUsers();
    const files = await mongo.nbFiles();
    res.status(200).json({ users, files });
  },
};

module.exports = AppController;
