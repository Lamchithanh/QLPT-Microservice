const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const colors = require("colors");

// Danh sách các service và database tương ứng
const services = [
  {
    name: "user-service",
    expectedDb: "qlpt_user_service",
    collections: [
      "users",
      "landlords",
      "tenants",
      "notifications",
      "passwordresets",
    ],
  },
  {
    name: "apartment-service",
    expectedDb: "qlpt_apartment_service",
    collections: ["apartments", "rooms", "facilities", "issues"],
  },
  {
    name: "payment-service",
    expectedDb: "qlpt_payment_service",
    collections: ["payments", "invoices", "transactions"],
  },
];

// Hàm đọc file .env
function readEnvFile(servicePath) {
  try {
    const envPath = path.join(__dirname, "..", "services", servicePath, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envVars = {};

      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      });

      return envVars;
    }
    return null;
  } catch (error) {
    console.error(`Lỗi khi đọc file .env của ${servicePath}:`, error.message);
    return null;
  }
}

// Hàm kiểm tra database
async function checkDatabase(service) {
  console.log(`\n=== Kiểm tra database cho ${service.name} ===`.cyan);

  try {
    // Đọc file .env
    const envVars = readEnvFile(service.name);
    if (!envVars || !envVars.MONGO_URI) {
      console.log(
        `❌ Không tìm thấy MONGO_URI trong file .env của ${service.name}`.red
      );
      return {
        service: service.name,
        status: "error",
        error: "Missing MONGO_URI",
      };
    }

    // Kết nối đến MongoDB
    console.log(`Đang kết nối đến MongoDB...`.yellow);
    const connection = await mongoose.createConnection(envVars.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Lấy tên database từ connection
    const dbName = connection.db.databaseName;
    console.log(`Đã kết nối đến database: ${dbName}`.green);

    // Kiểm tra tên database
    if (dbName !== service.expectedDb) {
      console.log(
        `⚠️  Tên database không khớp với mong đợi: ${service.expectedDb}`.yellow
      );
    } else {
      console.log(
        `✅ Tên database khớp với mong đợi: ${service.expectedDb}`.green
      );
    }

    // Lấy danh sách collections
    const collections = await connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log(`\nDanh sách collections trong database ${dbName}:`.cyan);
    collectionNames.forEach((name) => {
      console.log(`- ${name}`);
    });

    // Kiểm tra các collections mong đợi
    console.log(`\nKiểm tra các collections mong đợi:`.cyan);
    const missingCollections = [];

    service.collections.forEach((expectedCollection) => {
      if (collectionNames.includes(expectedCollection)) {
        console.log(`✅ Collection ${expectedCollection} tồn tại`.green);
      } else {
        console.log(`❌ Collection ${expectedCollection} không tồn tại`.red);
        missingCollections.push(expectedCollection);
      }
    });

    // Đóng kết nối
    await connection.close();
    console.log(`Đã đóng kết nối đến database ${dbName}`.gray);

    return {
      service: service.name,
      database: dbName,
      status: missingCollections.length === 0 ? "ok" : "warning",
      collections: collectionNames,
      missingCollections,
    };
  } catch (error) {
    console.log(
      `❌ Lỗi khi kiểm tra database cho ${service.name}: ${error.message}`.red
    );
    return { service: service.name, status: "error", error: error.message };
  }
}

// Hàm kiểm tra tất cả các database
async function checkAllDatabases() {
  console.log("=== KIỂM TRA CẤU TRÚC DATABASE ===".bold.cyan);

  const results = [];

  for (const service of services) {
    const result = await checkDatabase(service);
    results.push(result);
  }

  // Hiển thị tổng kết
  console.log("\n=== TỔNG KẾT ===".bold.cyan);

  const okCount = results.filter((r) => r.status === "ok").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  console.log(`Tổng số database: ${results.length}`);
  console.log(`Hoàn toàn OK: ${okCount}`.green);
  console.log(`Có cảnh báo: ${warningCount}`.yellow);
  console.log(`Có lỗi: ${errorCount}`.red);

  if (errorCount === 0 && warningCount === 0) {
    console.log("\n✅ Tất cả các database đều có cấu trúc đúng!".green.bold);
  } else if (errorCount === 0) {
    console.log(
      "\n⚠️  Một số database thiếu collections, có thể cần chạy lại script khởi tạo!"
        .yellow.bold
    );
  } else {
    console.log(
      "\n❌ Một số database có lỗi, vui lòng kiểm tra lại cấu hình kết nối!".red
        .bold
    );
  }

  return results;
}

// Chạy kiểm tra
checkAllDatabases()
  .catch((error) => {
    console.error("Lỗi khi kiểm tra các database:".red, error);
  })
  .finally(() => {
    // Đảm bảo đóng tất cả các kết nối khi hoàn thành
    mongoose.disconnect();
  });
