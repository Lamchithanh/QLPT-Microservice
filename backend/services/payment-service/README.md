# Payment Service

Dịch vụ quản lý thanh toán cho hệ thống Quản lý Phòng trọ (QLPT).

## Tính năng

- Quản lý hóa đơn
- Quản lý hợp đồng
- Xử lý thanh toán
- Tích hợp cổng thanh toán VNPay

## Cài đặt

1. Clone repository
2. Cài đặt dependencies:
   ```
   npm install
   ```
3. Tạo file `.env` từ `.env.example`:
   ```
   cp .env.example .env
   ```
4. Cấu hình các biến môi trường trong file `.env`
5. Khởi động dịch vụ:
   ```
   npm start
   ```

## Cấu hình

### Database (MongoDB Atlas)

Dịch vụ sử dụng MongoDB Atlas làm cơ sở dữ liệu. Cấu hình kết nối trong file `.env`:

```
MONGODB_URI=mongodb+srv://thanh0981911449:pfAqdeBRPJEj3vJa@qlpt.ww2qx.mongodb.net/qlpt_payment_service
```

#### Cấu trúc database trong hệ thống microservices

Hệ thống QLPT sử dụng các database riêng biệt cho từng service:

- **qlpt_payment_service**: Lưu trữ dữ liệu thanh toán, hóa đơn, hợp đồng
- **qlpt_apartment_service**: Lưu trữ dữ liệu căn hộ, tòa nhà, tiện ích
- **qlpt_user_service**: Lưu trữ dữ liệu người dùng, phân quyền, xác thực

Mỗi service kết nối đến database riêng của mình để đảm bảo tính độc lập và khả năng mở rộng của hệ thống.

### JWT Authentication

Cấu hình JWT cho xác thực:

```
JWT_SECRET=thanh0981911449
```

### VNPay (Sandbox)

Dịch vụ đã được tích hợp sẵn với VNPay sandbox. Cấu hình trong file `.env`:

```
VNP_TMN_CODE=DYJ54JJH
VNP_HASH_SECRET=T8L6I3K31OUUILUB3Q0KQUZVZGVXKUU2
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5003/api/payments/vnpay/return
VNP_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
PAYMENT_RESULT_URL=http://localhost:3000/payment/result
```

### Thông tin thẻ test (Sandbox)

#### Thẻ nội địa:

- Ngân hàng: NCB
- Số thẻ: 9704198526191432198
- Tên chủ thẻ: NGUYEN VAN A
- Ngày phát hành: 07/15
- Mật khẩu OTP: 123456

#### Thẻ quốc tế:

- Loại thẻ: VISA
- Số thẻ: 4242424242424242
- Tên chủ thẻ: NGUYEN VAN A
- Ngày phát hành: 07/15
- CVV: 123
- Mật khẩu OTP: 123456

## API Endpoints

### VNPay

#### Tạo thanh toán

```
POST /api/payments/vnpay/create
```

Body:

```json
{
  "amount": 100000,
  "orderDescription": "Thanh toán hóa đơn tháng 5/2023",
  "invoiceId": "60f1a5b3e6b3f32d8c9e4b7a",
  "language": "vn"
}
```

#### Xử lý callback từ VNPay

```
GET /api/payments/vnpay/return
```

#### Kiểm tra trạng thái thanh toán

```
GET /api/payments/vnpay/status/:orderId
```

#### Hoàn tiền thanh toán

```
POST /api/payments/vnpay/refund/:paymentId
```

Body:

```json
{
  "amount": 100000,
  "reason": "Khách hàng yêu cầu hoàn tiền"
}
```

### Hướng dẫn test

1. **Tạo JWT token test**:

   Bạn có thể tạo JWT token test bằng cách sử dụng secret `thanh0981911449` với payload chứa thông tin người dùng. Ví dụ:

   ```javascript
   const jwt = require("jsonwebtoken");
   const token = jwt.sign(
     { id: "123456", username: "testuser", role: "admin" },
     "thanh0981911449",
     { expiresIn: "1h" }
   );
   console.log(token);
   ```

   Hoặc sử dụng token mẫu (có hiệu lực 1 năm):

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAzMzYwMDAsImV4cCI6MTc0MTg3MjAwMH0.Wd9JJD5V5-KoEuUmYA9VH9bTnOvnvdtib9mQRvzXAMY
   ```

2. **Tạo thanh toán test**:

   ```bash
   curl -X POST http://localhost:5003/api/payments/vnpay/create \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAzMzYwMDAsImV4cCI6MTc0MTg3MjAwMH0.Wd9JJD5V5-KoEuUmYA9VH9bTnOvnvdtib9mQRvzXAMY" \
   -d '{
     "amount": 10000,
     "orderDescription": "Thanh toán test VNPay",
     "invoiceId": "test",
     "language": "vn"
   }'
   ```

3. **Mở URL thanh toán** nhận được từ response trong trình duyệt

4. **Sử dụng thông tin thẻ test** để hoàn tất thanh toán

5. **Kiểm tra trạng thái thanh toán**:
   ```bash
   curl -X GET http://localhost:5003/api/payments/vnpay/status/YOUR_ORDER_ID \
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAzMzYwMDAsImV4cCI6MTc0MTg3MjAwMH0.Wd9JJD5V5-KoEuUmYA9VH9bTnOvnvdtib9mQRvzXAMY"
   ```

## Quy trình thanh toán

1. Client gọi API `POST /api/payments/vnpay/create` để tạo URL thanh toán
2. Server trả về URL thanh toán VNPay
3. Client chuyển hướng người dùng đến URL thanh toán
4. Người dùng hoàn tất thanh toán trên cổng VNPay
5. VNPay chuyển hướng người dùng về URL callback (`VNP_RETURN_URL`)
6. Server xử lý callback và cập nhật trạng thái thanh toán
7. Server chuyển hướng người dùng đến trang kết quả thanh toán (`PAYMENT_RESULT_URL`)

## Tương tác với các service khác

Payment Service tương tác với các service khác trong hệ thống microservices thông qua:

1. **Service Discovery (Consul)**: Đăng ký và tìm kiếm các service khác
2. **Message Broker (RabbitMQ)**: Gửi và nhận các sự kiện liên quan đến thanh toán

### Ví dụ tương tác:

- Khi một hóa đơn được thanh toán, Payment Service gửi sự kiện `invoice.paid` đến RabbitMQ
- Apartment Service nhận sự kiện này và cập nhật trạng thái thanh toán của căn hộ
- User Service nhận sự kiện này và gửi thông báo đến người dùng

## Môi trường production

Khi triển khai lên môi trường production, bạn cần:

1. Đăng ký tài khoản merchant với VNPay
2. Cập nhật các thông tin trong file `.env` với thông tin thật từ VNPay
3. Cập nhật các URL callback và kết quả thanh toán phù hợp với môi trường production

## Tài liệu tham khảo

- [Tài liệu API VNPay](https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/)
- [Merchant Admin VNPay Sandbox](https://sandbox.vnpayment.vn/merchantv2/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
