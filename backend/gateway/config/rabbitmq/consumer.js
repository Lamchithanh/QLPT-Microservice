const { getChannel } = require("./connection");
const { EXCHANGES } = require("./publisher");

// Danh sách các queue
const QUEUES = {
  // User service queues
  USER_SERVICE_NOTIFICATIONS: "user-service.notifications",
  USER_SERVICE_EVENTS: "user-service.events",

  // Apartment service queues
  APARTMENT_SERVICE_NOTIFICATIONS: "apartment-service.notifications",
  APARTMENT_SERVICE_EVENTS: "apartment-service.events",

  // Payment service queues
  PAYMENT_SERVICE_NOTIFICATIONS: "payment-service.notifications",
  PAYMENT_SERVICE_EVENTS: "payment-service.events",

  // Gateway queues
  GATEWAY_NOTIFICATIONS: "gateway.notifications",
  GATEWAY_EVENTS: "gateway.events",
};

// Khởi tạo các queue và binding
const setupQueues = async () => {
  try {
    const channel = await getChannel();
    if (!channel) {
      throw new Error("Could not get RabbitMQ channel");
    }

    // Tạo các queue
    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true });
      console.log(`Queue ${queue} asserted`);
    }

    // Binding các queue với exchange và routing key

    // User service bindings
    await channel.bindQueue(
      QUEUES.USER_SERVICE_EVENTS,
      EXCHANGES.USER_EVENTS,
      "#"
    );
    await channel.bindQueue(
      QUEUES.USER_SERVICE_NOTIFICATIONS,
      EXCHANGES.NOTIFICATION_EVENTS,
      "notification.#"
    );

    // Apartment service bindings
    await channel.bindQueue(
      QUEUES.APARTMENT_SERVICE_EVENTS,
      EXCHANGES.APARTMENT_EVENTS,
      "#"
    );
    await channel.bindQueue(
      QUEUES.APARTMENT_SERVICE_NOTIFICATIONS,
      EXCHANGES.NOTIFICATION_EVENTS,
      "notification.#"
    );

    // Payment service bindings
    await channel.bindQueue(
      QUEUES.PAYMENT_SERVICE_EVENTS,
      EXCHANGES.PAYMENT_EVENTS,
      "#"
    );
    await channel.bindQueue(
      QUEUES.PAYMENT_SERVICE_NOTIFICATIONS,
      EXCHANGES.NOTIFICATION_EVENTS,
      "notification.#"
    );

    // Gateway bindings - nhận tất cả các events
    await channel.bindQueue(QUEUES.GATEWAY_EVENTS, EXCHANGES.USER_EVENTS, "#");
    await channel.bindQueue(
      QUEUES.GATEWAY_EVENTS,
      EXCHANGES.APARTMENT_EVENTS,
      "#"
    );
    await channel.bindQueue(
      QUEUES.GATEWAY_EVENTS,
      EXCHANGES.PAYMENT_EVENTS,
      "#"
    );
    await channel.bindQueue(
      QUEUES.GATEWAY_NOTIFICATIONS,
      EXCHANGES.NOTIFICATION_EVENTS,
      "#"
    );

    console.log("All queues bound to exchanges");
    return true;
  } catch (error) {
    console.error("Error setting up queues:", error);
    return false;
  }
};

// Consume messages từ queue
const consumeMessages = async (queue, callback) => {
  try {
    const channel = await getChannel();
    if (!channel) {
      throw new Error("Could not get RabbitMQ channel");
    }

    // Consume messages
    await channel.consume(queue, (message) => {
      if (message) {
        try {
          // Parse message
          const content = JSON.parse(message.content.toString());
          const routingKey = message.fields.routingKey;
          const exchange = message.fields.exchange;

          // Gọi callback với thông tin message
          callback(null, {
            content,
            routingKey,
            exchange,
            properties: message.properties,
          });

          // Acknowledge message
          channel.ack(message);
        } catch (error) {
          console.error(`Error processing message from ${queue}:`, error);
          // Reject message và đưa lại vào queue để xử lý lại
          channel.nack(message, false, true);
          callback(error);
        }
      }
    });

    console.log(`Started consuming messages from ${queue}`);
    return true;
  } catch (error) {
    console.error(`Error consuming messages from ${queue}:`, error);
    return false;
  }
};

module.exports = {
  QUEUES,
  setupQueues,
  consumeMessages,
};
