// // utils/sendEmail.js
// const nodemailer = require("nodemailer");


// // utils/sendEmail.js
// const createTransporter = require("../config/email");

// const sendEmail = async (options) => {
//   const transporter = createTransporter();

//   const mailOptions = {
//     from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
//     to: options.email,
//     subject: options.subject,
//     html: options.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;



// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL, // support@pvbonline.online
      pass: process.env.ZOHO_PASS,  // your Zoho app password
    },
  });

  const mailOptions = {
    from: `"PVNB Support" <${process.env.ZOHO_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
