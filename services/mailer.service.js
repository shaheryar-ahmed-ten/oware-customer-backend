const nodemailer = require('nodemailer');
const fs = require('fs');
const ejs = require('ejs');


const Mailclient = nodemailer.createTransport({
  host: process.env.MAILER_HOST || "smtp.gmail.com",
  secureConnection: false,
  port: process.env.MAILER_PORT || 587,
  authentication: 'OAuth',
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD
  }
});

async function sendMail(payload) {
  let mailOptions = {
    from: (payload.senderName ? `${payload.senderName} <${process.env.MAILER_EMAIL}> ` : process.env.MAILER_EMAIL),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  };
  let response = null;
  try {
    response = await Mailclient.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
  return response;
}

//module.exports = { sendCustomerInquiryEmail };
