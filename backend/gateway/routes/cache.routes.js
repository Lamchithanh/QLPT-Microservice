const express = require("express");
const router = express.Router();
const cacheMiddleware = require("../middleware/cache.middleware");
const { setCache, getCache, deleteCache } = require("../config/redis");

/**
 * @swagger
 * /api/cache/test:
 *   get:
 *     summary: Test cache middleware
 *     description: Endpoint để test cache middleware
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         description: Key để test (mặc định là 'test')
 *     responses:
 *       200:
 *         description: Dữ liệu đã được cache hoặc mới
 */
router.get("/test", cacheMiddleware(60), (req, res) => {
  const key = req.query.key || "test";

  res.json({
    message: "Cache test successful",
    key,
    timestamp: new Date().toISOString(),
    cached: false,
  });
});

/**
 * @swagger
 * /api/cache/set:
 *   post:
 *     summary: Set cache manually
 *     description: Thêm dữ liệu vào cache
 *     tags: [Cache]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - data
 *             properties:
 *               key:
 *                 type: string
 *               data:
 *                 type: object
 *               ttl:
 *                 type: number
 *                 description: Thời gian sống (giây)
 *     responses:
 *       200:
 *         description: Cache đã được set
 *       400:
 *         description: Thiếu thông tin
 */
router.post("/set", async (req, res) => {
  const { key, data, ttl } = req.body;

  if (!key || !data) {
    return res.status(400).json({
      status: "error",
      message: "Missing key or data",
    });
  }

  const result = await setCache(key, data, ttl);

  res.json({
    status: result ? "success" : "error",
    message: result ? "Cache set successfully" : "Failed to set cache",
    key,
  });
});

/**
 * @swagger
 * /api/cache/get/{key}:
 *   get:
 *     summary: Get cache manually
 *     description: Lấy dữ liệu từ cache
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key
 *     responses:
 *       200:
 *         description: Dữ liệu từ cache
 *       404:
 *         description: Không tìm thấy cache
 */
router.get("/get/:key", async (req, res) => {
  const { key } = req.params;

  const data = await getCache(key);

  if (!data) {
    return res.status(404).json({
      status: "error",
      message: "Cache not found",
      key,
    });
  }

  res.json({
    status: "success",
    data,
    key,
    _cached: true,
  });
});

/**
 * @swagger
 * /api/cache/delete/{key}:
 *   delete:
 *     summary: Delete cache manually
 *     description: Xóa dữ liệu từ cache
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key
 *     responses:
 *       200:
 *         description: Cache đã được xóa
 */
router.delete("/delete/:key", async (req, res) => {
  const { key } = req.params;

  const result = await deleteCache(key);

  res.json({
    status: result ? "success" : "error",
    message: result ? "Cache deleted successfully" : "Failed to delete cache",
    key,
  });
});

module.exports = router;
