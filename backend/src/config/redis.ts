import { createClient } from 'redis';
import config from './index';
import logger from './logger';

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  ...(config.redis.password ? { password: config.redis.password } : {}),
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready to use');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    if (config.redis.db && config.redis.db !== 0) {
      await redisClient.sendCommand(['SELECT', config.redis.db.toString()]);
    }
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
};

export default redisClient;
