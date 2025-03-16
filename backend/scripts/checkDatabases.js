const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load biến môi trường từ file .env gốc
dotenv.config();

// Danh sách các service và collection mong đợi
const expectedStructure = {
  qlpt_user_service: [
    "users",
    "landlords",
    "tenants",
    "passwordresets",
    "notifications",
  ],
  qlpt_apartment_service: [
    "rooms",
    "amenities",
    "reviews",
    "userfavorites",
    "maintenancerequests",
  ],
  qlpt_payment_service: [
    "contracts",
    "services",
    "serviceusages",
    "invoices",
    "payments",
  ],
};

// Hàm kiểm tra một database
async function checkDatabase(dbName) {
  console.log(`\n=== Kiểm tra database: ${dbName} ===`);

  try {
    // Kết nối đến database
    const uri = `mongodb://localhost:27017/${dbName}`;
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Lấy danh sách collection
    const collections = await connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log(`Các collection hiện có trong ${dbName}:`);
    if (collectionNames.length === 0) {
      console.log("  - Không có collection nào");
    } else {
      collectionNames.forEach((name) => {
        console.log(`  - ${name}`);
      });
    }

    // Kiểm tra với danh sách mong đợi
    if (expectedStructure[dbName]) {
      console.log(`\nKiểm tra với danh sách collection mong đợi:`);

      const missing = [];
      expectedStructure[dbName].forEach((expected) => {
        if (!collectionNames.includes(expected)) {
          missing.push(expected);
        }
      });

      if (missing.length === 0) {
        console.log("✅ Tất cả collection mong đợi đều tồn tại");
      } else {
        console.log("❌ Các collection sau đây chưa được tạo:");
        missing.forEach((name) => {
          console.log(`  - ${name}`);
        });
      }
    }

    // Đóng kết nối
    await connection.close();
  } catch (error) {
    console.error(`Lỗi khi kiểm tra database ${dbName}:`, error.message);
  }
}

// Hàm kiểm tra tất cả các database
async function checkAllDatabases() {
  console.log("Bắt đầu kiểm tra các database...\n");

  // Kiểm tra từng database
  for (const dbName of Object.keys(expectedStructure)) {
    await checkDatabase(dbName);
  }

  // Kiểm tra xem có database QLPT không
  await checkDatabase("QLPT");

  console.log("\nĐã hoàn thành kiểm tra các database");
}

// Chạy hàm kiểm tra
checkAllDatabases().then(() => {
  mongoose.disconnect();
});
