const amqp = require("amqplib");

// Cấu hình kết nối RabbitMQ
const rabbitConfig = {
  url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  options: {
    credentials: amqp.credentials.plain(
      process.env.RABBITMQ_USER || "guest",
      process.env.RABBITMQ_PASSWORD || "guest"
    ),
  },
};

// Biến lưu trữ kết nối và channel
let connection = null;
let channel = null;

// Kết nối đến RabbitMQ
const connect = async () => {
  try {
    // Tạo kết nối
    connection = await amqp.connect(rabbitConfig.url, rabbitConfig.options);
    console.log("Connected to RabbitMQ");

    // Xử lý sự kiện đóng kết nối
    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      // Thử kết nối lại sau 5 giây
      setTimeout(connect, 5000);
    });

    // Xử lý lỗi kết nối
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      // Đóng kết nối nếu có lỗi
      if (connection) {
        connection.close();
      }
    });

    // Tạo channel
    channel = await connection.createChannel();
    console.log("RabbitMQ channel created");

    return { connection, channel };
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    // Thử kết nối lại sau 5 giây
    setTimeout(connect, 5000);
    return null;
  }
};

// Đóng kết nối
const close = async () => {
  try {
    if (channel) {
      await channel.close();
      console.log("RabbitMQ channel closed");
    }
    if (connection) {
      await connection.close();
      console.log("RabbitMQ connection closed");
    }
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }
};

// Lấy channel hiện tại hoặc tạo mới nếu chưa có
const getChannel = async () => {
  if (!channel) {
    const result = await connect();
    if (result) {
      return result.channel;
    }
    return null;
  }
  return channel;
};

// Lấy kết nối hiện tại hoặc tạo mới nếu chưa có
const getConnection = async () => {
  if (!connection) {
    const result = await connect();
    if (result) {
      return result.connection;
    }
    return null;
  }
  return connection;
};

module.exports = {
  connect,
  close,
  getChannel,
  getConnection,
};
