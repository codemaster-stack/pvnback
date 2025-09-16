// config/email.js
const nodemailer = require("nodemailer");

const emailTransporter = nodemailer.createTransport({
  host: "smtp.zoho.com",   // Zoho SMTP server
  port: 465,               // Use 465 for SSL
  secure: true,            // true = SSL, false = TLS
  auth: {
    user: process.env.EMAIL_USER, // your Zoho email e.g. name@pvbonline.online
    pass: process.env.EMAIL_PASS, // your Zoho email password or app password
  },
});

module.exports = emailTransporter;
