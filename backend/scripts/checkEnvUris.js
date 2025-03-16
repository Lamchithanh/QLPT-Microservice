const fs = require("fs");
const path = require("path");

// Danh sách các service cần kiểm tra
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

// Hàm kiểm tra URI kết nối
function checkMongoUri(content, expectedDb) {
  const mongoUriMatch = content.match(/MONGO_URI=(.+)/);
  if (!mongoUriMatch) {
    return {
      status: "error",
      message: "Không tìm thấy MONGO_URI trong file .env",
    };
  }

  const uri = mongoUriMatch[1].trim();

  // Kiểm tra xem URI có chứa tên database không
  const dbMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (!dbMatch) {
    return {
      status: "error",
      message: "Không thể phân tích URI để tìm tên database",
      uri,
    };
  }

  const dbName = dbMatch[2];

  if (dbName === expectedDb) {
    return {
      status: "ok",
      message: `URI đã chứa tên database đúng: ${dbName}`,
      uri,
      dbName,
    };
  } else {
    return {
      status: "warning",
      message: `URI chứa tên database không đúng: ${dbName} (mong đợi: ${expectedDb})`,
      uri,
      dbName,
      expectedDb,
      fixedUri: uri.replace(`/${dbName}`, `/${expectedDb}`),
    };
  }
}

// Hàm kiểm tra tất cả các service
function checkAllServices() {
  console.log("Bắt đầu kiểm tra URI kết nối MongoDB trong các file .env...\n");

  let hasError = false;

  services.forEach((service) => {
    console.log(`=== Kiểm tra ${service.name} ===`);

    const envFile = readEnvFile(service.name);
    if (!envFile) {
      console.error(`Không tìm thấy file .env cho ${service.name}`);
      hasError = true;
      return;
    }

    console.log(`Đã tìm thấy file .env: ${envFile.path}`);

    const result = checkMongoUri(envFile.content, service.expectedDb);

    if (result.status === "ok") {
      console.log(`✅ ${result.message}`);
    } else if (result.status === "warning") {
      console.warn(`⚠️ ${result.message}`);
      console.warn(`URI hiện tại: ${result.uri}`);
      console.warn(`URI đề xuất: ${result.fixedUri}`);

      console.log(
        `\nĐể sửa, hãy thay thế dòng sau trong file ${envFile.path}:`
      );
      console.log(`MONGO_URI=${result.uri}`);
      console.log(`thành:`);
      console.log(`MONGO_URI=${result.fixedUri}`);

      hasError = true;
    } else {
      console.error(`❌ ${result.message}`);
      hasError = true;
    }

    console.log("");
  });

  if (hasError) {
    console.log("\n⚠️ Đã phát hiện vấn đề với URI kết nối MongoDB!");
    console.log(
      "Vui lòng sửa các vấn đề trên, sau đó chạy lại script khởi tạo database:"
    );
    console.log("node backend/scripts/initAllDbs.js");
  } else {
    console.log("\n✅ Tất cả các URI kết nối MongoDB đều đúng!");
  }
}

// Chạy kiểm tra
checkAllServices();
