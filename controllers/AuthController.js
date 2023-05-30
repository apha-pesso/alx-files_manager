// AuthController endpoint definition

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const mongo = require('../utils/db');
const redisClient = require('../utils/redis');

function SHA1password(password) {
  const hash = crypto.createHash('sha1');
  hash.update(password);
  return hash.digest('hex');
}

// Function to decode the authorization in header
// function b64Decode(token) {
// const decoded = Buffer.from(token, 'base64').toString('utf-8');
// const text = decoded.split(' ')[1];
//
// return text;
// }

const AuthController = {
  async getConnect(req, res) {
    const authy = req.headers.authorization;
    // console.log(authy);
    const input = authy.split(' ')[1];
    // console.log(input);
    // const combo = b64Decode(input);
    const combo = Buffer.from(input, 'base64').toString('utf-8').split(':');
    // console.log(combo);
    const email = combo[0];
    const hashPassword = SHA1password(combo[1]);
    const user = await mongo.getUser(email);
    // console.log(user);

    try {
      if (user.password === hashPassword) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 86400);
        res.status(200).json({ token });
      }
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },

  async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    try {
      const userId = await redisClient.get(key);
      const user = await mongo.getUserById(userId);
      if (user) {
        await redisClient.del(key);
        res.status(204).json('');
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },

  // get me
  async getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    try {
      const userId = await redisClient.get(key);
      if (userId) {
        const user = await mongo.getUserById(userId);
        if (user) {
          // const { id } = user;
          const { email } = user;
          res.status(200).json({ id: userId, email });
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },
};

module.exports = AuthController;
// export default AuthController;
