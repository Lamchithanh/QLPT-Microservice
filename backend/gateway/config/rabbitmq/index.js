const connection = require("./connection");
const publisher = require("./publisher");
const consumer = require("./consumer");

// Khởi tạo RabbitMQ
const initializeRabbitMQ = async () => {
  try {
    // Kết nối đến RabbitMQ
    const result = await connection.connect();
    if (!result) {
      throw new Error("Failed to connect to RabbitMQ");
    }

    // Thiết lập exchanges
    const exchangesSetup = await publisher.setupExchanges();
    if (!exchangesSetup) {
      throw new Error("Failed to setup exchanges");
    }

    // Thiết lập queues
    const queuesSetup = await consumer.setupQueues();
    if (!queuesSetup) {
      throw new Error("Failed to setup queues");
    }

    // Bắt đầu consume messages từ gateway queues
    await consumer.consumeMessages(
      consumer.QUEUES.GATEWAY_EVENTS,
      (err, message) => {
        if (err) {
          console.error("Error consuming message from GATEWAY_EVENTS:", err);
          return;
        }
        console.log(`Received event: ${message.routingKey}`, message.content);
        // Xử lý event ở đây
      }
    );

    await consumer.consumeMessages(
      consumer.QUEUES.GATEWAY_NOTIFICATIONS,
      (err, message) => {
        if (err) {
          console.error(
            "Error consuming message from GATEWAY_NOTIFICATIONS:",
            err
          );
          return;
        }
        console.log(
          `Received notification: ${message.routingKey}`,
          message.content
        );
        // Xử lý notification ở đây
      }
    );

    console.log("RabbitMQ initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing RabbitMQ:", error);
    return false;
  }
};

// Đóng kết nối RabbitMQ
const closeRabbitMQ = async () => {
  await connection.close();
};

// Publish event helper functions
const publishEvent = {
  user: publisher.publishUserEvent,
  apartment: publisher.publishApartmentEvent,
  payment: publisher.publishPaymentEvent,
  notification: publisher.publishNotificationEvent,
};

module.exports = {
  initializeRabbitMQ,
  closeRabbitMQ,
  publishEvent,
  ROUTING_KEYS: publisher.ROUTING_KEYS,
  EXCHANGES: publisher.EXCHANGES,
  QUEUES: consumer.QUEUES,
};
