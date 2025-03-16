const fs = require("fs");
const path = require("path");

// Danh sách các service cần sửa
const services = [
  { name: "user-service", expectedDb: "qlpt_user_service" },
  { name: "apartment-service", expectedDb: "qlpt_apartment_service" },
  { name: "payment-service", expectedDb: "qlpt_payment_service" },
];

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

// Hàm sửa URI kết nối
function fixMongoUri(content, expectedDb) {
  const mongoUriMatch = content.match(/MONGO_URI=(.+)/);
  if (!mongoUriMatch) {
    return {
      status: "error",
      message: "Không tìm thấy MONGO_URI trong file .env",
      content,
    };
  }

  const uri = mongoUriMatch[1].trim();

  // Kiểm tra xem URI có chứa tên database không
  const dbMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (!dbMatch) {
    return {
      status: "error",
      message: "Không thể phân tích URI để tìm tên database",
      content,
    };
  }

  const dbName = dbMatch[2];

  if (dbName === expectedDb) {
    return {
      status: "ok",
      message: `URI đã chứa tên database đúng: ${dbName}`,
      content,
    };
  } else {
    const fixedUri = uri.replace(`/${dbName}`, `/${expectedDb}`);
    const fixedContent = content.replace(
      `MONGO_URI=${uri}`,
      `MONGO_URI=${fixedUri}`
    );

    return {
      status: "fixed",
      message: `Đã sửa URI từ ${dbName} thành ${expectedDb}`,
      content: fixedContent,
      oldUri: uri,
      newUri: fixedUri,
    };
  }
}

// Hàm sửa file .env
function fixEnvFile(serviceName, expectedDb) {
  console.log(`=== Kiểm tra và sửa ${serviceName} ===`);

  const envFile = readEnvFile(serviceName);
  if (!envFile) {
    console.error(`Không tìm thấy file .env cho ${serviceName}`);
    return false;
  }

  console.log(`Đã tìm thấy file .env: ${envFile.path}`);

  const result = fixMongoUri(envFile.content, expectedDb);

  if (result.status === "ok") {
    console.log(`✅ ${result.message}`);
    return true;
  } else if (result.status === "fixed") {
    console.log(`🔧 ${result.message}`);
    console.log(`URI cũ: ${result.oldUri}`);
    console.log(`URI mới: ${result.newUri}`);

    // Ghi file .env mới
    fs.writeFileSync(envFile.path, result.content);
    console.log(`✅ Đã sửa file ${envFile.path}`);

    return true;
  } else {
    console.error(`❌ ${result.message}`);
    return false;
  }
}

// Hàm sửa tất cả các file .env
function fixAllEnvFiles() {
  console.log("Bắt đầu sửa URI kết nối MongoDB trong các file .env...\n");

  let success = true;

  services.forEach((service) => {
    const result = fixEnvFile(service.name, service.expectedDb);
    if (!result) {
      success = false;
    }
    console.log("");
  });

  if (success) {
    console.log("\n✅ Đã sửa tất cả các file .env thành công!");
    console.log("Bây giờ bạn có thể chạy lại script khởi tạo database:");
    console.log("node backend/scripts/initAllDbs.js");
  } else {
    console.log("\n⚠️ Có lỗi xảy ra khi sửa các file .env!");
    console.log("Vui lòng kiểm tra lại các file .env và sửa thủ công.");
  }
}

// Chạy sửa
fixAllEnvFiles();
