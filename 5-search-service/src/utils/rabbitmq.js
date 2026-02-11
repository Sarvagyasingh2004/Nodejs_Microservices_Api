const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ(retries = 5) {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    logger.error(`RabbitMQ connection failed. Retries left: ${retries}`, error);

    if (retries > 0) {
      await new Promise((res) => setTimeout(res, 5000));
      return connectToRabbitMQ(retries - 1);
    }

    throw error;
  }
}
async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
    throw new Error("RabbitMQ channel not initialized");
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

  channel.consume(q.queue, (msg) => {
    if (msg) {
      callback(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    }
  });

  logger.info(`Subscribed to event: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, consumeEvent };
