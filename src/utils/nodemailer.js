import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config()

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPassword) {
  throw new Error("SMTP credentials are missing in environment variables.");
}

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: smtpUser,
    pass: smtpPassword
  }
});

export default transporter;