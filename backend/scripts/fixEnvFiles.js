const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Hàm đọc file .env
function readEnvFile(servicePath) {
  const envPath = path.join(__dirname, "..", "services", servicePath, ".env");
  if (fs.existsSync(envPath)) {
    return {
      path: envPath,
      content: fs.readFileSync(envPath, "utf8"),
    };
  }
  return null;
}

// Hàm kiểm tra và sửa file .env
function checkAndFixEnvFile(serviceName, dbName) {
  console.log(`\n=== Kiểm tra file .env của ${serviceName} ===`);

  const envFile = readEnvFile(serviceName);
  if (!envFile) {
    console.error(`Không tìm thấy file .env cho ${serviceName}`);
    return;
  }

  console.log(`Đã tìm thấy file .env: ${envFile.path}`);

  // Kiểm tra xem MONGO_URI có đúng không
  const mongoUriMatch = envFile.content.match(/MONGO_URI=(.+)/);
  if (!mongoUriMatch) {
    console.error(
      `Không tìm thấy MONGO_URI trong file .env của ${serviceName}`
    );
    return;
  }

  const currentUri = mongoUriMatch[1].trim();
  console.log(`URI hiện tại: ${currentUri}`);

  // Kiểm tra xem URI có chứa tên database đúng không
  if (currentUri.includes(dbName)) {
    console.log(`✅ URI đã chứa tên database đúng: ${dbName}`);
  } else {
    console.log(`❌ URI không chứa tên database đúng: ${dbName}`);

    // Tìm tên database hiện tại trong URI
    const dbMatch = currentUri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
    if (dbMatch) {
      const currentDbName = dbMatch[1];
      console.log(`Tên database hiện tại trong URI: ${currentDbName}`);

      // Tạo URI mới với tên database đúng
      const newUri = currentUri.replace(`/${currentDbName}`, `/${dbName}`);
      console.log(`URI mới đề xuất: ${newUri}`);

      console.log(`\nĐể sửa file .env, hãy thay thế dòng:`);
      console.log(`MONGO_URI=${currentUri}`);
      console.log(`bằng:`);
      console.log(`MONGO_URI=${newUri}`);
    } else {
      console.error(`Không thể phân tích URI để tìm tên database`);
    }
  }
}

// Hàm kiểm tra tất cả các file .env
function checkAllEnvFiles() {
  console.log("Bắt đầu kiểm tra các file .env...\n");

  // Kiểm tra từng service
  const services = [
    { name: "user-service", db: "qlpt_user_service" },
    { name: "apartment-service", db: "qlpt_apartment_service" },
    { name: "payment-service", db: "qlpt_payment_service" },
  ];

  services.forEach((service) => {
    checkAndFixEnvFile(service.name, service.db);
  });

  console.log("\nĐã hoàn thành kiểm tra các file .env");
  console.log(
    "\nSau khi sửa các file .env, hãy chạy lại script khởi tạo database:"
  );
  console.log("node backend/scripts/initAllDbs.js");
}

// Chạy hàm kiểm tra
checkAllEnvFiles();
