const axios = require("axios");
const colors = require("colors");

// Danh sách các service cần kiểm tra
const services = [
  { name: "User Service", url: "http://localhost:5001/api/health", port: 5001 },
  {
    name: "Apartment Service",
    url: "http://localhost:5002/api/health",
    port: 5002,
  },
  {
    name: "Payment Service",
    url: "http://localhost:5003/api/health",
    port: 5003,
  },
  { name: "API Gateway", url: "http://localhost:5000/api/health", port: 5000 },
];

// Hàm kiểm tra một service
async function checkService(service) {
  try {
    console.log(`Đang kiểm tra ${service.name}...`.yellow);
    const response = await axios.get(service.url, { timeout: 5000 });

    if (response.status === 200) {
      console.log(`✅ ${service.name}: `.green + `Đang hoạt động`.green.bold);

      // Hiển thị thông tin database nếu có
      if (response.data && response.data.database) {
        const db = response.data.database;
        console.log(`   Database: ${db.name || "N/A"}`);
        console.log(
          `   Status: ${
            db.status === "Connected"
              ? colors.green(db.status)
              : colors.red(db.status)
          }`
        );
      }

      return { service: service.name, status: "online", data: response.data };
    } else {
      console.log(
        `❌ ${service.name}: `.red +
          `Không hoạt động (Status: ${response.status})`.red
      );
      return {
        service: service.name,
        status: "error",
        error: `Status code: ${response.status}`,
      };
    }
  } catch (error) {
    console.log(`❌ ${service.name}: `.red + `Không hoạt động`.red.bold);

    if (error.code === "ECONNREFUSED") {
      console.log(`   Lỗi: Không thể kết nối đến port ${service.port}`.red);
    } else {
      console.log(`   Lỗi: ${error.message}`.red);
    }

    return { service: service.name, status: "offline", error: error.message };
  }
}

// Hàm kiểm tra tất cả các service
async function checkAllServices() {
  console.log("\n=== KIỂM TRA TRẠNG THÁI CÁC SERVICE ===\n".cyan.bold);

  const results = [];

  for (const service of services) {
    const result = await checkService(service);
    results.push(result);
    console.log(); // Thêm dòng trống giữa các service
  }

  // Hiển thị tổng kết
  console.log("=== TỔNG KẾT ===".cyan.bold);

  const onlineCount = results.filter((r) => r.status === "online").length;
  const offlineCount = results.filter((r) => r.status === "offline").length;

  console.log(`Tổng số service: ${results.length}`);
  console.log(`Đang hoạt động: ${onlineCount}`.green);
  console.log(`Không hoạt động: ${offlineCount}`.red);

  if (onlineCount === results.length) {
    console.log(
      "\n✅ Tất cả các service đang hoạt động bình thường!".green.bold
    );
  } else {
    console.log(
      "\n⚠️  Một số service không hoạt động, vui lòng kiểm tra lại!".yellow.bold
    );
  }

  return results;
}

// Chạy kiểm tra
checkAllServices().catch((error) => {
  console.error("Lỗi khi kiểm tra các service:".red, error);
});
