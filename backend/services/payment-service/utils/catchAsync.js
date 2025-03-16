/**
 * Hàm bọc các hàm xử lý bất đồng bộ để bắt lỗi
 * @param {Function} fn - Hàm xử lý bất đồng bộ cần bọc
 * @returns {Function} Hàm xử lý đã được bọc
 */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
