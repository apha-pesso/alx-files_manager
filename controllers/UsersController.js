// Create the UsersController endpoint
const crypto = require('crypto');
const mongo = require('../utils/db');

function SHA1password(password) {
  const hash = crypto.createHash('sha1');
  hash.update(password);
  return hash.digest('hex');
}

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
      res.status(400).json({ error: 'Missing password' });
    } else {
      try {
      // Check email
        const isExist = await mongo.emailCheck(email);
        if (isExist) {
          res.status(400).json({ error: 'Already exist' });
        } else {
          const hashedPassword = SHA1password(password);
          const userID = await mongo.addUser(email, hashedPassword);
          res.status(201).json({ id: userID, email });
        }
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

};

module.exports = UsersController;
