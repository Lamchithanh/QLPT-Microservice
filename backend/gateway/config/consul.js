const Consul = require("consul");

// Khởi tạo Consul client
const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: process.env.CONSUL_PORT || 8500,
  promisify: true,
});

// Đăng ký service với Consul
const registerService = async (
  serviceName,
  serviceId,
  serviceAddress,
  servicePort,
  tags = []
) => {
  try {
    await consul.agent.service.register({
      name: serviceName,
      id: serviceId,
      address: serviceAddress,
      port: parseInt(servicePort),
      tags: tags,
      check: {
        http: `http://${serviceAddress}:${servicePort}/api/health`,
        interval: "15s",
        timeout: "5s",
      },
    });
    console.log(`Service ${serviceName} registered with Consul`);
    return true;
  } catch (error) {
    console.error(
      `Error registering service ${serviceName} with Consul:`,
      error
    );
    return false;
  }
};

// Hủy đăng ký service
const deregisterService = async (serviceId) => {
  try {
    await consul.agent.service.deregister(serviceId);
    console.log(`Service ${serviceId} deregistered from Consul`);
    return true;
  } catch (error) {
    console.error(
      `Error deregistering service ${serviceId} from Consul:`,
      error
    );
    return false;
  }
};

// Lấy thông tin service từ Consul
const getService = async (serviceName) => {
  try {
    const services = await consul.catalog.service.nodes(serviceName);
    if (services && services.length > 0) {
      // Lấy service đầu tiên trong danh sách
      const service = services[0];
      return {
        address: service.ServiceAddress,
        port: service.ServicePort,
      };
    }
    throw new Error(`No instances of ${serviceName} found`);
  } catch (error) {
    console.error(`Error getting service ${serviceName} from Consul:`, error);
    return null;
  }
};

// Lấy tất cả instances của một service
const getAllServiceInstances = async (serviceName) => {
  try {
    const services = await consul.catalog.service.nodes(serviceName);
    if (services && services.length > 0) {
      return services.map((service) => ({
        id: service.ServiceID,
        address: service.ServiceAddress,
        port: service.ServicePort,
      }));
    }
    return [];
  } catch (error) {
    console.error(
      `Error getting all instances of ${serviceName} from Consul:`,
      error
    );
    return [];
  }
};

// Theo dõi sự thay đổi của service
const watchService = (serviceName, callback) => {
  const watch = consul.watch({
    method: consul.catalog.service.nodes,
    options: { service: serviceName },
  });

  watch.on("change", (data) => {
    const services = data.map((service) => ({
      id: service.ServiceID,
      address: service.ServiceAddress,
      port: service.ServicePort,
    }));
    callback(null, services);
  });

  watch.on("error", (err) => {
    console.error(`Error watching service ${serviceName}:`, err);
    callback(err);
  });

  return watch;
};

module.exports = {
  consul,
  registerService,
  deregisterService,
  getService,
  getAllServiceInstances,
  watchService,
};
