
// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASS,
    },
  });

  const mailOptions = {
    from: `"PVNB Support" <${process.env.ZOHO_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html, // optional
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
