const Redis = require("ioredis");
const logger = require("./logger");

// Cấu hình Redis từ biến môi trường
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const useRedisCache = process.env.USE_REDIS_CACHE === "true";

let redisClient = null;

/**
 * Khởi tạo kết nối Redis
 */
const initRedis = () => {
  if (!useRedisCache) {
    logger.info("Redis caching is disabled");
    return null;
  }

  try {
    redisClient = new Redis(redisUrl);

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
    });

    redisClient.on("error", (err) => {
      logger.error(`Redis error: ${err}`);
    });

    return redisClient;
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    return null;
  }
};

/**
 * Lưu dữ liệu vào cache
 * @param {string} key - Khóa cache
 * @param {any} data - Dữ liệu cần lưu
 * @param {number} ttl - Thời gian sống (giây)
 */
const setCache = async (key, data, ttl = 3600) => {
  if (!redisClient || !useRedisCache) return false;

  try {
    await redisClient.set(key, JSON.stringify(data), "EX", ttl);
    return true;
  } catch (error) {
    logger.error(`Redis setCache error: ${error.message}`);
    return false;
  }
};

/**
 * Lấy dữ liệu từ cache
 * @param {string} key - Khóa cache
 * @returns {Promise<any>} - Dữ liệu đã lưu hoặc null
 */
const getCache = async (key) => {
  if (!redisClient || !useRedisCache) return null;

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis getCache error: ${error.message}`);
    return null;
  }
};

/**
 * Xóa dữ liệu từ cache
 * @param {string} key - Khóa cache
 */
const deleteCache = async (key) => {
  if (!redisClient || !useRedisCache) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis deleteCache error: ${error.message}`);
    return false;
  }
};

/**
 * Xóa tất cả các khóa có pattern
 * @param {string} pattern - Pattern của khóa (ví dụ: user:*)
 */
const deleteCachePattern = async (pattern) => {
  if (!redisClient || !useRedisCache) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Redis deleteCachePattern error: ${error.message}`);
    return false;
  }
};

module.exports = {
  initRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  getClient: () => redisClient,
};
