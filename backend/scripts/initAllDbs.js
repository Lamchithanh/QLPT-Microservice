const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const colors = require("colors");

console.log("=== KHỞI TẠO TẤT CẢ CÁC DATABASE ===".bold.cyan);

// Danh sách các service cần khởi tạo database
const services = ["user-service", "apartment-service", "payment-service"];

// Mảng lưu các process
const initProcesses = [];

// Hàm khởi tạo database cho một service
const initServiceDb = (serviceName) => {
  console.log(`\nĐang khởi tạo database cho ${serviceName}...`.yellow);

  const serviceDir = path.join(__dirname, "..", "services", serviceName);
  const scriptPath = path.join(serviceDir, "scripts", "initDb.js");

  // Kiểm tra xem script initDb.js có tồn tại không
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Không tìm thấy script initDb.js cho ${serviceName}!`.red);
    return null;
  }

  // Khởi động process để chạy script initDb.js
  const process = spawn("node", [scriptPath], {
    cwd: serviceDir,
    stdio: "pipe",
    shell: true,
  });

  // Xử lý output
  process.stdout.on("data", (data) => {
    const output = data.toString().trim();
    console.log(`[${serviceName}] ${output}`);
  });

  // Xử lý lỗi
  process.stderr.on("data", (data) => {
    const error = data.toString().trim();
    console.error(`[${serviceName}] `.red + error.red);
  });

  // Xử lý khi process kết thúc
  process.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Khởi tạo database cho ${serviceName} thành công!`.green);
    } else {
      console.error(
        `❌ Khởi tạo database cho ${serviceName} thất bại với mã lỗi: ${code}`
          .red
      );
    }
  });

  return {
    name: serviceName,
    process: process,
  };
};

// Hàm chờ tất cả các process hoàn thành
const waitForAllProcesses = (processes) => {
  return Promise.all(
    processes.map(
      ({ name, process }) =>
        new Promise((resolve) => {
          process.on("close", (code) => {
            resolve({ name, code });
          });
        })
    )
  );
};

// Hàm chính để khởi tạo tất cả các database
const initAllDatabases = async () => {
  // Khởi tạo database cho từng service
  for (const service of services) {
    const processInfo = initServiceDb(service);
    if (processInfo) {
      initProcesses.push(processInfo);
    }
  }

  // Chờ tất cả các process hoàn thành
  const results = await waitForAllProcesses(initProcesses);

  // Hiển thị kết quả
  console.log("\n=== KẾT QUẢ KHỞI TẠO DATABASE ===".bold.cyan);

  const successCount = results.filter((r) => r.code === 0).length;
  const failCount = results.filter((r) => r.code !== 0).length;

  console.log(`Tổng số service: ${results.length}`);
  console.log(`Thành công: ${successCount}`.green);
  console.log(`Thất bại: ${failCount}`.red);

  if (failCount === 0) {
    console.log(
      "\n✅ Tất cả các database đã được khởi tạo thành công!".green.bold
    );
    console.log("\nBạn có thể kiểm tra cấu trúc database bằng lệnh:".cyan);
    console.log("npm run check-db".yellow);
  } else {
    console.log(
      "\n⚠️  Một số database không thể khởi tạo, vui lòng kiểm tra lại!".yellow
        .bold
    );
  }
};

// Xử lý khi nhận tín hiệu thoát
process.on("SIGINT", () => {
  console.log("\nĐang dừng tất cả các process...".yellow);

  initProcesses.forEach(({ name, process }) => {
    console.log(`Đang dừng process cho ${name}...`);
    process.kill();
  });

  process.exit(0);
});

// Chạy hàm khởi tạo
initAllDatabases().catch((error) => {
  console.error("Lỗi không mong muốn:".red, error);
  process.exit(1);
});
