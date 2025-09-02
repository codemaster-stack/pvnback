// config/email.js
const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,      // e.g., smtp.gmail.com or smtp.mailtrap.io
    port: process.env.EMAIL_PORT,      // 465 (SSL) or 587 (TLS)
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

module.exports = createTransporter;
