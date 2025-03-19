const { getCache, setCache } = require("../config/redis");
const logger = require("../config/logger");

/**
 * Middleware để cache response của API
 * @param {number} duration - Thời gian cache (giây)
 * @param {Function} keyGenerator - Hàm tạo key cache (tùy chọn)
 */
const cacheMiddleware = (duration = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Bỏ qua cache cho các request không phải GET
    if (req.method !== "GET") {
      return next();
    }

    // Tạo cache key
    const generateKey = () => {
      if (keyGenerator && typeof keyGenerator === "function") {
        return keyGenerator(req);
      }

      // Mặc định: sử dụng path và query params
      const params = JSON.stringify(req.query);
      return `cache:${req.originalUrl}:${params}`;
    };

    const cacheKey = generateKey();

    try {
      // Kiểm tra cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return res.status(200).json({
          ...cachedData,
          _cached: true,
        });
      }

      // Không có cache, tiếp tục xử lý request
      logger.debug(`Cache miss for ${cacheKey}`);

      // Lưu response gốc
      const originalSend = res.json;

      // Override res.json để lưu response vào cache
      res.json = function (data) {
        // Chỉ cache response thành công
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, duration).catch((err) =>
            logger.error(`Error setting cache: ${err.message}`)
          );
        }

        // Gọi hàm json gốc
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

module.exports = cacheMiddleware;
