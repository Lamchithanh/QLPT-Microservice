const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load biến môi trường từ file .env gốc
dotenv.config();

// Danh sách các service và collection mong đợi
const expectedStructure = {
  qlpt_user_service: [
    { name: "users", schema: "../services/user-service/models/User.js" },
    {
      name: "landlords",
      schema: "../services/user-service/models/Landlord.js",
    },
    { name: "tenants", schema: "../services/user-service/models/Tenant.js" },
    {
      name: "passwordresets",
      schema: "../services/user-service/models/PasswordReset.js",
    },
    {
      name: "notifications",
      schema: "../services/user-service/models/Notification.js",
    },
  ],
  qlpt_apartment_service: [
    { name: "rooms", schema: "../services/apartment-service/models/Room.js" },
    {
      name: "amenities",
      schema: "../services/apartment-service/models/Amenity.js",
    },
    {
      name: "reviews",
      schema: "../services/apartment-service/models/Review.js",
    },
    {
      name: "userfavorites",
      schema: "../services/apartment-service/models/UserFavorite.js",
    },
    {
      name: "maintenancerequests",
      schema: "../services/apartment-service/models/MaintenanceRequest.js",
    },
  ],
  qlpt_payment_service: [
    {
      name: "contracts",
      schema: "../services/payment-service/models/Contract.js",
    },
    {
      name: "services",
      schema: "../services/payment-service/models/Service.js",
    },
    {
      name: "serviceusages",
      schema: "../services/payment-service/models/ServiceUsage.js",
    },
    {
      name: "invoices",
      schema: "../services/payment-service/models/Invoice.js",
    },
    {
      name: "payments",
      schema: "../services/payment-service/models/Payment.js",
    },
  ],
};

// Hàm kiểm tra và sửa một database
async function fixDatabase(dbName) {
  console.log(`\n=== Kiểm tra và sửa database: ${dbName} ===`);

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
        if (!collectionNames.includes(expected.name)) {
          missing.push(expected);
        }
      });

      if (missing.length === 0) {
        console.log("✅ Tất cả collection mong đợi đều tồn tại");
      } else {
        console.log("❌ Các collection sau đây chưa được tạo:");
        missing.forEach((item) => {
          console.log(`  - ${item.name}`);
        });

        // Chạy lại script khởi tạo database tương ứng
        console.log(`\nĐang chạy lại script khởi tạo cho ${dbName}...`);

        let scriptPath;
        if (dbName === "qlpt_user_service") {
          scriptPath = "../services/user-service/scripts/initDb.js";
        } else if (dbName === "qlpt_apartment_service") {
          scriptPath = "../services/apartment-service/scripts/initDb.js";
        } else if (dbName === "qlpt_payment_service") {
          scriptPath = "../services/payment-service/scripts/initDb.js";
        }

        if (scriptPath) {
          const fullPath = path.join(__dirname, scriptPath);
          if (fs.existsSync(fullPath)) {
            console.log(`Đang chạy script: ${fullPath}`);
            try {
              // Thay vì require script, chúng ta sẽ thông báo cho người dùng chạy script
              console.log(
                `Vui lòng chạy lệnh sau để khởi tạo lại database ${dbName}:`
              );
              console.log(`node ${fullPath}`);
            } catch (error) {
              console.error(
                `Lỗi khi chạy script ${scriptPath}:`,
                error.message
              );
            }
          } else {
            console.error(`Không tìm thấy script: ${fullPath}`);
          }
        }
      }
    }

    // Đóng kết nối
    await connection.close();
  } catch (error) {
    console.error(`Lỗi khi kiểm tra database ${dbName}:`, error.message);
  }
}

// Hàm kiểm tra xem có database QLPT không và di chuyển dữ liệu nếu cần
async function checkAndFixQLPT() {
  console.log(`\n=== Kiểm tra database QLPT ===`);

  try {
    // Kết nối đến database QLPT
    const uri = "mongodb://localhost:27017/QLPT";
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Lấy danh sách collection
    const collections = await connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    if (collectionNames.length === 0) {
      console.log("Database QLPT không có collection nào");
    } else {
      console.log("Database QLPT có các collection sau:");
      collectionNames.forEach((name) => {
        console.log(`  - ${name}`);
      });

      console.log(
        "\n⚠️ Dữ liệu đang nằm trong database QLPT thay vì được phân tách theo microservices"
      );
      console.log(
        "Vui lòng chạy lại script khởi tạo database để tạo cấu trúc đúng:"
      );
      console.log("node backend/scripts/initAllDbs.js");
    }

    // Đóng kết nối
    await connection.close();
  } catch (error) {
    console.error("Lỗi khi kiểm tra database QLPT:", error.message);
  }
}

// Hàm kiểm tra tất cả các database
async function checkAllDatabases() {
  console.log("Bắt đầu kiểm tra các database...\n");

  // Kiểm tra từng database
  for (const dbName of Object.keys(expectedStructure)) {
    await fixDatabase(dbName);
  }

  // Kiểm tra xem có database QLPT không
  await checkAndFixQLPT();

  console.log("\nĐã hoàn thành kiểm tra các database");
  console.log(
    "\nNếu có vấn đề với cấu trúc database, vui lòng kiểm tra file .env trong mỗi service:"
  );
  console.log(
    "1. backend/services/user-service/.env - MONGO_URI=mongodb://localhost:27017/qlpt_user_service"
  );
  console.log(
    "2. backend/services/apartment-service/.env - MONGO_URI=mongodb://localhost:27017/qlpt_apartment_service"
  );
  console.log(
    "3. backend/services/payment-service/.env - MONGO_URI=mongodb://localhost:27017/qlpt_payment_service"
  );
}

// Chạy hàm kiểm tra
checkAllDatabases().then(() => {
  mongoose.disconnect();
});
