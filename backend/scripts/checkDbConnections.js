const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Danh sách các service cần kiểm tra
const services = [
  { name: "user-service", expectedDb: "qlpt_user_service" },
  { name: "apartment-service", expectedDb: "qlpt_apartment_service" },
  { name: "payment-service", expectedDb: "qlpt_payment_service" },
];

// Hàm kiểm tra kết nối database cho một service
async function checkServiceConnection(service) {
  console.log(`\n===== Kiểm tra kết nối cho ${service.name} =====`);

  // Đường dẫn đến thư mục service
  const servicePath = path.join(__dirname, "..", "services", service.name);

  // Đường dẫn đến file .env
  const envPath = path.join(servicePath, ".env");

  try {
    // Kiểm tra file .env có tồn tại không
    if (!fs.existsSync(envPath)) {
      console.error(`Không tìm thấy file .env trong ${service.name}`);
      return false;
    }

    // Đọc và parse file .env với đường dẫn chính xác
    dotenv.config({ path: envPath });
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // Kiểm tra MONGO_URI có tồn tại không
    if (!envConfig.MONGO_URI) {
      console.error(
        `MONGO_URI không được định nghĩa trong file .env của ${service.name}`
      );
      return false;
    }

    // Trích xuất tên database từ URI
    const dbName = envConfig.MONGO_URI.split("/").pop().split("?")[0];
    console.log(`URI database: ${envConfig.MONGO_URI}`);
    console.log(`Tên database: ${dbName}`);

    // Kiểm tra tên database có đúng không
    if (dbName.toLowerCase() !== service.expectedDb.toLowerCase()) {
      console.error(
        `Tên database không đúng! Mong đợi: ${service.expectedDb}, Thực tế: ${dbName}`
      );
      return false;
    }

    // Thử kết nối đến database
    const conn = await mongoose.createConnection(envConfig.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Kiểm tra tên database sau khi kết nối
    const connectedDbName = conn.db.databaseName;
    console.log(`Đã kết nối đến database: ${connectedDbName}`);

    // Kiểm tra tên database sau khi kết nối có đúng không
    if (connectedDbName.toLowerCase() !== service.expectedDb.toLowerCase()) {
      console.error(
        `Tên database sau khi kết nối không đúng! Mong đợi: ${service.expectedDb}, Thực tế: ${connectedDbName}`
      );
      await conn.close();
      return false;
    }

    // Đóng kết nối
    await conn.close();
    console.log(`Kết nối đến ${service.name} thành công và đúng database!`);
    return true;
  } catch (error) {
    console.error(
      `Lỗi khi kiểm tra kết nối cho ${service.name}:`,
      error.message
    );
    return false;
  }
}

// Hàm chính để kiểm tra tất cả các service
async function checkAllConnections() {
  console.log("Bắt đầu kiểm tra kết nối database cho tất cả các service...");

  let successCount = 0;
  let failCount = 0;

  for (const service of services) {
    const success = await checkServiceConnection(service);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log("\n===== Kết quả kiểm tra =====");
  console.log(`Tổng số service: ${services.length}`);
  console.log(`Số service kết nối thành công: ${successCount}`);
  console.log(`Số service kết nối thất bại: ${failCount}`);

  if (failCount > 0) {
    console.log(
      "\nCó vấn đề với kết nối database! Vui lòng kiểm tra lại các file .env và cấu hình database."
    );
  } else {
    console.log("\nTất cả các kết nối database đều đúng và hoạt động tốt!");
  }
}

// Chạy hàm kiểm tra
checkAllConnections().catch((error) => {
  console.error("Lỗi không mong muốn:", error);
});
