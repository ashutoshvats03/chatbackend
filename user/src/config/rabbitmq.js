import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();


export let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST,
            port: process.env.RABBITMQ_PORT,
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASSWORD
        });
        channel = await connection.createChannel();
        console.log("RabbitMQ connected ✔️");
    } catch (error) {
        console.error("RabbitMQ connection error:", error);
    }
};

export const publishToQueue = async (queueName, message) => {
    if (!channel) {
        consol.log("RabbitMQ not connected");
        return;
    }
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
};