const Consul = require("consul");
const logger = require("../config/logger");

// Cấu hình Consul từ biến môi trường
const consulHost = process.env.CONSUL_HOST || "localhost";
const consulPort = process.env.CONSUL_PORT || 8500;

// Khởi tạo Consul client
const consul = new Consul({
  host: consulHost,
  port: consulPort,
  promisify: true,
});

/**
 * Đăng ký service với Consul
 * @param {Object} options - Thông tin service
 * @returns {Promise<boolean>} - Kết quả đăng ký
 */
const registerService = async (options) => {
  try {
    const { name, address, port, check } = options;
    const serviceId = `${name}-${address}-${port}`;

    await consul.agent.service.register({
      id: serviceId,
      name: name,
      address: address,
      port: port,
      check: check,
    });

    logger.info(`Service ${name} registered with Consul`);
    return true;
  } catch (error) {
    logger.error(`Failed to register service with Consul: ${error.message}`);
    return false;
  }
};

/**
 * Hủy đăng ký service với Consul
 * @param {string} serviceId - ID của service
 * @returns {Promise<boolean>} - Kết quả hủy đăng ký
 */
const deregisterService = async (serviceId) => {
  try {
    await consul.agent.service.deregister(serviceId);
    logger.info(`Service ${serviceId} deregistered from Consul`);
    return true;
  } catch (error) {
    logger.error(`Failed to deregister service from Consul: ${error.message}`);
    return false;
  }
};

/**
 * Lấy địa chỉ của service từ Consul
 * @param {string} serviceName - Tên service
 * @returns {Promise<string|null>} - Địa chỉ service hoặc null
 */
const getServiceAddress = async (serviceName) => {
  try {
    const services = await consul.catalog.service.nodes(serviceName);

    if (services && services.length > 0) {
      const service = services[0];
      const address = `http://${service.ServiceAddress}:${service.ServicePort}`;
      logger.info(`Found ${serviceName} at ${address}`);
      return address;
    }

    logger.warn(`No instances of ${serviceName} found in Consul`);
    return null;
  } catch (error) {
    logger.error(`Failed to get service address from Consul: ${error.message}`);
    return null;
  }
};

/**
 * Theo dõi thay đổi của service
 * @param {string} serviceName - Tên service
 * @param {Function} callback - Hàm callback khi có thay đổi
 */
const watchService = (serviceName, callback) => {
  const watch = consul.watch({
    method: consul.catalog.service.nodes,
    options: { service: serviceName },
  });

  watch.on("change", (data) => {
    callback(null, data);
  });

  watch.on("error", (err) => {
    logger.error(`Watch error for service ${serviceName}: ${err.message}`);
    callback(err);
  });

  return watch;
};

module.exports = {
  registerService,
  deregisterService,
  getServiceAddress,
  watchService,
};
