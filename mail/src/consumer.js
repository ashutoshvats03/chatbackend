import amqp from "amqplib";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

export const startSendOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST,
            port: process.env.RABBITMQ_PORT,
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASSWORD
        });
        const channel = await connection.createChannel();
        await channel.assertQueue("send_otp", { durable: true });
        console.log("mail service consumer started, listening for otp emails ✔️");
        channel.consume("send_otp", async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString());
                    console.log("to", to);
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        auth: {
                            user: process.env.EMAIL,
                            pass: process.env.PASSWORD,
                        },
                    });
                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: to,
                        subject: subject,
                        text: body,
                    };
                    await transporter.sendMail(mailOptions);
                    console.log("Email sent successfully");
                    channel.ack(msg);
                }
                catch (error) {
                    console.log("failer to send otp", error);
                }
            }
        })
    }
    catch (error) {
        console.log("failer to start rabbitmq comsumer", error);
    }
}