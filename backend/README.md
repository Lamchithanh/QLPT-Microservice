# QLPT-Microservices MongoDB Schema

This project uses a microservices architecture with MongoDB as the database. The schemas are organized into three main services:

## 1. User Service

Handles user authentication, profiles, and notifications.

### Models:

- **User**: Core user information and authentication
- **Landlord**: Information about property owners
- **Tenant**: Information about renters
- **PasswordReset**: For password recovery functionality
- **Notification**: System notifications for users

## 2. Apartment Service

Manages rooms, amenities, reviews, and maintenance requests.

### Models:

- **Room**: Information about available rooms/apartments
- **Amenity**: Features available in rooms
- **Review**: User reviews of rooms
- **UserFavorite**: User's favorite rooms
- **MaintenanceRequest**: Maintenance requests for rooms

## 3. Payment Service

Handles contracts, billing, and payments.

### Models:

- **Contract**: Rental agreements between landlords and tenants
- **Service**: Utilities and additional services
- **ServiceUsage**: Tracking usage of services
- **Invoice**: Monthly bills for tenants
- **Payment**: Payment records

## Schema Relationships

- Users can be either Landlords or Tenants
- Landlords own Rooms
- Tenants can have Contracts for Rooms
- Contracts generate Invoices
- Invoices track ServiceUsage and receive Payments
- Rooms can have Reviews and MaintenanceRequests

## Indexes

Each schema includes appropriate indexes to optimize query performance for common operations.

## Data Validation

Schemas include validation rules to ensure data integrity:

- Required fields
- Enum values for status fields
- Min/max values for numeric fields
- Unique constraints where appropriate

## Cài đặt

Để cài đặt các dependencies cho tất cả các service, bạn có thể sử dụng lệnh sau:

```bash
# Cài đặt dependencies cho root project
npm install

# Cài đặt dependencies cho từng service
cd backend/services/user-service && npm install
cd backend/services/apartment-service && npm install
cd backend/services/payment-service && npm install
cd backend/gateway && npm install
```

## Các Script Hỗ Trợ

Dự án cung cấp nhiều script hỗ trợ để quản lý và kiểm tra các service:

```bash
# Khởi động tất cả các service
npm start

# Kiểm tra trạng thái của tất cả các service
npm run check

# Kiểm tra cấu hình MONGO_URI trong các file .env
npm run check-env

# Sửa tự động các file .env để đảm bảo kết nối đúng database
npm run fix-env

# Khởi tạo tất cả các database
npm run init-db

# Kiểm tra cấu trúc của các database trên MongoDB Atlas
npm run check-db
```

## Khởi tạo Database

Để khởi tạo các database và collection, bạn có thể sử dụng các script đã được cung cấp:

### Khởi tạo từng service riêng biệt

```bash
# Khởi tạo database cho user-service
node backend/services/user-service/scripts/initDb.js

# Khởi tạo database cho apartment-service
node backend/services/apartment-service/scripts/initDb.js

# Khởi tạo database cho payment-service
node backend/services/payment-service/scripts/initDb.js
```

### Khởi tạo tất cả các database cùng lúc

```bash
npm run init-db
# hoặc
node backend/scripts/initAllDbs.js
```

Các script này sẽ:

1. Kết nối đến MongoDB
2. Tạo các collection cần thiết
3. Khởi tạo dữ liệu mẫu để bạn có thể bắt đầu làm việc ngay

### Lưu ý

- Đảm bảo MongoDB đã được cài đặt và đang chạy
- Kiểm tra file `.env` trong mỗi service để đảm bảo thông tin kết nối MongoDB đúng
- Mặc định, các script sẽ xóa dữ liệu cũ trước khi tạo dữ liệu mới

## Kiểm tra và Sửa lỗi Database

Nếu bạn gặp vấn đề với kết nối database, hãy sử dụng các script sau:

```bash
# Kiểm tra cấu hình MONGO_URI trong các file .env
npm run check-env

# Sửa tự động các file .env để đảm bảo kết nối đúng database
npm run fix-env

# Kiểm tra cấu trúc của các database trên MongoDB Atlas
npm run check-db
```

## Chạy các Service

### Chạy từng service riêng biệt

```bash
# Chạy user-service
cd backend/services/user-service
npm start

# Chạy apartment-service
cd backend/services/apartment-service
npm start

# Chạy payment-service
cd backend/services/payment-service
npm start

# Chạy gateway
cd backend/gateway
npm start
```

### Chạy tất cả các service cùng lúc

```bash
npm start
# hoặc
node backend/start-all.js
```

Script này sẽ khởi động tất cả các service (user-service, apartment-service, payment-service và gateway) cùng một lúc và hiển thị log của tất cả các service trong cùng một cửa sổ terminal.

### Kiểm tra trạng thái các service

```bash
npm run check
```

Script này sẽ kiểm tra xem tất cả các service có đang hoạt động không và hiển thị thông tin về trạng thái kết nối database.

### Dừng tất cả các service

Để dừng tất cả các service, nhấn `Ctrl+C` trong terminal.
