const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Bắt đầu khởi động tất cả các service...");

const services = [
  "user-service",
  "apartment-service",
  "payment-service",
  "gateway",
];

// Mảng lưu các process
const serviceProcesses = [];

// Hàm khởi động service
const startService = (servicePath) => {
  const serviceName = path.basename(servicePath);
  const serviceDir = path.join(__dirname, "services", servicePath);

  // Kiểm tra xem thư mục service có tồn tại không
  if (!fs.existsSync(serviceDir)) {
    if (serviceName === "gateway") {
      // Gateway có thể nằm ở thư mục khác
      const gatewayDir = path.join(__dirname, "gateway");
      if (fs.existsSync(gatewayDir)) {
        return startProcess(gatewayDir, serviceName);
      }
    }
    console.error(`Thư mục ${serviceDir} không tồn tại!`);
    return null;
  }

  return startProcess(serviceDir, serviceName);
};

// Hàm khởi động process
const startProcess = (dir, name) => {
  console.log(`Đang khởi động ${name}...`);

  const process = spawn("npm", ["start"], {
    cwd: dir,
    stdio: "pipe",
    shell: true,
  });

  process.stdout.on("data", (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  process.on("close", (code) => {
    console.log(`[${name}] đã dừng với mã thoát: ${code}`);
  });

  return process;
};

// Khởi động tất cả các service
services.forEach((service) => {
  const process = startService(service);
  if (process) {
    serviceProcesses.push({
      name: service,
      process: process,
    });
  }
});

// Xử lý khi nhận tín hiệu thoát
process.on("SIGINT", () => {
  console.log("Đang dừng tất cả các service...");

  serviceProcesses.forEach(({ name, process }) => {
    console.log(`Đang dừng ${name}...`);
    process.kill();
  });

  process.exit(0);
});

console.log("Tất cả các service đã được khởi động!");
console.log("Nhấn Ctrl+C để dừng tất cả các service.");
