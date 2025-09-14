const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,      // SSL
  secure: true,   // must be true for port 465
  auth: {
    user: process.env.ZOHO_EMAIL, // support@pvbonline.online
    pass: process.env.ZOHO_PASS,  // Zoho app password
  },
});

const sendEmail = async (options) => {
  await transporter.sendMail({
    from: `"PVNB Support" <${process.env.ZOHO_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  });
};

module.exports = sendEmail;
