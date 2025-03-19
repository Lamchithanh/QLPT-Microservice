const amqp = require("amqplib");
const logger = require("../config/logger");

// Cấu hình RabbitMQ từ biến môi trường
const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const rabbitmqUser = process.env.RABBITMQ_USER || "guest";
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest";

// Định nghĩa exchanges
const EXCHANGES = {
  USER: "user.events",
  APARTMENT: "apartment.events",
  PAYMENT: "payment.events",
  NOTIFICATION: "notification.events",
};

// Định nghĩa routing keys
const ROUTING_KEYS = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  APARTMENT_CREATED: "apartment.created",
  APARTMENT_UPDATED: "apartment.updated",
  APARTMENT_DELETED: "apartment.deleted",
  PAYMENT_CREATED: "payment.created",
  PAYMENT_UPDATED: "payment.updated",
  PAYMENT_COMPLETED: "payment.completed",
  NOTIFICATION_SENT: "notification.sent",
};

let connection = null;
let channel = null;

/**
 * Kết nối đến RabbitMQ
 * @returns {Promise<boolean>} - Kết quả kết nối
 */
const connect = async () => {
  try {
    // Tạo URL kết nối với thông tin xác thực
    const connectionUrl = rabbitmqUrl.replace(
      "amqp://",
      `amqp://${rabbitmqUser}:${rabbitmqPassword}@`
    );

    connection = await amqp.connect(connectionUrl);
    logger.info("Connected to RabbitMQ");

    // Xử lý khi kết nối đóng
    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
      setTimeout(connect, 5000);
    });

    // Xử lý lỗi kết nối
    connection.on("error", (err) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
      setTimeout(connect, 5000);
    });

    // Tạo channel
    channel = await connection.createChannel();
    logger.info("RabbitMQ channel created");

    return true;
  } catch (error) {
    logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
    return false;
  }
};

/**
 * Thiết lập các exchanges
 * @returns {Promise<boolean>} - Kết quả thiết lập
 */
const setupExchanges = async () => {
  if (!channel) {
    logger.error("Cannot setup exchanges: No RabbitMQ channel available");
    return false;
  }

  try {
    // Tạo các exchanges
    for (const exchange of Object.values(EXCHANGES)) {
      await channel.assertExchange(exchange, "topic", { durable: true });
      logger.info(`Exchange ${exchange} asserted`);
    }

    return true;
  } catch (error) {
    logger.error(`Failed to setup exchanges: ${error.message}`);
    return false;
  }
};

/**
 * Đăng ký consumer cho một queue
 * @param {string} queueName - Tên queue
 * @param {string} exchangeName - Tên exchange
 * @param {string} routingKey - Routing key
 * @param {Function} callback - Hàm xử lý message
 * @returns {Promise<boolean>} - Kết quả đăng ký
 */
const registerConsumer = async (
  queueName,
  exchangeName,
  routingKey,
  callback
) => {
  if (!channel) {
    logger.error("Cannot register consumer: No RabbitMQ channel available");
    return false;
  }

  try {
    // Tạo queue
    await channel.assertQueue(queueName, { durable: true });

    // Bind queue với exchange và routing key
    await channel.bindQueue(queueName, exchangeName, routingKey);

    // Đăng ký consumer
    await channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing message: ${error.message}`);
          channel.nack(msg);
        }
      }
    });

    logger.info(
      `Consumer registered for queue ${queueName} with routing key ${routingKey}`
    );
    return true;
  } catch (error) {
    logger.error(`Failed to register consumer: ${error.message}`);
    return false;
  }
};

/**
 * Publish message đến exchange
 * @param {string} exchangeName - Tên exchange
 * @param {string} routingKey - Routing key
 * @param {Object} data - Dữ liệu cần gửi
 * @returns {Promise<boolean>} - Kết quả gửi
 */
const publishToExchange = async (exchangeName, routingKey, data) => {
  if (!channel) {
    logger.error("Cannot publish message: No RabbitMQ channel available");
    return false;
  }

  try {
    const message = {
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        routingKey,
      },
    };

    const result = channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    if (result) {
      logger.info(
        `Message published to ${exchangeName} with routing key ${routingKey}`
      );
    } else {
      logger.warn(
        `Failed to publish message to ${exchangeName} with routing key ${routingKey}`
      );
    }

    return result;
  } catch (error) {
    logger.error(`Failed to publish message: ${error.message}`);
    return false;
  }
};

/**
 * Đóng kết nối RabbitMQ
 * @returns {Promise<boolean>} - Kết quả đóng kết nối
 */
const close = async () => {
  try {
    if (channel) {
      await channel.close();
      logger.info("RabbitMQ channel closed");
    }

    if (connection) {
      await connection.close();
      logger.info("RabbitMQ connection closed");
    }

    return true;
  } catch (error) {
    logger.error(`Failed to close RabbitMQ connection: ${error.message}`);
    return false;
  }
};

module.exports = {
  connect,
  setupExchanges,
  registerConsumer,
  publishToExchange,
  close,
  EXCHANGES,
  ROUTING_KEYS,
};
