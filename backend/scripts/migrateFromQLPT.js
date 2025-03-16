const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const readline = require("readline");

// Danh sách các service và database tương ứng
const services = [
  {
    name: "user-service",
    expectedDb: "qlpt_user_service",
    collections: [
      "users",
      "landlords",
      "tenants",
      "passwordresets",
      "notifications",
    ],
  },
  {
    name: "apartment-service",
    expectedDb: "qlpt_apartment_service",
    collections: [
      "rooms",
      "amenities",
      "reviews",
      "userfavorites",
      "maintenancerequests",
    ],
  },
  {
    name: "payment-service",
    expectedDb: "qlpt_payment_service",
    collections: [
      "contracts",
      "services",
      "serviceusages",
      "invoices",
      "payments",
    ],
  },
];

// Tạo interface để đọc input từ người dùng
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Hàm để hỏi người dùng
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Hàm kết nối đến database
async function connectToDatabase(uri) {
  return mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Hàm di chuyển dữ liệu từ một collection
async function migrateCollection(sourceConn, targetConn, collectionName) {
  console.log(`Đang di chuyển collection: ${collectionName}`);

  try {
    // Lấy dữ liệu từ collection nguồn
    const sourceData = await sourceConn.db
      .collection(collectionName)
      .find({})
      .toArray();

    if (sourceData.length === 0) {
      console.log(
        `  - Collection ${collectionName} không có dữ liệu để di chuyển`
      );
      return { success: true, count: 0 };
    }

    console.log(
      `  - Đã tìm thấy ${sourceData.length} documents trong collection ${collectionName}`
    );

    // Kiểm tra xem collection đích đã có dữ liệu chưa
    const targetCount = await targetConn.db
      .collection(collectionName)
      .countDocuments();
    if (targetCount > 0) {
      const answer = await askQuestion(
        `  - Collection ${collectionName} trong database đích đã có ${targetCount} documents. Bạn có muốn xóa và thay thế không? (y/n): `
      );
      if (answer.toLowerCase() !== "y") {
        console.log(`  - Bỏ qua di chuyển collection ${collectionName}`);
        return { success: false, count: 0, skipped: true };
      }

      // Xóa dữ liệu hiện có trong collection đích
      await targetConn.db.collection(collectionName).deleteMany({});
      console.log(
        `  - Đã xóa dữ liệu hiện có trong collection ${collectionName} của database đích`
      );
    }

    // Chèn dữ liệu vào collection đích
    const result = await targetConn.db
      .collection(collectionName)
      .insertMany(sourceData);
    console.log(
      `  - Đã di chuyển ${result.insertedCount} documents vào collection ${collectionName}`
    );

    return { success: true, count: result.insertedCount };
  } catch (error) {
    console.error(
      `  - Lỗi khi di chuyển collection ${collectionName}:`,
      error.message
    );
    return { success: false, count: 0, error: error.message };
  }
}

// Hàm di chuyển dữ liệu cho một service
async function migrateService(service, sourceConn) {
  console.log(`\n===== Di chuyển dữ liệu cho ${service.name} =====`);

  // Đường dẫn đến thư mục service
  const servicePath = path.join(__dirname, "..", "services", service.name);

  // Đường dẫn đến file .env
  const envPath = path.join(servicePath, ".env");

  try {
    // Kiểm tra file .env có tồn tại không
    if (!fs.existsSync(envPath)) {
      console.error(`Không tìm thấy file .env trong ${service.name}`);
      return { success: false, error: "ENV_FILE_NOT_FOUND" };
    }

    // Đọc và parse file .env với đường dẫn chính xác
    dotenv.config({ path: envPath });
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // Kiểm tra MONGO_URI có tồn tại không
    if (!envConfig.MONGO_URI) {
      console.error(
        `MONGO_URI không được định nghĩa trong file .env của ${service.name}`
      );
      return { success: false, error: "MONGO_URI_NOT_DEFINED" };
    }

    // Trích xuất tên database từ URI
    const dbName = envConfig.MONGO_URI.split("/").pop().split("?")[0];
    console.log(`URI database đích: ${envConfig.MONGO_URI}`);
    console.log(`Tên database đích: ${dbName}`);

    // Kiểm tra tên database có đúng không
    if (dbName.toLowerCase() !== service.expectedDb.toLowerCase()) {
      console.error(
        `Tên database không đúng! Mong đợi: ${service.expectedDb}, Thực tế: ${dbName}`
      );
      return { success: false, error: "WRONG_DB_NAME" };
    }

    // Kết nối đến database đích
    const targetConn = await connectToDatabase(envConfig.MONGO_URI);

    // Di chuyển từng collection
    const results = {};
    let totalMigrated = 0;

    for (const collectionName of service.collections) {
      const result = await migrateCollection(
        sourceConn,
        targetConn,
        collectionName
      );
      results[collectionName] = result;

      if (result.success && !result.skipped) {
        totalMigrated += result.count;
      }
    }

    // Đóng kết nối
    await targetConn.close();

    return {
      success: true,
      dbName,
      results,
      totalMigrated,
    };
  } catch (error) {
    console.error(
      `Lỗi khi di chuyển dữ liệu cho ${service.name}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
}

// Hàm chính để di chuyển dữ liệu từ QLPT
async function migrateFromQLPT() {
  console.log(
    "Bắt đầu di chuyển dữ liệu từ database QLPT sang các database riêng biệt..."
  );

  try {
    // Lấy MONGO_URI từ bất kỳ service nào
    const envPath = path.join(
      __dirname,
      "..",
      "services",
      "user-service",
      ".env"
    );
    if (!fs.existsSync(envPath)) {
      console.error("Không tìm thấy file .env trong user-service");
      return;
    }

    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (!envConfig.MONGO_URI) {
      console.error(
        "MONGO_URI không được định nghĩa trong file .env của user-service"
      );
      return;
    }

    // Tạo URI cho database QLPT
    const baseUri = envConfig.MONGO_URI.split("/").slice(0, -1).join("/");
    const qlptUri = `${baseUri}/QLPT`;

    console.log(`Kết nối đến database QLPT với URI: ${qlptUri}`);

    // Kết nối đến database QLPT
    const sourceConn = await connectToDatabase(qlptUri);

    // Lấy danh sách các collection
    const collections = await sourceConn.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log(`Các collection trong database QLPT:`, collectionNames);

    if (collectionNames.length === 0) {
      console.log("Database QLPT không có collection nào để di chuyển!");
      await sourceConn.close();
      return;
    }

    // Xác nhận từ người dùng
    const answer = await askQuestion(
      "Bạn có chắc chắn muốn di chuyển dữ liệu từ database QLPT sang các database riêng biệt? (y/n): "
    );
    if (answer.toLowerCase() !== "y") {
      console.log("Đã hủy quá trình di chuyển dữ liệu.");
      await sourceConn.close();
      return;
    }

    // Di chuyển dữ liệu cho từng service
    const results = {};

    for (const service of services) {
      results[service.name] = await migrateService(service, sourceConn);
    }

    // Đóng kết nối đến database nguồn
    await sourceConn.close();

    // Hiển thị kết quả
    console.log("\n===== Kết quả di chuyển dữ liệu =====");

    let totalSuccess = 0;
    let totalFailed = 0;

    for (const service of services) {
      const result = results[service.name];

      if (result.success) {
        console.log(
          `\n${service.name}: OK - Đã di chuyển ${result.totalMigrated} documents vào ${result.dbName}`
        );
        totalSuccess++;
      } else {
        console.log(`\n${service.name}: LỖI - ${result.error}`);
        totalFailed++;
      }
    }

    console.log(`\nTổng số service: ${services.length}`);
    console.log(`Số service di chuyển thành công: ${totalSuccess}`);
    console.log(`Số service di chuyển thất bại: ${totalFailed}`);

    // Hỏi người dùng có muốn xóa database QLPT không
    if (totalSuccess > 0) {
      const deleteAnswer = await askQuestion(
        "Bạn có muốn xóa database QLPT sau khi di chuyển dữ liệu? (y/n): "
      );
      if (deleteAnswer.toLowerCase() === "y") {
        try {
          const tempConn = await connectToDatabase(qlptUri);
          await tempConn.db.dropDatabase();
          await tempConn.close();
          console.log("Đã xóa database QLPT thành công!");
        } catch (error) {
          console.error("Lỗi khi xóa database QLPT:", error.message);
        }
      }
    }

    console.log("\nQuá trình di chuyển dữ liệu đã hoàn tất!");
  } catch (error) {
    console.error("Lỗi không mong muốn:", error);
  } finally {
    rl.close();
  }
}

// Chạy hàm di chuyển dữ liệu
migrateFromQLPT().catch((error) => {
  console.error("Lỗi không mong muốn:", error);
  rl.close();
});
