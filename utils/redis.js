// RedisClient class
import { createClient } from 'redis';

// Create a redis class
class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = true;

    // this.client.on('connect', () => {
    // console.log('Redis client connected to the server');
    // });
    this.client.on('error', (err) => {
      this.connected = false;
      console.log(err);
    });
  }

  // isAlive method
  isAlive() {
    return this.connected;
  }

  // isAlive() {
  //   this.client.ping('ping', (error, result) => {
  //     if (error) {
  //       return false;
  //     }
  //     return true;
  //   });
  // }

  // Asynchronous get method
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) reject(err);
        resolve(value);
      });
    });
  }

  // Asynchronous set method
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }

  // Asynchronous del method
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }
}

// Create a new instance of the RedisClient class
const redisClient = new RedisClient();

// Export the redisClient instance
module.exports = redisClient;
