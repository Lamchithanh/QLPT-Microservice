const { getChannel } = require("./connection");

// Danh sách các exchange
const EXCHANGES = {
  USER_EVENTS: "user.events",
  APARTMENT_EVENTS: "apartment.events",
  PAYMENT_EVENTS: "payment.events",
  NOTIFICATION_EVENTS: "notification.events",
};

// Danh sách các routing key
const ROUTING_KEYS = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",

  // Apartment events
  APARTMENT_CREATED: "apartment.created",
  APARTMENT_UPDATED: "apartment.updated",
  APARTMENT_DELETED: "apartment.deleted",
  ROOM_CREATED: "room.created",
  ROOM_UPDATED: "room.updated",
  ROOM_DELETED: "room.deleted",

  // Payment events
  CONTRACT_CREATED: "contract.created",
  CONTRACT_UPDATED: "contract.updated",
  CONTRACT_TERMINATED: "contract.terminated",
  INVOICE_CREATED: "invoice.created",
  INVOICE_UPDATED: "invoice.updated",
  INVOICE_PAID: "invoice.paid",
  PAYMENT_CREATED: "payment.created",

  // Notification events
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_READ: "notification.read",
};

// Khởi tạo các exchange
const setupExchanges = async () => {
  try {
    const channel = await getChannel();
    if (!channel) {
      throw new Error("Could not get RabbitMQ channel");
    }

    // Tạo các exchange với loại topic
    for (const exchange of Object.values(EXCHANGES)) {
      await channel.assertExchange(exchange, "topic", { durable: true });
      console.log(`Exchange ${exchange} asserted`);
    }

    return true;
  } catch (error) {
    console.error("Error setting up exchanges:", error);
    return false;
  }
};

// Publish message đến exchange với routing key
const publishMessage = async (exchange, routingKey, message) => {
  try {
    const channel = await getChannel();
    if (!channel) {
      throw new Error("Could not get RabbitMQ channel");
    }

    // Chuyển đổi message thành buffer
    const messageBuffer = Buffer.from(JSON.stringify(message));

    // Publish message
    const result = channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true, // Lưu message vào disk để đảm bảo không mất khi RabbitMQ restart
      contentType: "application/json",
      timestamp: Date.now(),
    });

    if (result) {
      console.log(
        `Message published to ${exchange} with routing key ${routingKey}`
      );
    } else {
      console.warn(
        `Failed to publish message to ${exchange} with routing key ${routingKey}`
      );
    }

    return result;
  } catch (error) {
    console.error("Error publishing message:", error);
    return false;
  }
};

// Publish user event
const publishUserEvent = async (routingKey, data) => {
  return publishMessage(EXCHANGES.USER_EVENTS, routingKey, data);
};

// Publish apartment event
const publishApartmentEvent = async (routingKey, data) => {
  return publishMessage(EXCHANGES.APARTMENT_EVENTS, routingKey, data);
};

// Publish payment event
const publishPaymentEvent = async (routingKey, data) => {
  return publishMessage(EXCHANGES.PAYMENT_EVENTS, routingKey, data);
};

// Publish notification event
const publishNotificationEvent = async (routingKey, data) => {
  return publishMessage(EXCHANGES.NOTIFICATION_EVENTS, routingKey, data);
};

module.exports = {
  EXCHANGES,
  ROUTING_KEYS,
  setupExchanges,
  publishMessage,
  publishUserEvent,
  publishApartmentEvent,
  publishPaymentEvent,
  publishNotificationEvent,
};
