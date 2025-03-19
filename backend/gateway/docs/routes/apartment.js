/**
 * @swagger
 * /api/apartments:
 *   get:
 *     summary: Lấy danh sách căn hộ
 *     tags: [Apartment]
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
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sắp xếp theo trường (ví dụ price:asc, created_at:desc)
 *     responses:
 *       200:
 *         description: Danh sách căn hộ
 *       500:
 *         description: Lỗi server
 *
 *   post:
 *     summary: Tạo căn hộ mới
 *     tags: [Apartment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - owner_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên căn hộ
 *               address:
 *                 type: string
 *                 description: Địa chỉ
 *               description:
 *                 type: string
 *                 description: Mô tả
 *               owner_id:
 *                 type: string
 *                 description: ID chủ sở hữu
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách hình ảnh
 *     responses:
 *       201:
 *         description: Tạo căn hộ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 *
 * /api/apartments/{id}:
 *   get:
 *     summary: Lấy thông tin căn hộ theo ID
 *     tags: [Apartment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID căn hộ
 *     responses:
 *       200:
 *         description: Thông tin căn hộ
 *       404:
 *         description: Không tìm thấy căn hộ
 *       500:
 *         description: Lỗi server
 *
 *   put:
 *     summary: Cập nhật thông tin căn hộ
 *     tags: [Apartment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID căn hộ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy căn hộ
 *       500:
 *         description: Lỗi server
 *
 *   delete:
 *     summary: Xóa căn hộ
 *     tags: [Apartment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID căn hộ
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy căn hộ
 *       500:
 *         description: Lỗi server
 *
 * /api/apartments/{apartmentId}/rooms:
 *   get:
 *     summary: Lấy danh sách phòng trong căn hộ
 *     tags: [Apartment]
 *     parameters:
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID căn hộ
 *     responses:
 *       200:
 *         description: Danh sách phòng
 *       404:
 *         description: Không tìm thấy căn hộ
 *       500:
 *         description: Lỗi server
 *
 *   post:
 *     summary: Tạo phòng mới trong căn hộ
 *     tags: [Apartment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID căn hộ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên phòng
 *               description:
 *                 type: string
 *                 description: Mô tả
 *               price:
 *                 type: number
 *                 description: Giá phòng
 *               area:
 *                 type: number
 *                 description: Diện tích (m²)
 *               status:
 *                 type: string
 *                 enum: [available, occupied, maintenance]
 *                 description: Trạng thái phòng
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách hình ảnh
 *     responses:
 *       201:
 *         description: Tạo phòng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy căn hộ
 *       500:
 *         description: Lỗi server
 */
