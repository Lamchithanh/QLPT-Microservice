# QLPT Microservices

Hệ thống quản lý phòng trọ sử dụng kiến trúc microservices.

## Kiến trúc hệ thống

Hệ thống bao gồm các thành phần chính:

- **API Gateway**: Cổng API trung tâm, xử lý authentication và định tuyến request
- **User Service**: Quản lý người dùng và xác thực
- **Apartment Service**: Quản lý thông tin phòng trọ
- **Payment Service**: Quản lý thanh toán
- **Service Discovery (Consul)**: Đăng ký và khám phá dịch vụ
- **Message Broker (RabbitMQ)**: Giao tiếp bất đồng bộ giữa các service
- **MongoDB**: Cơ sở dữ liệu

## Yêu cầu hệ thống

- Docker và Docker Compose
- Node.js (để phát triển)

## Chạy hệ thống với Docker

### Khởi động toàn bộ hệ thống

```bash
docker-compose up -d
```

Lệnh này sẽ khởi động tất cả các service, bao gồm:

- MongoDB (cổng 27017)
- Consul (cổng 8500)
- RabbitMQ (cổng 5672, UI: 15672)
- API Gateway (cổng 5000)
- User Service (cổng 5001)
- Apartment Service (cổng 5002)
- Payment Service (cổng 5003)

### Chạy chỉ các dịch vụ cơ sở hạ tầng (cho môi trường phát triển)

Nếu bạn muốn chạy các service trên máy local nhưng vẫn sử dụng MongoDB, Consul và RabbitMQ từ Docker:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Lệnh này sẽ chỉ khởi động:

- MongoDB (cổng 27017)
- Consul (cổng 8500)
- RabbitMQ (cổng 5672, UI: 15672)

Sau đó, bạn có thể chạy các service riêng lẻ trên máy local.

### Kiểm tra logs

```bash
# Xem logs của tất cả các service
docker-compose logs

# Xem logs của một service cụ thể
docker-compose logs api-gateway
```

### Dừng hệ thống

```bash
# Dừng toàn bộ hệ thống
docker-compose down

# Dừng chỉ các dịch vụ cơ sở hạ tầng
docker-compose -f docker-compose.dev.yml down
```

## Kiểm tra sức khỏe hệ thống

Để kiểm tra trạng thái của tất cả các service, chạy:

```bash
# Trên Windows
health-check.bat

# Trên Linux/Mac
./health-check.sh
```

## Truy cập các giao diện quản lý

- **Swagger UI (API Documentation)**: http://localhost:5000/api-docs
- **Consul UI (Service Discovery)**: http://localhost:8500
- **RabbitMQ Management UI**: http://localhost:15672 (username: guest, password: guest)

## Phát triển

### Cấu trúc thư mục

```
/
├── backend/
│   ├── gateway/                # API Gateway
│   └── services/
│       ├── user-service/       # User Service
│       ├── apartment-service/  # Apartment Service
│       └── payment-service/    # Payment Service
├── docker-compose.yml          # Cấu hình Docker Compose cho toàn bộ hệ thống
├── docker-compose.dev.yml      # Cấu hình Docker Compose cho môi trường phát triển
├── health-check.bat            # Script kiểm tra sức khỏe hệ thống (Windows)
├── health-check.sh             # Script kiểm tra sức khỏe hệ thống (Linux/Mac)
└── README.md                   # Tài liệu hướng dẫn
```

### Phát triển không sử dụng Docker

Để phát triển mà không cần Docker, bạn cần:

1. Cài đặt MongoDB, Consul và RabbitMQ trên máy local
2. Cấu hình các biến môi trường trong mỗi service
3. Chạy từng service riêng biệt:

```bash
# API Gateway
cd backend/gateway
npm install
npm run dev

# User Service
cd backend/services/user-service
npm install
npm run dev

# Tương tự cho các service khác
```

### Phát triển kết hợp với Docker

Bạn có thể chạy các dịch vụ cơ sở hạ tầng (MongoDB, Consul, RabbitMQ) bằng Docker và chạy các service trên máy local:

1. Khởi động các dịch vụ cơ sở hạ tầng:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. Chạy các service trên máy local:

```bash
# API Gateway
cd backend/gateway
npm install
npm run dev

# Tương tự cho các service khác
```

## Kiểm tra hệ thống

1. Truy cập Swagger UI tại http://localhost:5000/api-docs để kiểm tra và thử nghiệm các API
2. Kiểm tra trạng thái các service trong Consul UI tại http://localhost:8500
3. Kiểm tra hoạt động của message broker trong RabbitMQ Management UI tại http://localhost:15672
