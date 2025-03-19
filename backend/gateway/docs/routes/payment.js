/**
 * @swagger
 * /api/payments/contracts:
 *   get:
 *     summary: Lấy danh sách hợp đồng
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, terminated]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách hợp đồng
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 *
 *   post:
 *     summary: Tạo hợp đồng mới
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *               - tenant_id
 *               - start_date
 *               - end_date
 *               - rent_amount
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: ID phòng
 *               tenant_id:
 *                 type: string
 *                 description: ID người thuê
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày bắt đầu hợp đồng
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày kết thúc hợp đồng
 *               rent_amount:
 *                 type: number
 *                 description: Số tiền thuê
 *               deposit_amount:
 *                 type: number
 *                 description: Số tiền đặt cọc
 *               payment_cycle:
 *                 type: integer
 *                 description: Chu kỳ thanh toán (tháng)
 *               terms:
 *                 type: string
 *                 description: Điều khoản hợp đồng
 *     responses:
 *       201:
 *         description: Tạo hợp đồng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 *
 * /api/payments/contracts/{id}:
 *   get:
 *     summary: Lấy thông tin hợp đồng theo ID
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hợp đồng
 *     responses:
 *       200:
 *         description: Thông tin hợp đồng
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy hợp đồng
 *       500:
 *         description: Lỗi server
 *
 * /api/payments/invoices:
 *   get:
 *     summary: Lấy danh sách hóa đơn
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue, cancelled]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 *
 *   post:
 *     summary: Tạo hóa đơn mới
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contract_id
 *               - amount
 *               - due_date
 *             properties:
 *               contract_id:
 *                 type: string
 *                 description: ID hợp đồng
 *               amount:
 *                 type: number
 *                 description: Số tiền
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày đến hạn
 *               description:
 *                 type: string
 *                 description: Mô tả
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *                 description: Chi tiết các khoản phí
 *     responses:
 *       201:
 *         description: Tạo hóa đơn thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 *
 * /api/payments/invoices/{id}:
 *   get:
 *     summary: Lấy thông tin hóa đơn theo ID
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hóa đơn
 *     responses:
 *       200:
 *         description: Thông tin hóa đơn
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi server
 *
 * /api/payments/invoices/{id}/pay:
 *   post:
 *     summary: Thanh toán hóa đơn
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hóa đơn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, bank_transfer, credit_card, momo, vnpay]
 *                 description: Phương thức thanh toán
 *               transaction_id:
 *                 type: string
 *                 description: ID giao dịch (nếu có)
 *               notes:
 *                 type: string
 *                 description: Ghi chú
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi server
 */
