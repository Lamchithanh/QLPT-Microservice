const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpay.controller");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/payments/vnpay/create:
 *   post:
 *     summary: Tạo URL thanh toán VNPay
 *     description: Tạo URL thanh toán VNPay cho hóa đơn
 *     tags: [VNPay]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderDescription
 *               - invoiceId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền thanh toán (VND)
 *               orderDescription:
 *                 type: string
 *                 description: Mô tả đơn hàng
 *               invoiceId:
 *                 type: string
 *                 description: ID của hóa đơn
 *               language:
 *                 type: string
 *                 enum: [vn, en]
 *                 default: vn
 *                 description: Ngôn ngữ hiển thị
 *               bankCode:
 *                 type: string
 *                 description: Mã ngân hàng (tùy chọn)
 *     responses:
 *       200:
 *         description: Thành công, trả về URL thanh toán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentUrl:
 *                       type: string
 *                       description: URL thanh toán VNPay
 *                     orderId:
 *                       type: string
 *                       description: Mã đơn hàng
 *                     paymentId:
 *                       type: string
 *                       description: ID của thanh toán
 *                     sandboxInfo:
 *                       type: object
 *                       description: Thông tin thẻ test (chỉ có trong môi trường development)
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi server
 */
router.post("/create", authenticate, vnpayController.createPayment);

/**
 * @swagger
 * /api/payments/vnpay/return:
 *   get:
 *     summary: Xử lý callback từ VNPay
 *     description: Xử lý callback từ VNPay sau khi thanh toán
 *     tags: [VNPay]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi từ VNPay
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã đơn hàng
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Số tiền thanh toán
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Chữ ký xác thực
 *     responses:
 *       302:
 *         description: Chuyển hướng đến trang kết quả thanh toán
 *       400:
 *         description: Chữ ký không hợp lệ
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi server
 */
router.get("/return", vnpayController.handleCallback);

/**
 * @swagger
 * /api/payments/vnpay/status/{orderId}:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán
 *     description: Kiểm tra trạng thái thanh toán VNPay theo mã đơn hàng
 *     tags: [VNPay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã đơn hàng VNPay
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin thanh toán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     invoiceId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed, cancelled]
 *                     method:
 *                       type: string
 *                       example: vnpay
 *                     transactionId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     metadata:
 *                       type: object
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/status/:orderId",
  authenticate,
  vnpayController.checkPaymentStatus
);

/**
 * @swagger
 * /api/payments/vnpay/refund/{paymentId}:
 *   post:
 *     summary: Hoàn tiền thanh toán
 *     description: Hoàn tiền cho thanh toán VNPay
 *     tags: [VNPay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của thanh toán
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền hoàn (mặc định là toàn bộ)
 *               reason:
 *                 type: string
 *                 description: Lý do hoàn tiền
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin hoàn tiền
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     refundAmount:
 *                       type: number
 *                     message:
 *                       type: string
 *                     transactionNo:
 *                       type: string
 *       400:
 *         description: Không thể hoàn tiền
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi server
 */
router.post("/refund/:paymentId", authenticate, vnpayController.refundPayment);

/**
 * @swagger
 * /api/payments/vnpay/test-cards:
 *   get:
 *     summary: Lấy thông tin thẻ test
 *     description: Lấy thông tin thẻ test cho môi trường sandbox (chỉ khả dụng trong môi trường development)
 *     tags: [VNPay]
 *     responses:
 *       200:
 *         description: Thành công, trả về thông tin thẻ test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     testCards:
 *                       type: object
 *                       properties:
 *                         domestic:
 *                           type: object
 *                           properties:
 *                             bank:
 *                               type: string
 *                               example: NCB
 *                             cardNumber:
 *                               type: string
 *                               example: 9704198526191432198
 *                             cardHolder:
 *                               type: string
 *                               example: NGUYEN VAN A
 *                             issuedDate:
 *                               type: string
 *                               example: 07/15
 *                             otp:
 *                               type: string
 *                               example: 123456
 *                         international:
 *                           type: object
 *                           properties:
 *                             bank:
 *                               type: string
 *                               example: VISA
 *                             cardNumber:
 *                               type: string
 *                               example: 4242424242424242
 *                             cardHolder:
 *                               type: string
 *                               example: NGUYEN VAN A
 *                             issuedDate:
 *                               type: string
 *                               example: 07/15
 *                             cvv:
 *                               type: string
 *                               example: 123
 *                             otp:
 *                               type: string
 *                               example: 123456
 *                     note:
 *                       type: string
 *       403:
 *         description: Chức năng chỉ khả dụng trong môi trường development
 *       500:
 *         description: Lỗi server
 */
router.get("/test-cards", vnpayController.getTestCards);

module.exports = router;
